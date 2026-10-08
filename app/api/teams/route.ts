import { NextRequest, NextResponse } from "next/server";
import { parseBody, requireAuth, errorResponse, getOr404, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/teams
 *   Query params: ?eventId=&userId=
 *   Returns: list of teams
 *   Students see teams for events they're registered for or their own team.
 *   HOD/Admin see all teams for an event.
 *
 * POST /api/teams
 *   Body: { eventId, teamName? }
 *   Create a new team (Student only).
 *   Returns: created team with teamCode.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId") || user.userId;

    let teams: any[] = [];

    if (eventId) {
      // Query teams by eventId using EventTeamsIndex GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: tables.teams,
          IndexName: "EventTeamsIndex",
          KeyConditionExpression: "#eid = :eid",
          ExpressionAttributeNames: { "#eid": "eventId" },
          ExpressionAttributeValues: { ":eid": eventId },
        })
      );
      teams = result.Items || [];

      // Students only see teams for events they're registered for
      if (user.role === "Students") {
        teams = teams.filter((t: any) => t.leaderUserId === user.userId);
      }
    } else {
      // Without eventId, query by userId using UserTeamsIndex GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: tables.teams,
          IndexName: "UserTeamsIndex",
          KeyConditionExpression: "#uid = :uid",
          ExpressionAttributeNames: { "#uid": "userId" },
          ExpressionAttributeValues: { ":uid": userId },
        })
      );
      teams = result.Items || [];
    }

    return NextResponse.json({ teams, total: teams.length });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/teams error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "Students") {
      return NextResponse.json(
        { error: "Only students can create teams" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, teamName } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Verify event exists and allows team registration
    const event = await docClient.send(
      new GetCommand({
        TableName: tables.events,
        Key: { eventId },
      })
    );

    if (!event.Item) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = event.Item as any;
    if (!eventData.teamSize) {
      return NextResponse.json(
        { error: "This event does not support team registration" },
        { status: 400 }
      );
    }

    // Check if user already has a team for this event
    const existingCheck = await docClient.send(
      new QueryCommand({
        TableName: tables.teams,
        IndexName: "EventTeamsIndex",
        KeyConditionExpression: "#eid = :eid",
        FilterExpression: "#uid = :uid",
        ExpressionAttributeNames: { "#eid": "eventId", "#uid": "leaderUserId" },
        ExpressionAttributeValues: { ":eid": eventId, ":uid": user.userId },
      })
    );

    if (existingCheck.Items && existingCheck.Items.length > 0) {
      return NextResponse.json(
        { error: "You already have a team for this event" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const teamId = generateId("TM", 8);
    const teamCode = generateId("TC", 4).toUpperCase();

    // Fetch user details from Users table
    const userRecord = await docClient.send(
      new GetCommand({
        TableName: tables.users,
        Key: { userId: user.userId },
      })
    );

    const userProfile = userRecord.Item as any;

    const team = {
      teamId,
      teamCode,
      eventId,
      eventTitle: eventData.title,
      leaderUserId: user.userId,
      leaderName: user.name,
      leaderRollNumber: userProfile.rollNumber || "",
      leaderDepartmentCode: userProfile.departmentCode || "",
      status: "forming",
      members: [
        {
          userId: user.userId,
          userName: user.name,
          rollNumber: userProfile.rollNumber || "",
          departmentCode: userProfile.departmentCode || "",
          year: userProfile.year || "",
          role: "leader",
          joinedAt: now,
        },
      ],
      minSize: eventData.teamSize.min,
      maxSize: eventData.teamSize.max,
      createdAt: now,
    };

    // Store team in the dedicated Teams table
    await docClient.send(
      new PutCommand({
        TableName: tables.teams,
        Item: team,
      })
    );

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/teams error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
