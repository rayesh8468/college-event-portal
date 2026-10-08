/**
 * AWS Credentials Loader
 *
 * Credentials are loaded from environment variables only.
 * Set these in AWS Amplify Console → App Settings → Environment Variables:
 *   AMAZON_ACCESS_KEY_ID
 *   AMAZON_SECRET_ACCESS_KEY
 *   AMAZON_REGION (or AWS_REGION)
 *
 * For the VIT Event Portal demo, credentials must be configured in Amplify.
 */

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Get AWS credentials from environment variables.
 * Returns null if not configured (app will fail with clear error).
 */
export function getAwsCredentials(): AwsCredentials | null {
  const accessKeyId =
    process.env.AMAZON_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AMAZON_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }

  return null;
}

export function getAwsRegion(): string {
  return (
    process.env.AWS_REGION || process.env.AMAZON_REGION || "ap-south-1"
  );
}

/**
 * Get AWS client config with credentials.
 * Throws if credentials are not configured.
 */
export function getRequiredAwsCredentials(): AwsCredentials {
  const creds = getAwsCredentials();
  if (!creds) {
    throw new Error(
      "AWS credentials not configured. Set AMAZON_ACCESS_KEY_ID and AMAZON_SECRET_ACCESS_KEY environment variables."
    );
  }
  return creds;
}
