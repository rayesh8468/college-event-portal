// Helper: revoke a certificate
// Used by the admin certificates page
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, parseBody } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function revokeCertificate(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireAdmin(auth);

    const body = await parseBody<any>(request);
    const { certificateId } = body;

    if (!certificateId) {
      return NextResponse.json({ error: "certificateId is required" }, { status: 400 });
    }

    await docClient.send(
      new UpdateCommand({
        TableName: "College_Certificates",
        Key: { certificateId },
        UpdateExpression: "SET #i = :i",
        ExpressionAttributeNames: { "#i": "isPublic" },
        ExpressionAttributeValues: { ":i": false },
      })
    );

    return NextResponse.json({ success: true, message: "Certificate revoked" });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Revoke certificate error:", error);
    return NextResponse.json({ error: "Failed to revoke certificate" }, { status: 500 });
  }
}
