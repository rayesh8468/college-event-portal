/**
 * Shared utilities for API routes
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  verifyToken,
  getUserIdFromToken,
  getGroupsFromToken,
  CognitoJwtPayload,
} from "@/lib/cognito";
import { docClient } from "@/lib/dynamodb";
import { GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// ── Auth helpers ──────────────────────────────────────────────────────

export type AuthenticatedUser = {
  userId: string;
  email: string;
  name: string;
  role: "Students" | "DeptHeads" | "SuperAdmins";
  groups: string[];
  payload: CognitoJwtPayload;
};

/**
 * Extract and verify the user from the auth token in cookies.
 * Returns the authenticated user or throws an error object.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("auth_token");
  const token = authCookie?.value;

  if (!token) {
    throw { status: 401, message: "Unauthorized" };
  }

  try {
    const payload = await verifyToken(token);
    const userId = getUserIdFromToken(payload);
    const groups = getGroupsFromToken(payload);
    const role = groups.includes("SuperAdmins")
      ? ("SuperAdmins" as const)
      : groups.includes("DeptHeads")
      ? ("DeptHeads" as const)
      : ("Students" as const);

    return {
      userId,
      email: payload.email || "",
      name: payload.name || payload["cognito:username"] || "",
      role,
      groups,
      payload,
    };
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

/**
 * Require a specific role. Throws if user doesn't have it.
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: string[]
): void {
  if (!allowedRoles.includes(user.role)) {
    throw { status: 403, message: "Forbidden" };
  }
}

/**
 * Require admin (HOD or SuperAdmin).
 */
export function requireAdmin(user: AuthenticatedUser): void {
  if (user.role !== "DeptHeads" && user.role !== "SuperAdmins") {
    throw { status: 403, message: "Admin access required" };
  }
}

/**
 * Require HOD or above.
 */
export function requireHOD(user: AuthenticatedUser): void {
  if (user.role !== "DeptHeads" && user.role !== "SuperAdmins") {
    throw { status: 403, message: "HOD access required" };
  }
}

// ── Response helpers ──────────────────────────────────────────────────

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** Success response helper */
export function success(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Get an item from DynamoDB by key, throw 404 if not found.
 */
export async function getOr404<T>(
  tableName: string,
  key: Record<string, unknown>
): Promise<T> {
  const result = await docClient.send(
    new GetCommand({ TableName: tableName, Key: key })
  );
  if (!result.Item) {
    throw { status: 404, message: "Not found" };
  }
  return result.Item as T;
}

/**
 * Parse JSON body from a Next.js request.
 */
export async function parseBody<T>(request: Request): Promise<T> {
  const body = await request.json();
  return body as T;
}

/**
 * Validate that required fields are present and non-empty.
 */
export function requireFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): void {
  for (const field of fields) {
    const val = body[field];
    if (val === undefined || val === null || val === "") {
      throw { status: 400, message: `Missing required field: ${String(field)}` };
    }
  }
}

/**
 * Generate a unique ID with a prefix.
 */
export function generateId(prefix: string, length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix + "-";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate a certificate ID: CERT-YYYY-DEPT-XXXXX
 */
export function generateCertificateId(
  year: number,
  departmentCode: string,
  sequence: number
): string {
  return `CERT-${year}-${departmentCode}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Generate an OD request reference: ODR-YYYY-XXXXX
 */
export function generateODReference(year: number): string {
  return `ODR-${year}-${String(Date.now()).slice(-5)}`;
}

/**
 * Paginated query helper - fetches all pages from DynamoDB.
 */
export async function queryAll<T>(params: {
  TableName: string;
  KeyConditionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  IndexName?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
}): Promise<T[]> {
  const items: T[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined =
    params.ExclusiveStartKey;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: params.TableName,
        KeyConditionExpression: params.KeyConditionExpression,
        ExpressionAttributeNames: params.ExpressionAttributeNames,
        ExpressionAttributeValues: params.ExpressionAttributeValues,
        IndexName: params.IndexName,
        ScanIndexForward: params.ScanIndexForward,
        Limit: params.Limit,
        ExclusiveStartKey: lastEvaluatedKey,
      } as any)
    );

    if (result.Items) {
      items.push(...(result.Items as T[]));
    }
    lastEvaluatedKey = (result.LastEvaluatedKey as Record<string, unknown>) || undefined;
  } while (lastEvaluatedKey);

  return items;
}
