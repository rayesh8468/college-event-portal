import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireHOD, errorResponse, getOr404, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/attendance
 *   Query params: ?eventId=
 *   Returns: list of participants for the event with attendance status
 *   HOD/Admin only
 *
 * POST /api/attendance
 *   Mark a user as attended via QR scan or manual selection
 *   Body: { eventId, userId } or { eventId, qrCode }
 *   Also supports bulk: { eventId, userIds: string[] }
 *   Returns: attendance result
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireHOD(user);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Get all registrations for this event
    const regResult = await docClient.send(
      new QueryCommand({
        TableName: tables.registrations,
        KeyConditionExpression: "#eid = :eid",
        ExpressionAttributeNames: { "#eid": "eventId" },
        ExpressionAttributeValues: { ":eid": eventId },
      })
    );

    const registrations = regResult.Items || [];

    // Fetch user details for each registration
    const participants = await Promise.all(
      registrations.map(async (reg: any) => {
        const userResult = await docClient.send(
          new GetCommand({
            TableName: tables.users,
            Key: { userId: reg.userId },
          })
        );
        const userData = userResult.Item as any;
        return {
          registration: reg,
          user: userData || null,
          isAttended: reg.status === "attended",
        };
      })
    );

    return NextResponse.json({
      eventId,
      participants,
      attendedCount: participants.filter((p) => p.isAttended).length,
      totalCount: participants.length,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireHOD(auth);

    const body = await request.json();
    const { eventId, userId, userIds, qrCode } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await docClient.send(
      new GetCommand({
        TableName: tables.events,
        Key: { eventId },
      })
    );

    if (!event.Item) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const results: any[] = [];

    // Handle single user
    if (userId) {
      const result = await markAttendance(userId, eventId, auth.userId, now);
      results.push(result);
      return NextResponse.json({
        success: result.success,
        results,
        attendedCount: result.success ? 1 : 0,
      });
    }

    // Handle bulk users
    if (userIds && Array.isArray(userIds)) {
      let successCount = 0;
      for (const uid of userIds) {
        const result = await markAttendance(uid, eventId, auth.userId, now);
        results.push(result);
        if (result.success) successCount++;
      }
      return NextResponse.json({
        success: true,
        results,
        attendedCount: successCount,
        totalCount: userIds.length,
      });
    }

    // Handle QR code
    if (qrCode) {
      // QR code should contain userId (format: "USER-{userId}")
      const extractedUserId = qrCode.replace(/^USER-/, "");
      const result = await markAttendance(extractedUserId, eventId, auth.userId, now);
      results.push(result);
      return NextResponse.json({
        success: result.success,
        results,
        attendedCount: result.success ? 1 : 0,
      });
    }

    return NextResponse.json(
      { error: "userId, userIds, or qrCode is required" },
      { status: 400 }
    );
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}

async function markAttendance(
  targetUserId: string,
  eventId: string,
  markedBy: string,
  timestamp: string
): Promise<any> {
  // Check if user is registered for this event
  const regResult = await docClient.send(
    new GetCommand({
      TableName: tables.registrations,
      Key: { eventId, userId: targetUserId },
    })
  );

  if (!regResult.Item) {
    return {
      success: false,
      userId: targetUserId,
      eventId,
      error: "Not registered for this event",
    };
  }

  const registration = regResult.Item as any;

  // Check if already attended
  if (registration.status === "attended") {
    return {
      success: false,
      userId: targetUserId,
      eventId,
      error: "Already marked as attended",
      alreadyAttended: true,
    };
  }

  // Update registration to attended
  await docClient.send(
    new UpdateCommand({
      TableName: tables.registrations,
      Key: { eventId, userId: targetUserId },
      UpdateExpression: "SET #st = :st, attendedAt = :at",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":st": "attended",
        ":at": timestamp,
      },
    })
  );

  // Update event confirmedCount
  await docClient.send(
    new UpdateCommand({
      TableName: tables.events,
      Key: { eventId },
      UpdateExpression: "ADD #cc :inc",
      ExpressionAttributeNames: { "#cc": "confirmedCount" },
      ExpressionAttributeValues: { ":inc": 1 },
    })
  );

  // Update user reliability score (+5 for attending)
  const userResult = await docClient.send(
    new GetCommand({
      TableName: tables.users,
      Key: { userId: targetUserId },
    })
  );

  let newReliabilityScore = 0;
  if (userResult.Item) {
    const user = userResult.Item as any;
    newReliabilityScore = Math.min(100, (user.reliabilityScore || 100) + 5);
    await docClient.send(
      new UpdateCommand({
        TableName: tables.users,
        Key: { userId: targetUserId },
        UpdateExpression: "SET #rs = :rs",
        ExpressionAttributeNames: { "#rs": "reliabilityScore" },
        ExpressionAttributeValues: { ":rs": newReliabilityScore },
      })
    );
  }

  // Award activity points if configured
  const eventResult = await docClient.send(
    new GetCommand({
      TableName: tables.events,
      Key: { eventId },
    })
  );

  if (eventResult.Item) {
    const eventData = eventResult.Item as any;
    const pointsToAward = eventData.pointsAwarded?.participant || 0;
    if (pointsToAward > 0) {
      const pointsItem = await docClient.send(
        new GetCommand({
          TableName: tables.activityPoints,
          Key: { userId: targetUserId },
        })
      );

      if (pointsItem.Item) {
        // Use explicit any typing for flexible category handling
        const existingCategories = (pointsItem.Item.categories as Record<string, number>) || {};
        const updatedCategories = {
          ...existingCategories,
          [eventData.category]: (existingCategories[eventData.category] || 0) + pointsToAward,
        };
        const updated: Record<string, unknown> = {
          ...pointsItem.Item,
          totalPoints: (pointsItem.Item.totalPoints || 0) + pointsToAward,
          lastUpdated: timestamp,
          categories: updatedCategories,
        };
        await docClient.send(
          new PutCommand({
            TableName: tables.activityPoints,
            Item: updated,
          })
        );
      } else {
        const categories: Record<string, number> = {
          Technical: 0,
          Cultural: 0,
          Sports: 0,
          Social: 0,
          Leadership: 0,
        };
        categories[eventData.category as keyof typeof categories] = pointsToAward;
        await docClient.send(
          new PutCommand({
            TableName: tables.activityPoints,
            Item: {
              userId: targetUserId,
              totalPoints: pointsToAward,
              requiredPoints: 100,
              categories,
              lastUpdated: timestamp,
            },
          })
        );
      }
    }
  }

  return {
    success: true,
    userId: targetUserId,
    eventId,
    registrationId: registration.registrationId,
    markedAt: timestamp,
    markedBy,
    newReliabilityScore,
  };
}
