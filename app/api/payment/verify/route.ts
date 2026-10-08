import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { tables, docClient } from "@/lib/dynamodb";
import { ScanCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

/**
 * POST /api/payment/verify
 *   Verifies a payment and updates registration status.
 *   Body: { paymentId }
 *   Returns: { success: true, payment: {...}, message: "..." }
 *
 * In demo mode, simulates payment verification.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      );
    }

    // Find the payment record by scanning the payments table
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tables.payments,
        FilterExpression: "paymentId = :paymentId",
        ExpressionAttributeValues: { ":paymentId": paymentId },
      })
    );

    const payments = scanResult.Items || [];

    if (payments.length === 0) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const payment = payments[0] as any;

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== user.userId) {
      return NextResponse.json(
        { error: "Unauthorized: payment does not belong to you" },
        { status: 403 }
      );
    }

    // Update payment status to paid
    await docClient.send(
      new UpdateCommand({
        TableName: tables.payments,
        Key: { paymentId },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":status": "paid",
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    // Update registration status to confirmed
    const registration = await docClient.send(
      new GetCommand({
        TableName: tables.registrations,
        Key: {
          eventId: payment.eventId,
          userId: user.userId,
        },
      })
    );

    if (registration.Item) {
      await docClient.send(
        new UpdateCommand({
          TableName: tables.registrations,
          Key: { eventId: payment.eventId, userId: user.userId },
          UpdateExpression:
            "SET #status = :status, paymentStatus = :paymentStatus, confirmedAt = :confirmedAt",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: {
            ":status": "confirmed",
            ":paymentStatus": "paid",
            ":confirmedAt": new Date().toISOString(),
          },
        })
      );

      // Update event confirmed count
      await docClient.send(
        new UpdateCommand({
          TableName: tables.events,
          Key: { eventId: payment.eventId },
          UpdateExpression: "ADD confirmedCount :inc",
          ExpressionAttributeValues: { ":inc": 1 },
        })
      );
    }

    return NextResponse.json({
      success: true,
      payment: { ...payment, status: "paid" },
      message: "Payment verified successfully! Your registration is now confirmed.",
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/payment/verify error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/verify?paymentId=xxx
 *   Get payment status by paymentId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      );
    }

    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tables.payments,
        FilterExpression: "paymentId = :paymentId",
        ExpressionAttributeValues: { ":paymentId": paymentId },
      })
    );

    const payments = scanResult.Items || [];

    if (payments.length === 0) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment: payments[0] });
  } catch (error) {
    console.error("GET /api/payment/verify error:", error);
    return NextResponse.json(
      { error: "Failed to get payment status" },
      { status: 500 }
    );
  }
}
