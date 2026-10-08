import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, errorResponse, parseBody, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

/***
 * Announcements API
 *
 * GET  /api/announcements         - List all announcements (HOD/Admin)
 * POST /api/announcements         - Create announcement (HOD/Admin)
 * PUT  /api/announcements         - Update announcement (HOD/Admin)
 * DELETE /api/announcements       - Delete announcement (HOD/Admin)
 */

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const departmentCode = searchParams.get("departmentCode") || undefined;

    let queryParams: any = {
      TableName: tables.announcements,
      Limit: 100,
      ScanIndexForward: false, // newest first
    };

    if (departmentCode) {
      queryParams.IndexName = "DeptIndex";
      queryParams.KeyConditionExpression = "#dept = :dept";
      queryParams.ExpressionAttributeNames = { "#dept": "departmentCode" };
      queryParams.ExpressionAttributeValues = { ":dept": departmentCode };
    }

    const result = await docClient.send(new QueryCommand(queryParams));
    const announcements = result.Items || [];

    return NextResponse.json({
      announcements,
      total: announcements.length,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const body = await parseBody<any>(request);
    const { title, content, priority, departmentCode, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (!priority || !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Priority must be low, medium, or high" }, { status: 400 });
    }

    const announcementId = generateId("ANN", 8);
    const now = new Date().toISOString();

    const announcement = {
      announcementId,
      title: title.trim(),
      content: content.trim(),
      authorUserId: user.userId,
      authorName: user.name,
      departmentCode: departmentCode || undefined,
      priority,
      createdAt: now,
      expiresAt: expiresAt || undefined,
    };

    await docClient.send(
      new PutCommand({
        TableName: tables.announcements,
        Item: announcement,
      })
    );

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const body = await parseBody<any>(request);
    const { announcementId, title, content, priority, departmentCode, expiresAt } = body;

    if (!announcementId) {
      return NextResponse.json({ error: "announcementId is required" }, { status: 400 });
    }

    // Verify announcement exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: tables.announcements,
        Key: { announcementId },
      })
    );

    if (!existing.Item) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (priority !== undefined) updates.priority = priority;
    if (departmentCode !== undefined) updates.departmentCode = departmentCode || undefined;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt || undefined;

    if (Object.keys(updates).length > 0) {
      await docClient.send(
        new UpdateCommand({
          TableName: tables.announcements,
          Key: { announcementId },
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
    }

    // Fetch updated announcement
    const updated = await docClient.send(
      new GetCommand({
        TableName: tables.announcements,
        Key: { announcementId },
      })
    );

    return NextResponse.json({ announcement: updated.Item });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json({ error: "announcementId is required" }, { status: 400 });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tables.announcements,
        Key: { announcementId },
      })
    );

    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
