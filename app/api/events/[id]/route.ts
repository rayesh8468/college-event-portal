import { NextRequest, NextResponse } from "next/server";
import { parseBody, requireAuth, success, errorResponse, requireAdmin, getOr404 } from "@/lib/api-helpers";
import { tables } from "@/lib/dynamodb";
import { docClient } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]
 *   Returns: single event by ID
 *
 * PUT /api/events/[id]
 *   Body: partial event update data (HOD/Admin only)
 *   Returns: updated event
 *
 * DELETE /api/events/[id]
 *   (HOD/Admin only) — cancels the event
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await getOr404<any>(tables.events, { eventId: id });
    return NextResponse.json({ event });
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const { id } = await params;

    // Verify event exists
    const existing = await getOr404<any>(tables.events, { eventId: id });

    const body = await parseBody<any>(request);

    // Build update object
    const updates: Record<string, unknown> = {};
    const allowedFields = [
      "title",
      "description",
      "venue",
      "maxParticipants",
      "registrationFee",
      "category",
      "eventType",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "teamSize",
      "pointsAwarded",
      "requiresOD",
      "status",
      "isWorkingDay",
      "organizerUserId",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Update in DynamoDB — only send fields that have values
    if (Object.keys(updates).length > 0) {
      await docClient.send(
        new UpdateCommand({
          TableName: tables.events,
          Key: { eventId: id },
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
              acc[` :v${i}`] = v;
              return acc;
            },
            {}
          ),
          ReturnValues: "ALL_NEW",
        })
      );
    }

    // Fetch updated event
    const updated = await getOr404<any>(tables.events, { eventId: id });
    return NextResponse.json({ event: updated });
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const { id } = await params;

    // Verify event exists
    const event = await getOr404<any>(tables.events, { eventId: id });

    // Update status to cancelled
    await docClient.send(
      new UpdateCommand({
        TableName: tables.events,
        Key: { eventId: id },
        UpdateExpression: "SET #st = :st",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":st": "cancelled" },
      })
    );

    return NextResponse.json({ success: true, message: "Event cancelled" });
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel event" }, { status: 500 });
  }
}
