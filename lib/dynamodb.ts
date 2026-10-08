/**
 * lib/dynamodb.ts
 *
 * AWS DynamoDB client (AWS SDK v3)
 *
 * Usage:
 *   import { docClient, tables } from "@/lib/dynamodb";
 *   await docClient.send(new QueryCommand({ TableName: tables.events, ... }));
 *
 * Environment variables (.env.local for local development):
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION (default: ap-south-1)
 */

import {
  DynamoDBClient,
  DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  UpdateCommand,
  UpdateCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";

// ── Client setup ─────────────────────────────────────────────────────

// Use environment variables for AWS credentials
// In Amplify, credentials are provided via ~/.aws/credentials (written by prebuild script)
// or via IAM role attached to the Amplify compute
const config: DynamoDBClientConfig = {
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

const client = new DynamoDBClient(config);

/** DocumentClient — automatically marshals JS objects to/from DynamoDB types */
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// ── Table name constants ─────────────────────────────────────────────
// Must match the table names defined in the CDK DataStack.

export const tables = {
  departments: "College_Departments",
  users: "College_Users",
  events: "College_Events",
  registrations: "College_Registrations",
  payments: "College_Payments",
  certificates: "College_Certificates",
  odRequests: "College_ODRequests",
  activityPoints: "College_ActivityPoints",
  feedback: "College_Feedback",
  teams: "College_Teams",
  announcements: "College_Announcements",
};

// ── Generic CRUD helpers ─────────────────────────────────────────────

/** Get a single item by key */
export async function get<T>(
  tableName: string,
  key: Record<string, unknown>
): Promise<T | undefined> {
  const output = await docClient.send(
    new GetCommand({ TableName: tableName, Key: key } as GetCommandInput)
  );
  return (output.Item as T) ?? undefined;
}

/** Put a single item (create or overwrite) */
export async function put<T extends Record<string, unknown>>(
  tableName: string,
  item: T
): Promise<void> {
  await docClient.send(
    new PutCommand({ TableName: tableName, Item: item } as PutCommandInput)
  );
}

/** Update an item — only the provided keys are changed */
export async function update<T extends Record<string, unknown>>(
  tableName: string,
  key: Record<string, unknown>,
  updates: Partial<T>,
  conditionExpression?: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      ...Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [k, v])
      ),
    } as UpdateCommandInput)
  );
}

/** Delete an item by key */
export async function remove(
  tableName: string,
  key: Record<string, unknown>
): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: tableName, Key: key } as DeleteCommandInput)
  );
}

/** Query by partition key (and optional sort key condition) */
export async function query<T>({
  tableName,
  KeyConditionExpression,
  ExpressionAttributeNames,
  ExpressionAttributeValues,
  IndexName,
  ScanIndexForward = false,
  Limit,
  ExclusiveStartKey,
}: {
  tableName: string;
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  IndexName?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
}): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }> {
  const output = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      IndexName,
      ScanIndexForward,
      Limit,
      ExclusiveStartKey,
    } as QueryCommandInput)
  );

  return {
    items: (output.Items ?? []) as T[],
    lastEvaluatedKey:
      (output.LastEvaluatedKey as Record<string, unknown>) ?? undefined,
  };
}

/** Full table scan (use only for small tables or when no index covers the query) */
export async function scan<T>(
  tableName: string,
  opts?: {
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
    Limit?: number;
    ExclusiveStartKey?: Record<string, unknown>;
  }
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }> {
  const output = await docClient.send(
    new ScanCommand({
      TableName: tableName,
      ...opts,
    } as ScanCommandInput)
  );

  return {
    items: (output.Items ?? []) as T[],
    lastEvaluatedKey:
      (output.LastEvaluatedKey as Record<string, unknown>) ?? undefined,
  };
}
