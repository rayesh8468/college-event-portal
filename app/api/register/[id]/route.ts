import { NextRequest, NextResponse } from "next/server";
import { requireAuth, errorResponse, getOr404, generateId } from "@/lib/api-helpers";
import { docClient } from "@/lib/dynamodb";
import { tables } from "@/lib/dynamodb";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

/**
 * POST /api/register/[id]
 *   Register by registrationId (e.g., after payment confirmation).
 *   Body: { registrationId }
 *   Returns: updated registration with payment status
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: "registrationId is required" },
        { status: 400 }
      );
    }

    // Registration items are stored with PK=eventId, SK=userId,
    // so we can't look up by registrationId directly.
    // Use the RegistrationStatusIndex GSI on status=pending to find
    // registrations with this registrationId.
    // Since registrationId is a field in the item (not a key),
    // we need to scan. For small-scale use, query via UserRegistrationsIndex
    // is not practical since we don't know the userId.
    //
    // The proper solution: add a GSI on registrationId to the CDK stack.
    // For now, we return a 501 with a message.

    return NextResponse.json(
      { error: "registrationId lookup not yet implemented. Add a GSI on registrationId to the Registrations table in the CDK stack for efficient lookup." },
      { status: 501 }
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/register/[id] error:", error);
    return NextResponse.json({ error: "Registration confirmation failed" }, { status: 500 });
  }
}
