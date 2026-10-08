import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { tables, docClient } from "@/lib/dynamodb";
import { ScanCommand, ScanCommandInput, GetCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/my-registrations?userId={userId}
 * Returns all registrations for a user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || user.userId;

    // Scan registrations table for user's registrations
    const params: ScanCommandInput = {
      TableName: tables.registrations,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    };

    const result = await docClient.send(new ScanCommand(params));
    const registrations = (result.Items ?? []) as any[];

    // Fetch event details for each registration using GetCommand (eventId is PK)
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        try {
          const eventResult = await docClient.send(
            new GetCommand({
              TableName: tables.events,
              Key: { eventId: reg.eventId },
            })
          );
          const event = eventResult.Item || null;
          return { ...reg, event };
        } catch {
          return { ...reg, event: null };
        }
      })
    );

    return NextResponse.json({ registrations: registrationsWithEvents });
  } catch (error) {
    console.error("GET /api/my-registrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
