import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, parseBody, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAdmin(user);

    const result = await docClient.send(
      new ScanCommand({ TableName: tables.departments, Limit: 50 })
    );

    const departments = (result.Items || []).map((d: any) => ({
      departmentCode: d.departmentCode,
      name: d.name,
      hodUserId: d.hodUserId || "",
      hodName: d.hodName || "",
      active: d.active,
    }));

    return NextResponse.json({ departments, total: departments.length });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await parseBody<any>(request);
    const { departmentCode, name, hodUserId } = body;

    if (!departmentCode || !name) {
      return NextResponse.json(
        { error: "departmentCode and name are required" },
        { status: 400 }
      );
    }

    // Check if department already exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: tables.departments,
        Key: { departmentCode },
      })
    );

    if (existing.Item) {
      return NextResponse.json(
        { error: `Department "${departmentCode}" already exists` },
        { status: 409 }
      );
    }

    let hodName = "";
    if (hodUserId) {
      const hodResult = await docClient.send(
        new GetCommand({
          TableName: tables.users,
          Key: { userId: hodUserId },
        })
      );
      if (hodResult.Item) {
        hodName = (hodResult.Item as any).name;
      }
    }

    const department = {
      departmentCode,
      name,
      hodUserId: hodUserId || "",
      hodName,
      active: true,
    };

    await docClient.send(
      new PutCommand({
        TableName: tables.departments,
        Item: department,
      })
    );

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/departments error:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await parseBody<any>(request);
    const { departmentCode, name, hodUserId, active } = body;

    if (!departmentCode) {
      return NextResponse.json(
        { error: "departmentCode is required" },
        { status: 400 }
      );
    }

    // Verify department exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: tables.departments,
        Key: { departmentCode },
      })
    );

    if (!existing.Item) {
      return NextResponse.json(
        { error: `Department "${departmentCode}" not found` },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (hodUserId !== undefined) {
      updates.hodUserId = hodUserId || "";
      // Fetch HOD name if provided
      if (hodUserId) {
        const hodResult = await docClient.send(
          new GetCommand({
            TableName: tables.users,
            Key: { userId: hodUserId },
          })
        );
        if (hodResult.Item) {
          updates.hodName = (hodResult.Item as any).name;
        } else {
          updates.hodName = "";
        }
      } else {
        updates.hodName = "";
      }
    }
    if (active !== undefined) updates.active = active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tables.departments,
        Key: { departmentCode },
        ...Object.fromEntries(
          Object.entries(updates).map(([k, v]) => [k, v])
        ),
      })
    );

    const updated = await docClient.send(
      new GetCommand({
        TableName: tables.departments,
        Key: { departmentCode },
      })
    );

    return NextResponse.json({
      department: {
        departmentCode: (updated.Item as any).departmentCode,
        name: (updated.Item as any).name,
        hodUserId: (updated.Item as any).hodUserId,
        hodName: (updated.Item as any).hodName,
        active: (updated.Item as any).active,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/departments error:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await request.json();
    const { departmentCode } = body;

    if (!departmentCode) {
      return NextResponse.json(
        { error: "departmentCode is required" },
        { status: 400 }
      );
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tables.departments,
        Key: { departmentCode },
        UpdateExpression: "SET #a = :a",
        ExpressionAttributeNames: { "#a": "active" },
        ExpressionAttributeValues: { ":a": false },
      })
    );

    return NextResponse.json({
      success: true,
      message: `Department "${departmentCode}" deactivated`,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/departments error:", error);
    return NextResponse.json({ error: "Failed to deactivate department" }, { status: 500 });
  }
}
