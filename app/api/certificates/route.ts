import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireHOD, errorResponse, getOr404, generateCertificateId, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * GET /api/certificates
 *   Query params: ?eventId=&userId=&type=
 *   Returns: list of certificates
 *   Students see only their own; HOD/Admin see all with filters
 *
 * POST /api/certificates
 *   Issue certificates to users for an event
 *   Body: { eventId, userIds: string[], type? }
 *   HOD/Admin only. Bulk issuance supported.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const targetUserId = searchParams.get("userId");
    const certType = searchParams.get("type");

    let certificates: any[] = [];

    if (user.role === "Students") {
      // Students see only their own certificates
      const result = await docClient.send(
        new QueryCommand({
          TableName: tables.certificates,
          IndexName: "UserCertificatesIndex",
          KeyConditionExpression: "#uid = :uid",
          ExpressionAttributeNames: { "#uid": "userId" },
          ExpressionAttributeValues: { ":uid": user.userId },
          ScanIndexForward: false,
        })
      );
      certificates = result.Items || [];

      // Apply type filter if provided
      if (certType) {
        certificates = certificates.filter((c: any) => c.role === certType);
      }
    } else {
      // HOD/Admin — query with filters
      if (targetUserId) {
        const result = await docClient.send(
          new QueryCommand({
            TableName: tables.certificates,
            IndexName: "UserCertificatesIndex",
            KeyConditionExpression: "#uid = :uid",
            ExpressionAttributeNames: { "#uid": "userId" },
            ExpressionAttributeValues: { ":uid": targetUserId },
            ScanIndexForward: false,
          })
        );
        certificates = result.Items || [];
      } else if (eventId) {
        const result = await docClient.send(
          new QueryCommand({
            TableName: tables.certificates,
            IndexName: "EventCertificatesIndex",
            KeyConditionExpression: "#eid = :eid",
            ExpressionAttributeNames: { "#eid": "eventId" },
            ExpressionAttributeValues: { ":eid": eventId },
            ScanIndexForward: false,
          })
        );
        certificates = result.Items || [];
      } else {
        // No filters — return empty (full scan would be expensive)
        return NextResponse.json({
          certificates: [],
          total: 0,
          message: "Please specify eventId or userId to filter certificates",
        });
      }

      // Apply type filter if provided
      if (certType) {
        certificates = certificates.filter((c: any) => c.role === certType);
      }
    }

    return NextResponse.json({
      certificates,
      total: certificates.length,
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    requireHOD(auth);

    const body = await request.json();
    const { eventId, userIds, type } = body;

    if (!eventId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "eventId and userIds (array) are required" },
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

    const validTypes = [
      "participant",
      "winner",
      "runnerUp",
      "volunteer",
      "organizer",
      "best_poster",
      "best_presentation",
    ];
    const certType = type || "participant";
    if (!validTypes.includes(certType)) {
      return NextResponse.json(
        { error: `Invalid certificate type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const eventData = event.Item as any;
    const year = new Date().getFullYear();
    const deptCode = eventData.departmentCode || "GEN";

    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        // Get user info
        const userResult = await docClient.send(
          new GetCommand({
            TableName: tables.users,
            Key: { userId },
          })
        );

        if (!userResult.Item) {
          errors.push({ userId, error: "User not found" });
          continue;
        }

        const user = userResult.Item as any;

        // Generate certificate ID using the sequence (1-indexed per issuance batch)
        const sequence = i + 1;
        const certificateId = generateCertificateId(year, deptCode, sequence);

        const now = new Date().toISOString();
        const issuedOn = now.split("T")[0];

        const certificate = {
          certificateId,
          userId,
          eventId,
          userName: user.name,
          userRollNumber: user.rollNumber || "",
          eventType: eventData.eventType || eventData.title,
          role: certType,
          date: eventData.endDate || eventData.startDate,
          duration: `${eventData.startDate} to ${eventData.endDate}`,
          issuedBy: auth.name,
          issuedOn,
          verificationUrl: `/verify/${certificateId}`,
          pdfUrl: `/api/certificates/${certificateId}/pdf`,
          isPublic: true,
        };

        await docClient.send(
          new PutCommand({
            TableName: tables.certificates,
            Item: certificate,
          })
        );

        results.push(certificate);
      } catch (err) {
        errors.push({ userId, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      issued: results.length,
      certificates: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Issued ${results.length} certificate(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`,
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/certificates error:", error);
    return NextResponse.json({ error: "Failed to issue certificates" }, { status: 500 });
  }
}
