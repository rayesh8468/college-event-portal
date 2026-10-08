/**
 * lib/s3.ts
 *
 * AWS S3 client — private documents bucket (certificates, reports, OD letters)
 *
 * Usage:
 *   import { getPresignedDownloadUrl, getPresignedUploadUrl } from "@/lib/s3";
 *
 *   // Download URL (valid 15 minutes)
 *   const downloadUrl = await getPresignedDownloadUrl("cert/CERT-2024-CSE-00147.pdf");
 *
 *   // Upload URL (valid 10 minutes) — frontend can PUT directly
 *   const uploadUrl = await getPresignedUploadUrl("uploads/photo1.jpg", "image/jpeg");
 */

import {
  S3Client,
  S3ClientConfig,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── Client ───────────────────────────────────────────────────────────

// Use environment variables for AWS credentials
const config: S3ClientConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
};

const s3Client = new S3Client(config);

// ── Bucket name ──────────────────────────────────────────────────────

/** Hardcoded to match CDK deployment */
export const DOCUMENTS_BUCKET = "college-portal-docs-vitapstudent-ac-in";

// ── Presigned URL helpers ────────────────────────────────────────────

const DEFAULT_DOWNLOAD_EXPIRY = 15 * 60; // 15 minutes
const DEFAULT_UPLOAD_EXPIRY = 10 * 60; // 10 minutes

/**
 * Generate a presigned download URL.
 *
 * @param key  S3 object key (e.g. "cert/CERT-2024-CSE-00147.pdf")
 * @param expirySeconds  URL validity in seconds (default 15 min)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expirySeconds: number = DEFAULT_DOWNLOAD_EXPIRY
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
}

/**
 * Generate a presigned upload URL (PUT).
 *
 * @param key         S3 object key (e.g. "uploads/photo1.jpg")
 * @param contentType Object MIME type (e.g. "image/jpeg")
 * @param expirySeconds  URL validity in seconds (default 10 min)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expirySeconds: number = DEFAULT_UPLOAD_EXPIRY
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
}

/** Delete an object from the bucket (server-side only — Admin/HOD only) */
export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: key,
    })
  );
}

/** Check whether an object exists in the bucket (HEAD request) */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new GetObjectCommand({
        Bucket: DOCUMENTS_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

// ── Key naming conventions ───────────────────────────────────────────

/** Certificate PDF key: cert/CERT-2024-CSE-00147.pdf */
export function certificateKey(certificateId: string): string {
  return `cert/${certificateId}.pdf`;
}

/** OD letter PDF key: od/ODR-{requestId}.pdf */
export function odLetterKey(odRequestId: string): string {
  return `od/ODR-${odRequestId}.pdf`;
}

/** Accreditation report key: reports/{dept}/{eventId}/report.pdf */
export function reportKey(
  departmentCode: string,
  eventId: string,
  suffix: string = "report.pdf"
): string {
  return `reports/${departmentCode}/${eventId}/${suffix}`;
}
