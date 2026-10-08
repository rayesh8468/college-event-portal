import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, errorResponse, parseBody, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || undefined;
    const departmentCode = searchParams.get("departmentCode") || undefined;
    const search = searchParams.get("search") || undefined;

    const scanParams: any = {
      TableName: tables.users,
      Limit: 200,
    };

    if (search || role || departmentCode) {
      // Build filter for scan
      const filterParts: string[] = [];
      const attrNames: Record<string, string> = {};
      const attrVals: Record<string, unknown> = {};
      let idx = 0;

      if (role) {
        attrNames[`#r${idx}`] = "role";
        attrVals[`:r${idx}`] = role;
        filterParts.push(`#r${idx} = :r${idx}`);
        idx++;
      }
      if (departmentCode) {
        attrNames[`#d${idx}`] = "departmentCode";
        attrVals[`:d${idx}`] = departmentCode;
        filterParts.push(`#d${idx} = :d${idx}`);
        idx++;
      }
      if (search) {
        // Search by name or email using contains
        attrNames[`#n${idx}`] = "name";
        attrVals[`:n${idx}`] = search;
        filterParts.push(`contains(#n${idx}, :n${idx})`);
        idx++;
      }

      if (filterParts.length > 0) {
        scanParams.FilterExpression = filterParts.join(" AND ");
        scanParams.ExpressionAttributeNames = attrNames;
        scanParams.ExpressionAttributeValues = attrVals;
      }
    }

    const result = await docClient.send(new ScanCommand(scanParams));
    const users = result.Items || [];

    return NextResponse.json({
      users: users.map((u: any) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        departmentCode: u.departmentCode || "",
        role: u.role,
        reliabilityScore: u.reliabilityScore,
        createdAt: u.createdAt,
      })),
      total: users.length,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await parseBody<any>(request);
    const { userId, role, departmentCode, name } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!["Students", "DeptHeads", "SuperAdmins"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
    }
    if (departmentCode !== undefined) updates.departmentCode = departmentCode || "";
    if (name !== undefined) updates.name = name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tables.users,
        Key: { userId },
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
        TableName: tables.users,
        Key: { userId },
      })
    );

    return NextResponse.json({ user: updated.Item });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/users error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Prevent deletion of own account
    if (userId === auth.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tables.users,
        Key: { userId },
        UpdateExpression: "SET #a = :a",
        ExpressionAttributeNames: { "#a": "disabled" },
        ExpressionAttributeValues: { ":a": true },
      })
    );

    return NextResponse.json({ success: true, message: "User disabled" });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ error: "Failed to disable user" }, { status: 500 });
  }
}
