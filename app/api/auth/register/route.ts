import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/api-helpers";
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: "ap-south-1",
});

const USER_POOL_ID = "ap-south-1_wwhNfufC3";

/** Check if a user exists in Cognito by username (email) */
async function userExistsInCognito(email: string): Promise<boolean> {
  if (!USER_POOL_ID) return false;
  try {
    const cmd = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });
    await cognitoClient.send(cmd);
    return true;
  } catch (err: any) {
    if (err.name === "UserNotFoundException") return false;
    // Other errors (network, permissions) — log and assume not exists
    console.warn("Cognito existence check failed:", err.message);
    return false;
  }
}

/** POST /api/auth/register
 *
 * Register a new user.
 * - Validates name, email format, domain, password
 * - Checks if email already exists in Cognito
 * - In demo mode, returns success (Cognito user must be created separately)
 * - In production, call Cognito SignUp or AdminCreateUser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<{
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }>(request);

    const { name, email, password, confirmPassword } = body;

    // ── Validation ──────────────────────────────────────────────────
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // College domain check — hardcoded for Amplify runtime compatibility
    const collegeDomain = "vitapstudent.ac.in";
    if (!email.toLowerCase().endsWith(`@${collegeDomain}`)) {
      return NextResponse.json(
        { error: `Only @${collegeDomain} email addresses are allowed` },
        { status: 403 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // ── Check if email already exists in Cognito ───────────────────
    if (await userExistsInCognito(email)) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // ── Register ────────────────────────────────────────────────────
    // In production, call Cognito SignUp or AdminCreateUser here.
    // For demo, return success — the user would then log in with mock tokens.

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please log in.",
      user: {
        id: email.split("@")[0],
        email,
        name: name.trim(),
        role: "Students",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
