import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, errorResponse, getOr404, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/points
 *   Returns: current user's activity points
 *
 * POST /api/points
 *   Award points to a user (HOD/Admin only)
 *   Body: { userId, points, category }
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await docClient.send(
      new GetCommand({
        TableName: tables.activityPoints,
        Key: { userId: user.userId },
      })
    );

    if (!result.Item) {
      // Return default if no points yet
      return NextResponse.json({
        totalPoints: 0,
        requiredPoints: 100,
        categories: {
          Technical: 0,
          Cultural: 0,
          Sports: 0,
          Social: 0,
          Leadership: 0,
        },
        lastUpdated: new Date().toISOString(),
      });
    }

    return NextResponse.json(result.Item);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/points error:", error);
    return NextResponse.json({ error: "Failed to fetch points" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await request.json();
    const { userId, points, category } = body;

    if (!userId || points === undefined || !category) {
      return NextResponse.json(
        { error: "userId, points, and category are required" },
        { status: 400 }
      );
    }

    const validCategories = ["Technical", "Cultural", "Sports", "Social", "Leadership"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    if (points <= 0) {
      return NextResponse.json(
        { error: "Points must be positive" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Get current points
    const existing = await docClient.send(
      new GetCommand({
        TableName: tables.activityPoints,
        Key: { userId },
      })
    );

    let updatedItem: any;
    if (existing.Item) {
      const currentCategories = existing.Item.categories || {
        Technical: 0,
        Cultural: 0,
        Sports: 0,
        Social: 0,
        Leadership: 0,
      };
      currentCategories[category] = (currentCategories[category] || 0) + points;

      updatedItem = {
        ...existing.Item,
        totalPoints: existing.Item.totalPoints + points,
        categories: currentCategories,
        lastUpdated: now,
      };
    } else {
      const initialCategories: Record<string, number> = {
        Technical: 0,
        Cultural: 0,
        Sports: 0,
        Social: 0,
        Leadership: 0,
      };
      initialCategories[category] = points;

      updatedItem = {
        userId,
        totalPoints: points,
        requiredPoints: 100,
        categories: initialCategories,
        lastUpdated: now,
      };
    }

    await docClient.send(
      new PutCommand({
        TableName: tables.activityPoints,
        Item: updatedItem,
      })
    );

    return NextResponse.json({
      success: true,
      points: updatedItem,
      message: `Awarded ${points} points in ${category}`,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/points error:", error);
    return NextResponse.json({ error: "Failed to award points" }, { status: 500 });
  }
}
