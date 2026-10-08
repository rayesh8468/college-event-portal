import {
  S3Client,
  S3ClientConfig,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── Client ───────────────────────────────────────────────────────────

// Credentials are loaded from environment variables
// Amplify sets AMAZON_ACCESS_KEY_ID, AMAZON_SECRET_ACCESS_KEY, AMAZON_REGION
const accessKeyId = process.env.AMAZON_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AMAZON_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const config: S3ClientConfig = {
  region: process.env.AWS_REGION || process.env.AMAZON_REGION || "ap-south-1",
  ...(accessKeyId && secretAccessKey
    ? { credentials: { accessKeyId, secretAccessKey } }
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
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = DEFAULT_DOWNLOAD_EXPIRY
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned upload URL.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = DEFAULT_UPLOAD_EXPIRY
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete an object from the bucket.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: key,
    })
  );
}
