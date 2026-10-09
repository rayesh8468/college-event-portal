import { NextRequest, NextResponse } from "next/server";
import { parseBody } from "@/lib/api-helpers";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getRequiredAwsCredentials, getAwsRegion } from "@/lib/aws-credentials";
import { docClient, tables } from "@/lib/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const credentials = getRequiredAwsCredentials();
const cognitoClient = new CognitoIdentityProviderClient({
  region: getAwsRegion(),
  credentials: {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  },
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

/**
 * Create a real user in the Cognito user pool.
 *
 * Three steps:
 *  1. AdminCreateUser (SUPPRESS) — creates the user without sending an
 *     invitation email (SES is unavailable in this account).
 *  2. AdminSetUserPassword (permanent) — confirms the user with the password
 *     they chose, so they can log in immediately.
 *  3. AdminAddUserToGroup("Students") — so login assigns the Students role.
 *
 * The user is immediately visible in the Cognito console Users tab.
 */
async function createCognitoUser(
  email: string,
  name: string,
  password: string
): Promise<void> {
  const username = email.toLowerCase();

  // 1) Create the user in the pool (no invitation email)
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: username },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: name.trim() },
      ],
    })
  );

  // 2) Set the chosen password as permanent → user becomes CONFIRMED
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: password,
      Permanent: true,
    })
  );

  // 3) Add to the Students group for correct role assignment
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: "Students",
    })
  );
}

/** POST /api/auth/register
 *
 * Register a new user.
 * - Validates name, email format, domain, password
 * - Checks if email already exists in Cognito
 * - Creates a real Cognito user (visible in the Cognito Users tab)
 * - Mirrors the profile into DynamoDB College_Users
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

    // ── Create the user in Cognito ──────────────────────────────────
    // Creates a REAL user in the Cognito user pool — visible in the
    // Cognito console → User pool → Users tab, status CONFIRMED,
    // member of the Students group.
    try {
      await createCognitoUser(email, name, password);
    } catch (cognitoErr: any) {
      console.error("Cognito user creation failed:", cognitoErr);
      return NextResponse.json(
        {
          error:
            cognitoErr?.name === "UsernameExistsException"
              ? "Email already registered"
              : `Registration failed: ${cognitoErr?.message ?? "Cognito error"}`,
        },
        { status: 500 }
      );
    }

    const userId = email.split("@")[0];

    // Mirror the profile into DynamoDB so the user also shows up in the
    // admin user list. Non-fatal — Cognito is the source of truth for auth.
    try {
      const deptMatch = email.match(/\d{2}([a-z]{3,4})@/i);
      await docClient.send(
        new PutCommand({
          TableName: tables.users,
          Item: {
            userId,
            name: name.trim(),
            email: email.toLowerCase(),
            role: "Students",
            departmentCode: deptMatch ? deptMatch[1].toUpperCase() : "CSE",
            reliabilityScore: "100",
            createdAt: new Date().toISOString(),
          },
        })
      );
    } catch (dbErr) {
      console.warn("DynamoDB profile write failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please log in.",
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name.trim(),
        role: "Students",
      },
      cognitoUserCreated: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
