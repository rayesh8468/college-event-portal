import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, parseBody, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const eventId = searchParams.get("eventId") || undefined;

    const scanParams: any = {
      TableName: tables.payments,
      Limit: 200,
    };

    const filterParts: string[] = [];
    const attrNames: Record<string, string> = {};
    const attrVals: Record<string, unknown> = {};
    let idx = 0;

    if (status) {
      attrNames[`#s${idx}`] = "status";
      attrVals[`:s${idx}`] = status;
      filterParts.push(`#s${idx} = :s${idx}`);
      idx++;
    }
    if (userId) {
      attrNames[`#u${idx}`] = "userId";
      attrVals[`:u${idx}`] = userId;
      filterParts.push(`#u${idx} = :u${idx}`);
      idx++;
    }
    if (eventId) {
      attrNames[`#e${idx}`] = "eventId";
      attrVals[`:e${idx}`] = eventId;
      filterParts.push(`#e${idx} = :e${idx}`);
      idx++;
    }

    if (filterParts.length > 0) {
      scanParams.FilterExpression = filterParts.join(" AND ");
      scanParams.ExpressionAttributeNames = attrNames;
      scanParams.ExpressionAttributeValues = attrVals;
    }

    const result = await docClient.send(new ScanCommand(scanParams));
    const payments = (result.Items || []).map((p: any) => ({
      paymentId: p.paymentId,
      registrationId: p.registrationId,
      userId: p.userId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      razorpayPaymentId: p.razorpayPaymentId,
    }));

    const totalAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      total: payments.length,
      totalAmount,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await parseBody<any>(request);
    const { paymentId, status, refundAmount } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const now = new Date().toISOString();

    if (status) {
      if (!["pending", "paid", "failed", "refunded", "partially_refunded"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
    }

    updates.updatedAt = now;

    await docClient.send(
      new UpdateCommand({
        TableName: tables.payments,
        Key: { paymentId },
        UpdateExpression: `SET ${Object.keys(updates).map((k, i) => `#f${i} = :v${i}`).join(", ")}`,
        ExpressionAttributeNames: Object.keys(updates).reduce(
          (acc: Record<string, string>, k, i) => {
            acc[`#f${i}`] = k;
            return acc;
          },
          {}
        ),
        ExpressionAttributeValues: Object.values(updates).reduce(
          (acc: Record<string, unknown>, v, i) => {
            acc[`:v${i}`] = v;
            return acc;
          },
          {}
        ),
      })
    );

    const updated = await docClient.send(
      new GetCommand({
        TableName: tables.payments,
        Key: { paymentId },
      })
    );

    return NextResponse.json({ payment: updated.Item });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/payments error:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
