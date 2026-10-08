/**
 * AWS Credentials Loader
 *
 * Priority order:
 * 1. Environment variables (AMAZON_ACCESS_KEY_ID, AMAZON_SECRET_ACCESS_KEY)
 * 2. Bundled config file (lib/aws-config.json) - filled during Amplify build
 */

import bundledConfig from "./aws-config.json";

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Get AWS credentials.
 */
export function getAwsCredentials(): AwsCredentials | null {
  // Priority 1: Environment variables
  const envAccessKey = process.env.AMAZON_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const envSecretKey = process.env.AMAZON_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (envAccessKey && envSecretKey) {
    return {
      accessKeyId: envAccessKey,
      secretAccessKey: envSecretKey,
    };
  }

  // Priority 2: Bundled config file (filled during Amplify build)
  if (bundledConfig?.accessKeyId && bundledConfig?.secretAccessKey) {
    return {
      accessKeyId: bundledConfig.accessKeyId,
      secretAccessKey: bundledConfig.secretAccessKey,
    };
  }

  return null;
}

export function getAwsRegion(): string {
  // Priority 1: Environment variable
  const envRegion = process.env.AWS_REGION || process.env.AMAZON_REGION;
  if (envRegion) return envRegion;

  // Priority 2: Bundled config
  if (bundledConfig?.region) return bundledConfig.region;

  return "ap-south-1";
}

/**
 * Get AWS credentials or throw if not configured.
 */
export function getRequiredAwsCredentials(): AwsCredentials {
  const creds = getAwsCredentials();
  if (!creds) {
    throw new Error(
      "AWS credentials not configured. " +
        "Set AMAZON_ACCESS_KEY_ID and AMAZON_SECRET_ACCESS_KEY environment variables in Amplify."
    );
  }
  return creds;
}
