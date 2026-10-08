import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie / signals the client to clear local storage.
 * In production, this could also call Cognito GlobalSignOut.
 */
export async function POST() {
  // In demo mode, just return success.
  // The client-side auth context clears localStorage on logout.
  return NextResponse.json({ success: true });
}
