import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, parseBody } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await parseBody<any>(request);
    const { odRequestId, status, rejectionReason } = body;

    if (!odRequestId || !status) {
      return NextResponse.json(
        { error: "odRequestId and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected", "auto_revoked"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === "approved") {
      updates.approvedBy = auth.name;
      updates.approvedAt = new Date().toISOString();
    }

    if (status === "rejected" && rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    await docClient.send(
      new UpdateCommand({
        TableName: "College_ODRequests",
        Key: { odRequestId },
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

    return NextResponse.json({ success: true, message: `OD request ${status}` });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PUT /api/od error:", error);
    return NextResponse.json({ error: "Failed to update OD request" }, { status: 500 });
  }
}
