import { NextRequest, NextResponse } from "next/server";
import { requireAuth, errorResponse, getOr404, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/feedback
 *   Query params: ?eventId=
 *   Returns: list of feedback for the given event
 *   Students see only their own feedback; HOD/Admin see all
 *
 * POST /api/feedback
 *   Body: { eventId, ratings: { content, venue, organization, overall }, comments? }
 *   Students only — submit feedback for an event
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Query by eventId using the GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: tables.feedback,
        IndexName: "EventFeedbackIndex",
        KeyConditionExpression: "#eid = :eid",
        ExpressionAttributeNames: { "#eid": "eventId" },
        ExpressionAttributeValues: { ":eid": eventId },
        ScanIndexForward: false, // newest first
      })
    );

    let feedbacks = result.Items || [];

    // Students see only their own feedback
    if (user.role === "Students") {
      feedbacks = feedbacks.filter((f: any) => f.userId === user.userId);
    }

    return NextResponse.json({
      feedbacks,
      total: feedbacks.length,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "Students") {
      return NextResponse.json(
        { error: "Only students can submit feedback" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, ratings, comments } = body;

    if (!eventId || !ratings) {
      return NextResponse.json(
        { error: "eventId and ratings are required" },
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

    // Check if already submitted feedback for this event
    const existing = await docClient.send(
      new QueryCommand({
        TableName: tables.feedback,
        KeyConditionExpression: "#eid = :eid AND #uid = :uid",
        ExpressionAttributeNames: { "#eid": "eventId", "#uid": "userId" },
        ExpressionAttributeValues: {
          ":eid": eventId,
          ":uid": user.userId,
        },
      })
    );

    if (existing.Items && existing.Items.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted feedback for this event" },
        { status: 400 }
      );
    }

    // Validate ratings
    const { content, venue, organization, overall } = ratings;
    if (
      content === undefined ||
      venue === undefined ||
      organization === undefined ||
      overall === undefined
    ) {
      return NextResponse.json(
        { error: "All rating fields (content, venue, organization, overall) are required" },
        { status: 400 }
      );
    }

    if (
      content < 1 ||
      content > 5 ||
      venue < 1 ||
      venue > 5 ||
      organization < 1 ||
      organization > 5 ||
      overall < 1 ||
      overall > 5
    ) {
      return NextResponse.json(
        { error: "Ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    const feedbackId = generateId("FB", 6);
    const now = new Date().toISOString();

    const feedback = {
      feedbackId,
      eventId,
      userId: user.userId,
      userName: user.name,
      ratings: {
        content,
        venue,
        organization,
        overall,
      },
      comments: comments?.trim() || undefined,
      submittedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: tables.feedback,
        Item: feedback,
      })
    );

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
