import { NextRequest, NextResponse } from "next/server";
import { parseBody, requireAuth, errorResponse, getOr404, generateId, todayISO } from "@/lib/api-helpers";
import { tables } from "@/lib/dynamodb";
import { docClient } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

/**
 * POST /api/register
 *   Registers the authenticated user for an event.
 *   Creates: Registration + optional Payment + optional ODRequest
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await parseBody<{ eventId: string }>(request);
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Fetch event
    const event = await getOr404<any>(tables.events, { eventId });
    if (event.status === "cancelled" || event.status === "completed") {
      return NextResponse.json(
        { error: "This event is not open for registration" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingReg = await docClient.send(
      new GetCommand({
        TableName: tables.registrations,
        Key: { eventId, userId: user.userId },
      })
    );
    if (existingReg.Item) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }

    // Check capacity
    const currentCount = event.confirmedCount || 0;
    if (currentCount >= event.maxParticipants) {
      return NextResponse.json(
        { error: "This event is full. You will be added to the waitlist." },
        { status: 400 }
      );
    }

    // Create registration
    const registrationId = generateId("REG", 6);
    const now = new Date().toISOString();

    const registration: Record<string, unknown> = {
      registrationId,
      eventId,
      userId: user.userId,
      status: "pending",
      registeredAt: now,
      paymentStatus: event.registrationFee > 0 ? "pending" : "paid",
      amountPaid: event.registrationFee > 0 ? 0 : 0,
    };

    await docClient.send(
      new PutCommand({
        TableName: tables.registrations,
        Item: registration,
      })
    );

    // Create payment record if event has a fee
    if (event.registrationFee > 0) {
      const paymentId = generateId("PAY", 6);
      const payment: Record<string, unknown> = {
        paymentId,
        registrationId,
        userId: user.userId,
        eventId: eventId,
        amount: event.registrationFee,
        currency: "INR",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      await docClient.send(
        new PutCommand({
          TableName: tables.payments,
          Item: payment,
        })
      );
      registration["paymentId"] = paymentId;
    }

    // Auto-create OD request if event requires OD and is on a working day
    if (event.requiresOD && event.isWorkingDay) {
      const odRequestId = generateId("ODR", 5);
      const odRequest: Record<string, unknown> = {
        odRequestId,
        userId: user.userId,
        userName: user.name,
        eventId,
        eventTitle: event.title,
        departmentCode: event.departmentCode,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        status: "pending",
        referenceNumber: `ODR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
        createdBy: user.userId,
        createdAt: now,
        classAdvisorNotified: false,
      };
      await docClient.send(
        new PutCommand({
          TableName: tables.odRequests,
          Item: odRequest,
        })
      );
      registration["odRequestId"] = odRequestId;
    }

    // Update event participant count
    await docClient.send(
      new UpdateCommand({
        TableName: tables.events,
        Key: { eventId },
        UpdateExpression: "ADD #pc :inc",
        ExpressionAttributeNames: { "#pc": "participantCount" },
        ExpressionAttributeValues: { ":inc": 1 },
      })
    );

    // Award points for registering (if configured)
    const pointsForRegistration = event.pointsAwarded?.participant || 0;
    if (pointsForRegistration > 0) {
      await awardPoints(user.userId, event, pointsForRegistration, "registered");
    }

    // Generate email confirmation content (mock - SES not available in demo)
    const emailConfirmation = {
      to: user.email,
      subject: `Registration Confirmed: ${event.title}`,
      body: `Dear ${user.name},

Your registration for "${event.title}" has been confirmed!

Event Details:
- Date: ${event.startDate}
- Time: ${event.startTime} - ${event.endTime}
- Venue: ${event.venue}
- Fee: ${event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}

Registration ID: ${registrationId}

This is a confirmation email. No action is required.

Best regards,
VIT Event Portal Team
support@vit.ac.in
    `,
    };

    return NextResponse.json({
      registration: {
        ...registration,
        event: {
          eventId: event.eventId,
          title: event.title,
          registrationFee: event.registrationFee,
        },
      },
      message: event.registrationFee > 0
        ? "Registration successful. Please complete payment to confirm."
        : "Registration successful!",
      emailConfirmation,
      mockEmailSent: true, // Indicates this is a mock email (SES not available)
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

async function awardPoints(
  userId: string,
  event: any,
  points: number,
  reason: string
) {
  const now = new Date().toISOString();
  const pointsItem = await docClient.send(
    new GetCommand({
      TableName: tables.activityPoints,
      Key: { userId },
    })
  );

  if (pointsItem.Item) {
    // Update existing - use any to handle categories flexibly
    const updated = {
      ...pointsItem.Item,
      totalPoints: (pointsItem.Item.totalPoints || 0) + points,
      lastUpdated: now,
      categories: {
        ...(pointsItem.Item.categories || {}),
        [event.category]: ((pointsItem.Item.categories as Record<string, number>)?.[event.category] || 0) + points,
      },
    };
    await docClient.send(
      new PutCommand({
        TableName: tables.activityPoints,
        Item: updated,
      })
    );
  } else {
    // Create new
    const categories: Record<string, number> = {
      Technical: 0,
      Cultural: 0,
      Sports: 0,
      Social: 0,
      Leadership: 0,
      [event.category]: points,
    };
    await docClient.send(
      new PutCommand({
        TableName: tables.activityPoints,
        Item: {
          userId,
          totalPoints: points,
          requiredPoints: 100,
          categories,
          lastUpdated: now,
        },
      })
    );
  }
}
