import { NextResponse } from "next/server";

/**
 * GET /api/debug/env
 * Returns which environment variables are available (for debugging).
 * Only shows variable names and whether they're set, not values.
 */
export async function GET() {
  const envVars = [
    "AMAZON_ACCESS_KEY_ID",
    "AMAZON_SECRET_ACCESS_KEY",
    "AMAZON_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "NEXT_PUBLIC_DEMO_MODE",
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID",
  ];

  const result: Record<string, { set: boolean; length?: number }> = {};
  for (const name of envVars) {
    const value = process.env[name];
    result[name] = {
      set: !!value,
      length: value ? value.length : 0,
    };
  }

  return NextResponse.json({
    env: result,
    nodeEnv: process.env.NODE_ENV,
  });
}
