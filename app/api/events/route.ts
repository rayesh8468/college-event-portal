import { NextRequest, NextResponse } from "next/server";
import { parseBody, requireAuth, errorResponse, requireAdmin, queryAll, getOr404 } from "@/lib/api-helpers";
import { tables, docClient, scan } from "@/lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/events
 *   Query params: ?category=&status=&department=&search=&page=&limit=
 *   Returns: list of events with optional filtering
 *
 * POST /api/events
 *   Body: event creation data (HOD/Admin only)
 *   Returns: created event
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const department = searchParams.get("department") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const upcoming = searchParams.get("upcoming") === "true";

    // Build filter conditions
    const conditions: string[] = [];
    const values: Record<string, unknown> = {};
    const names: Record<string, string> = {};

    if (category) {
      conditions.push("#cat = :cat");
      names["#cat"] = "category";
      values[":cat"] = category;
    }

    if (status) {
      conditions.push("#st = :st");
      names["#st"] = "status";
      values[":st"] = status;
    }

    if (department) {
      conditions.push("#dept = :dept");
      names["#dept"] = "departmentCode";
      values[":dept"] = department;
    }

    if (upcoming) {
      conditions.push("#st = :st");
      names["#st"] = "status";
      values[":st"] = "upcoming";
    }

    // If no filters, just return all events ordered by startDate descending
    let queryParams: any = {
      TableName: tables.events,
      Limit: limit,
      ScanIndexForward: false, // newest first
    };

    if (conditions.length > 0) {
      queryParams.KeyConditionExpression = conditions.join(" AND ");
      queryParams.ExpressionAttributeNames = names;
      queryParams.ExpressionAttributeValues = values;

      // If filtering by department, use the DepartmentDateIndex GSI
      if (department && !category && !status) {
        queryParams.IndexName = "DepartmentDateIndex";
        queryParams.KeyConditionExpression = "#dept = :dept";
        queryParams.ExpressionAttributeNames = { "#dept": "departmentCode" };
        queryParams.ExpressionAttributeValues = { ":dept": department };
      }
      // If filtering by status, use the StatusIndex GSI
      else if (status && !category && !department) {
        queryParams.IndexName = "StatusIndex";
        queryParams.KeyConditionExpression = "#st = :st";
        queryParams.ExpressionAttributeNames = { "#st": "status" };
        queryParams.ExpressionAttributeValues = { ":st": status };
      }
      // If filtering by category, use the UpcomingIndex GSI
      else if (category && !status && !department) {
        queryParams.IndexName = "UpcomingIndex";
        queryParams.KeyConditionExpression = "#cat = :cat";
        queryParams.ExpressionAttributeNames = { "#cat": "category" };
        queryParams.ExpressionAttributeValues = { ":cat": category };
      }
    }

    // For search, filter client-side (no full-text index)
    let events: any[];
    if (conditions.length === 0) {
      // Use ScanCommand when no filters (QueryCommand requires partition key)
      events = await scan<any>(tables.events, undefined, undefined, undefined, limit);
    } else {
      events = await queryAll<any>(queryParams);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter(
        (e: any) =>
          e.title?.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower) ||
          e.venue?.toLowerCase().includes(searchLower)
      );
    }

    // If upcoming is requested, also filter by date
    if (upcoming) {
      const today = new Date().toISOString().split("T")[0];
      events = events.filter((e: any) => e.startDate >= today);
    }

    return NextResponse.json({
      events,
      total: events.length,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return errorResponse(500, "Failed to fetch events");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const body = await parseBody<any>(request);

    // Validate required fields (allow falsy values like 0, false)
    const requiredFields = [
      "title",
      "description",
      "departmentCode",
      "category",
      "eventType",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "venue",
      "maxParticipants",
      "registrationFee",
    ];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate event ID
    const eventId = `EVT-${new Date().getFullYear()}-${body.departmentCode}-${String(Date.now()).slice(-4)}`;

    const now = new Date().toISOString();

    // Determine status
    const startDate = new Date(body.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let status: "upcoming" | "ongoing" | "completed" | "cancelled" = "upcoming";
    if (startDate < today) {
      status = "completed";
    }

    const event = {
      eventId,
      title: body.title.trim(),
      description: body.description.trim(),
      departmentCode: body.departmentCode,
      organizerUserId: user.userId,
      category: body.category,
      eventType: body.eventType,
      startDate: body.startDate,
      endDate: body.endDate,
      startTime: body.startTime,
      endTime: body.endTime,
      venue: body.venue.trim(),
      maxParticipants: body.maxParticipants,
      teamSize: body.teamSize || null,
      registrationFee: body.registrationFee,
      status,
      pointsAwarded: body.pointsAwarded || {
        participant: 5,
        volunteer: 10,
      },
      requiresOD: body.requiresOD !== false,
      createdBy: user.userId,
      createdAt: now,
      isWorkingDay: body.isWorkingDay !== false,
      participantCount: 0,
      confirmedCount: 0,
      cancelledCount: 0,
    };

    // Store in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: tables.events,
        Item: event,
      })
    );

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
