import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

/**
 * DataStack — all DynamoDB tables for the College Event Portal.
 *
 * Table names are hardcoded so the Next.js app can reference them
 * via env vars without depending on CloudFormation output
 * interpolation at runtime.  If you change a table name here, update
 * the corresponding env var in .env.local.
 *
 * ※ `description` is NOT a valid DynamoDB Table prop in CDK v2.269 —
 *     removed from all table definitions.
 */
export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id, props);

    // 1. Departments — department master
    // PK: departmentCode (e.g. "CSE", "IT", "EEE")
    new dynamodb.Table(this, "Departments", {
      tableName: "College_Departments",
      partitionKey: { name: "departmentCode", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // 2. Users — user profile (Cognito sub-based)
    // GSI: EmailIndex (lookup by email)
    // GSI: DepartmentRoleIndex (dept + role based lookups)
    const users = new dynamodb.Table(this, "Users", {
      tableName: "College_Users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    users.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    users.addGlobalSecondaryIndex({
      indexName: "DepartmentRoleIndex",
      partitionKey: { name: "departmentCode", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "role", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 3. Events — event definition
    // GSI: DepartmentDateIndex (by dept + date)
    // GSI: StatusIndex (by status)
    // GSI: UpcomingIndex (by category + startDate)
    const events = new dynamodb.Table(this, "Events", {
      tableName: "College_Events",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    events.addGlobalSecondaryIndex({
      indexName: "DepartmentDateIndex",
      partitionKey: { name: "departmentCode", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "startDate", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    events.addGlobalSecondaryIndex({
      indexName: "StatusIndex",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    events.addGlobalSecondaryIndex({
      indexName: "UpcomingIndex",
      partitionKey: { name: "category", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "startDate", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 4. Registrations ★ PK=eventId, SK=userId ★
    // Prevents duplicate registration for same event+user.
    // GSI: UserRegistrationsIndex (user's registrations)
    // GSI: RegistrationStatusIndex (status-based management)
    const registrations = new dynamodb.Table(this, "Registrations", {
      tableName: "College_Registrations",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    registrations.addGlobalSecondaryIndex({
      indexName: "UserRegistrationsIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "registeredAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    registrations.addGlobalSecondaryIndex({
      indexName: "RegistrationStatusIndex",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 5. Payments — payment records
    // GSI: RegistrationPaymentIndex (payment status per registration)
    // GSI: UserPaymentsIndex (user's payment history)
    const payments = new dynamodb.Table(this, "Payments", {
      tableName: "College_Payments",
      partitionKey: { name: "paymentId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    payments.addGlobalSecondaryIndex({
      indexName: "RegistrationPaymentIndex",
      partitionKey: { name: "registrationId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    payments.addGlobalSecondaryIndex({
      indexName: "UserPaymentsIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 6. Certificates — digital certificates
    // GSI: UserCertificatesIndex (user's certificates)
    // GSI: EventCertificatesIndex (certificates per event)
    const certificates = new dynamodb.Table(this, "Certificates", {
      tableName: "College_Certificates",
      partitionKey: { name: "certificateId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    certificates.addGlobalSecondaryIndex({
      indexName: "UserCertificatesIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "issuedAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    certificates.addGlobalSecondaryIndex({
      indexName: "EventCertificatesIndex",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "certificateId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 7. ODRequests — out-of-duty requests
    // GSI: UserODIndex (user's OD history)
    // GSI: EventODIndex (OD requests per event)
    // GSI: ODStatusIndex (status workflow: pending/approved/rejected)
    const odRequests = new dynamodb.Table(this, "ODRequests", {
      tableName: "College_ODRequests",
      partitionKey: { name: "odRequestId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    odRequests.addGlobalSecondaryIndex({
      indexName: "UserODIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    odRequests.addGlobalSecondaryIndex({
      indexName: "EventODIndex",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "odRequestId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    odRequests.addGlobalSecondaryIndex({
      indexName: "ODStatusIndex",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 8. ActivityPoints — per-user activity points
    // PK: userId — one item with category-wise point totals
    const activityPoints = new dynamodb.Table(this, "ActivityPoints", {
      tableName: "College_ActivityPoints",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // 9. Teams — team registration for events
    // PK: teamId
    // GSI: EventTeamsIndex (teams per event)
    // GSI: UserTeamsIndex (user's teams)
    const teams = new dynamodb.Table(this, "Teams", {
      tableName: "College_Teams",
      partitionKey: { name: "teamId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    teams.addGlobalSecondaryIndex({
      indexName: "EventTeamsIndex",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "teamId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    teams.addGlobalSecondaryIndex({
      indexName: "UserTeamsIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 10. Feedback — event feedback
    // GSI: EventFeedbackIndex (feedback per event for analytics)
    const feedback = new dynamodb.Table(this, "Feedback", {
      tableName: "College_Feedback",
      partitionKey: { name: "feedbackId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    feedback.addGlobalSecondaryIndex({
      indexName: "EventFeedbackIndex",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "submittedAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
