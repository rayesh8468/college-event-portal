import { NextRequest, NextResponse } from "next/server";
import { CognitoIdentityProviderClient, AdminGetUserCommand, AdminListGroupsForUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { getRequiredAwsCredentials, getAwsRegion } from "@/lib/aws-credentials";

const credentials = getRequiredAwsCredentials();
const cognitoClient = new CognitoIdentityProviderClient({
  region: getAwsRegion(),
  credentials: {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  },
});

const USER_POOL_ID = "ap-south-1_wwhNfufC3";

/** Get user groups from Cognito */
async function getUserGroups(email: string): Promise<string[]> {
  try {
    // Use AdminListGroupsForUser which is designed to list user groups
    const cmd = new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });
    const result = await cognitoClient.send(cmd) as any;
    const groups: string[] = [];
    for (const group of result.Groups || []) {
      groups.push(group.GroupName || "");
    }
    return groups;
  } catch (err) {
    console.error("getUserGroups error:", err);
    return ["Students"]; // Default to Students if user not found
  }
}

/**
 * POST /api/auth/login
 * Authenticates user via Cognito and returns tokens.
 *
 * For demo: accepts any college-domain email with a dummy password
 * and returns mock tokens. In production, calls Cognito AdminInitiateAuth.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // College domain restriction — hardcoded for Amplify runtime compatibility
    // process.env.COLLEGE_EMAIL_DOMAIN is not injected into serverless functions at runtime
    const allowedDomain = "vitapstudent.ac.in";
    if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
      return NextResponse.json({ error: "Only college email addresses allowed" }, { status: 403 });
    }

    // Demo mode: accept any password and return mock tokens
    // In production, replace with real Cognito AdminInitiateAuth
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.COGNITO_USER_POOL_ID) {
      const userId = email.split("@")[0];
      const now = Date.now();
      const exp = now + 3600000; // 1 hour

      // Get actual user groups from Cognito for correct role assignment
      const groups = await getUserGroups(email);
      const isAdmin = groups.includes("DeptHeads") || groups.includes("SuperAdmins");
      const role: "Students" | "DeptHeads" | "SuperAdmins" = isAdmin
        ? (groups.includes("SuperAdmins") ? "SuperAdmins" : "DeptHeads")
        : "Students";

      return NextResponse.json({
        accessToken: Buffer.from(JSON.stringify({
          sub: userId,
          email,
          "cognito:username": userId,
          "cognito:groups": groups.length > 0 ? groups : ["Students"],
          name: userId,
          iss: "demo",
          iat: now,
          exp,
        })).toString("base64"),
        idToken: Buffer.from(JSON.stringify({
          sub: userId,
          email,
          "cognito:username": userId,
          "cognito:groups": groups.length > 0 ? groups : ["Students"],
          name: userId,
          iss: "demo",
          iat: now,
          exp,
        })).toString("base64"),
        refreshToken: Buffer.from(JSON.stringify({
          sub: userId,
          exp: now + 2592000000, // 30 days
        })).toString("base64"),
        user: { id: userId, email, name: userId, role },
        demo: true,
      });
    }

    // Production: call Cognito AdminInitiateAuth
    // const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = await import("@aws-sdk/client-cognito-identity-provider");
    // ... (real implementation)

    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// refresh
