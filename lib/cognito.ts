/**
 * lib/cognito.ts
 *
 * AWS Cognito helper — JWT verification and user info extraction
 *
 * Usage:
 *   import { verifyToken, getUserIdFromToken, getGroupsFromToken } from "@/lib/cognito";
 *
 *   // Verify JWT from Authorization header in API Routes
 *   const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 *   const payload = await verifyToken(token);
 *   const userId = getUserIdFromToken(payload); // sub
 *   const groups = getGroupsFromToken(payload); // ["Students"] etc.
 */

import { jwtVerify, createRemoteJWKSet } from "jose";
import { JWTPayload, GetKeyFunction, JWK, KeyLike } from "jose";

// ── Environment variables ───────────────────────────────────────────────────────

/** Cognito User Pool ID (e.g. ap-south-1_xxxxxxxxx) */
const userPoolId = process.env.COGNITO_USER_POOL_ID || "";

/** Cognito Client ID (app client ID) */
const clientId = process.env.COGNITO_CLIENT_ID || "";

/** Token issuer */
const issuer = `https://cognito-idp.ap-south-1.amazonaws.com/${userPoolId}`;

// ── JWKS remote key set (auto-cached) ───────────────────────────────────────────

/**
 * Remote key set pointing to the Cognito User Pool's JWKS endpoint.
 * jose caches internally and auto-refreshes on key rotation.
 */
const cognitoJWKS = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
);

// ── JWT verification ─────────────────────────────────────────────────────────────

export type CognitoJwtPayload = JWTPayload & {
  sub: string;            // Unique user ID (Cognito sub)
  email?: string;         // Email address
  "cognito:groups"?: string[];  // User groups
  "cognito:username"?: string;
  name?: string;
};

/**
 * Verify a JWT token and return its payload
 *
 * @throws {Error} If the token is invalid or expired
 */
export async function verifyToken(
  token: string
): Promise<CognitoJwtPayload> {
  // Demo mode: accept base64-encoded JSON tokens without signature verification
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (demoMode) {
    try {
      // Try to decode as base64 JSON (demo token format)
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (decoded.iss === "demo" || decoded.iss === "https://cognito-idp.ap-south-1.amazonaws.com/") {
        // Demo token or Cognito token - return payload without signature verification
        return decoded as CognitoJwtPayload;
      }
    } catch {
      // Not a base64 JSON token, fall through to normal verification
    }
  }

  // Normal verification with Cognito JWKS
  const { payload } = await jwtVerify(token, cognitoJWKS, {
    issuer,
    audience: clientId,
  });

  return payload as CognitoJwtPayload;
}

/**
 * Extract JWT payload from a Bearer auth header (used in API Routes)
 */
export async function extractTokenPayload(
  authHeader: string | null
): Promise<CognitoJwtPayload | null> {
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Extract user ID (sub) from a JWT payload
 */
export function getUserIdFromToken(payload: CognitoJwtPayload): string {
  return payload.sub;
}

/**
 * Extract user group list from a JWT payload
 */
export function getGroupsFromToken(
  payload: CognitoJwtPayload
): string[] {
  return payload["cognito:groups"] ?? [];
}

/**
 * Check if the user has any of the specified roles
 */
export function hasRole(
  payload: CognitoJwtPayload,
  roles: string[]
): boolean {
  const groups = getGroupsFromToken(payload);
  return roles.some((r) => groups.includes(r));
}

/**
 * Check if the user is an admin (HOD or SuperAdmin)
 */
export function isAdminOrHOD(payload: CognitoJwtPayload): boolean {
  return hasRole(payload, ["DeptHeads", "SuperAdmins"]);
}

/**
 * Check if the user is a SuperAdmin
 */
export function isSuperAdmin(payload: CognitoJwtPayload): boolean {
  return hasRole(payload, ["SuperAdmins"]);
}

// ── JWT decode (no verification — for debugging only) ───────────────────────────

export function decodeJwt(token: string): unknown {
  try {
    const b64 = token.split(".")[1];
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
