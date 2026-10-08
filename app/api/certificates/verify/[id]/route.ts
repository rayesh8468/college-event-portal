import { NextRequest, NextResponse } from "next/server";
import { docClient, tables } from "@/lib/dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/certificates/verify/[id]
 * Public endpoint — no auth required
 * Returns certificate details for public verification
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificateId = decodeURIComponent(id);

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: tables.certificates,
        Key: { certificateId },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const certificate = result.Item;

    return NextResponse.json({
      certificate: {
        certificateId: certificate.certificateId,
        userId: certificate.userId,
        userName: certificate.userName,
        userRollNumber: certificate.userRollNumber,
        eventType: certificate.eventType,
        role: certificate.role,
        date: certificate.date,
        duration: certificate.duration,
        issuedBy: certificate.issuedBy,
        issuedOn: certificate.issuedOn,
        verificationUrl: certificate.verificationUrl,
        isPublic: certificate.isPublic,
      },
      verified: true,
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
