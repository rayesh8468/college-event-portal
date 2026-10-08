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

// Credentials are loaded from environment variables
// Amplify sets AMAZON_ACCESS_KEY_ID, AMAZON_SECRET_ACCESS_KEY, AMAZON_REGION
const config: DynamoDBClientConfig = {
  region: process.env.AWS_REGION || process.env.AMAZON_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AMAZON_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
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

/** Put (create or overwrite) an item */
export async function put(
  tableName: string,
  item: Record<string, unknown>
): Promise<void> {
  await docClient.send(
    new PutCommand({ TableName: tableName, Item: item } as PutCommandInput)
  );
}

/** Update an item with a partial set of attributes */
export async function update(
  tableName: string,
  key: Record<string, unknown>,
  updates: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>
): Promise<void> {
  const attrNames: Record<string, string> = expressionAttributeNames ?? {};
  const attrValues: Record<string, unknown> = {};
  const setClauses: string[] = [];

  let i = 0;
  for (const [field, value] of Object.entries(updates)) {
    const nameKey = `#f${i}`;
    const valKey = `:v${i}`;
    attrNames[nameKey] = field;
    attrValues[valKey] = value;
    setClauses.push(`${nameKey} = ${valKey}`);
    i++;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${setClauses.join(", ")}`,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    } as UpdateCommandInput)
  );
}

/** Delete an item by key */
export async function del(
  tableName: string,
  key: Record<string, unknown>
): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: tableName, Key: key } as DeleteCommandInput)
  );
}

/** Query items by partition key (and optional sort key condition) */
export async function query<T>(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>,
  indexName?: string,
  limit?: number,
  scanIndexForward?: boolean
): Promise<T[]> {
  const params: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  if (expressionAttributeNames) params.ExpressionAttributeNames = expressionAttributeNames;
  if (indexName) params.IndexName = indexName;
  if (limit) params.Limit = limit;
  if (scanIndexForward !== undefined) params.ScanIndexForward = scanIndexForward;

  const output = await docClient.send(new QueryCommand(params));
  return (output.Items ?? []) as T[];
}

/** Scan a table (optionally with a filter) */
export async function scan<T>(
  tableName: string,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>,
  limit?: number
): Promise<T[]> {
  const params: ScanCommandInput = { TableName: tableName };
  if (filterExpression) params.FilterExpression = filterExpression;
  if (expressionAttributeValues) params.ExpressionAttributeValues = expressionAttributeValues;
  if (expressionAttributeNames) params.ExpressionAttributeNames = expressionAttributeNames;
  if (limit) params.Limit = limit;

  const output = await docClient.send(new ScanCommand(params));
  return (output.Items ?? []) as T[];
}
