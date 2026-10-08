# AWS Services Used — VIT Event Portal

**Project:** College Event Portal (Next.js 16.3.5)
**Account ID:** `057481081464`
**Region:** `ap-south-1` (Mumbai)
**Deployed via:** AWS CDK v2 (TypeScript)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  (localhost:3000 / Vercel)                                  │
│  - Student pages, Admin pages, Auth pages                   │
│  - Calls API routes → DynamoDB / Cognito                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │  API Routes (Next.js)   │
              │  /api/events, /api/auth │
              │  /api/feedback, etc.   │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────┴─────┐   ┌──────┴──────┐   ┌──────┴──────┐
   │  DynamoDB  │   │   Cognito   │   │     S3      │
   │ (10 tables)│   │  User Pool  │   │  (Docs      │
   │            │   │  + Lambda   │   │   Bucket)   │
   └────────────┘   └─────────────┘   └─────────────┘
         │                 │
   ┌─────┴─────┐   ┌──────┴──────┐
   │  DataStack │   │  AuthStack  │   ┌──────┴──────┐
   │   (CDK)    │   │   (CDK)     │   │StorageStack │
   └────────────┘   └────────────┘   │   (CDK)     │
                                       └─────────────┘
```

All infrastructure is defined in AWS CDK (TypeScript) and deployed via
`cdk deploy`. The CDK stacks create and manage all AWS resources.

---

## AWS Services Breakdown

### 1. Amazon DynamoDB — NoSQL Database

**What it is:** Fully managed NoSQL key-value and document database.

**Why used:** Stores all application data — events, users, registrations,
payments, certificates, OD requests, feedback, teams, activity points.

**Tables created (10):**

| Table Name | Primary Key | GSIs | Purpose |
|---|---|---|---|
| `College_Departments` | `departmentCode` (STRING) | — | Department master data |
| `College_Users` | `userId` (STRING) | `EmailIndex`, `DepartmentRoleIndex` | User profiles + lookup by email/dept+role |
| `College_Events` | `eventId` (STRING) | `DepartmentDateIndex`, `StatusIndex`, `UpcomingIndex` | Event definitions + queries by dept/date, status, category |
| `College_Registrations` | `eventId` (PK) + `userId` (SK) | `UserRegistrationsIndex`, `RegistrationStatusIndex` | Event registrations — composite key prevents duplicates |
| `College_Payments` | `paymentId` (STRING) | `RegistrationPaymentIndex`, `UserPaymentsIndex` | Payment records |
| `College_Certificates` | `certificateId` (STRING) | `UserCertificatesIndex`, `EventCertificatesIndex` | Digital certificates |
| `College_ODRequests` | `odRequestId` (STRING) | `UserODIndex`, `EventODIndex`, `ODStatusIndex` | Out-of-duty requests with status workflow |
| `College_ActivityPoints` | `userId` (STRING) | — | Per-user activity points totals |
| `College_Teams` | `teamId` (STRING) | `EventTeamsIndex`, `UserTeamsIndex` | Team registrations |
| `College_Feedback` | `feedbackId` (STRING) | `EventFeedbackIndex` | Event feedback submissions |

**Configuration:**
- Billing: `PAY_PER_REQUEST` (on-demand, pay per read/write)
- Point-in-time recovery: enabled on all tables
- Removal policy: `DESTROY` (tables deleted when stack is destroyed — demo only)

**How the app uses it:** The Next.js API routes (`/api/events`, `/api/auth/register`,
`/api/feedback`, etc.) use the AWS SDK v3 (`@aws-sdk/client-dynamodb`,
`@aws-sdk/lib-dynamodb`) to read/write data. The seed script
(`scripts/seed-demo-data.ts`) populates initial data.

---

### 2. Amazon Cognito — User Authentication & Authorization

**What it is:** Managed user identity service for authentication, authorization,
and user management.

**Why used:** Handles user sign-up, sign-in, and role-based access control
(Students, DeptHeads, SuperAdmins).

**Resources created:**

| Resource | Name/ID | Purpose |
|---|---|---|
| User Pool | `CollegeEventPortalUsers` (`ap-south-1_wwhNfufC3`) | User directory — stores user profiles, credentials, groups |
| App Client | `CollegeEventPortalClient` (`1n3hvceu6lu8cqgh796djdachl`) | Frontend client for login flows — no secret, uses SRP auth |
| PreSignUp Trigger | Lambda: `PreSignUpDomainChecker` | Restricts sign-up to college email domain only (`@vitpastudent.ac.in`) |
| User Groups | `Students`, `DeptHeads`, `SuperAdmins` | Role-based access — users assigned to groups on creation |

**User Pool configuration:**
- Self-sign-up: enabled (with domain restriction via Lambda trigger)
- Sign-in: email as username, case-insensitive
- Password policy: min 8 chars, lowercase + uppercase + digits required
- MFA: OFF (demo)
- Token validity: ID/access tokens = 1 hour, refresh token = 30 days
- Auth flows: SRP (frontend), admin user password (backend)

**How the app uses it:**
- Login (`/api/auth/login`): validates email domain, returns mock JWT tokens
  in demo mode (real Cognito `AdminInitiateAuth` in production)
- JWT verification (`lib/cognito.ts`): uses `jose` library to verify Cognito
  JWT tokens against the User Pool's JWKS endpoint
- Role checking: `cognito:groups` claim in JWT determines user role
  (Student, DeptHead, SuperAdmin)

**PreSignUp Lambda (domain restriction):**
```javascript
// Inline Lambda code — runs on every sign-up attempt
exports.handler = async (event) => {
  const allowedDomain = process.env.ALLOWED_DOMAIN || "vitpastudent.ac.in";
  const email = event.request?.userAttributes?.email?.toLowerCase() || "";
  if (!email.endsWith("@" + allowedDomain)) {
    throw new Error("Sign-up rejected: only @" + allowedDomain + " emails allowed.");
  }
  return event; // allow sign-up
};
```
The Lambda is attached to the User Pool as a PreSignUp trigger. It rejects any
sign-up attempt with a non-college email.

---

### 3. Amazon S3 — Document Storage

**What it is:** Object storage service for files, documents, backups.

**Why used:** Stores uploaded documents — certificates, NAAC/NBA/AICTE reports,
OD letters. Private by default, accessed via pre-signed URLs.

**Bucket created:**
- Name: `college-portal-docs-vit-ac-in`
- Access: `BLOCK_ALL` public access
- Encryption: S3-managed encryption (SSE-S3)
- Versioning: enabled
- SSL enforcement: enabled
- Object ownership: `BUCKET_OWNER_PREFERRED`

**Lifecycle rules:**
- Documents older than 365 days → transition to Glacier Instant Retrieval
- Documents older than 730 days → expire (delete)
- Abort incomplete multipart uploads after 7 days

**How the app uses it:** API routes generate pre-signed URLs for document
upload/download. Users never access S3 directly — all access goes through
the Next.js API with authentication.

---

### 4. AWS Lambda — Serverless Compute

**What it is:** Run code without provisioning servers — pay per execution.

**Why used:** PreSignUp trigger for Cognito — validates email domain on sign-up.

**Lambda created:**
- Name: `PreSignUpDomainChecker` (logical ID: `PreSignUpDomainChecker4A8E06CB`)
- Runtime: Node.js 20.x
- Handler: `index.handler`
- Code: inline (embedded in CDK stack)
- Timeout: 5 seconds
- Memory: 128 MB
- Triggered by: Cognito User Pool PreSignUp events

---

### 5. AWS IAM — Identity & Access Management

**What it is:** Manage access to AWS services and resources securely.

**Used for:**
- **CDK execution role:** The IAM user `Raju` (access key `YOUR_ACCESS_KEY_ID`)
  deploys stacks with AdministratorAccess
- **Lambda execution role:** Auto-created by CDK for the PreSignUp Lambda
  (`PreSignUpDomainCheckerServiceRole0F84CD5F`)
- **CDK bootstrap roles:** `CDKToolkit` stack creates deployment roles
  (`cdk-hnb659fds-deploy-role-*`, `cdk-hnb659fds-file-publishing-role-*`)
  that CDK assumes during deployment

---

### 6. AWS CloudFormation — Infrastructure as Code

**What it is:** Model and provision AWS resources using templates.

**Why used:** CDK compiles TypeScript stacks into CloudFormation templates and
deploys them. All resources are managed as CloudFormation stacks.

**Stacks deployed:**

| Stack Name | Resources | Status |
|---|---|---|
| `CDKToolkit` | Bootstrap resources (S3 staging bucket, IAM roles, SSM params) | ✅ |
| `DataStack` | 10 DynamoDB tables + GSIs | ✅ |
| `AuthStack` | Cognito User Pool, App Client, Lambda, 3 User Groups | ✅ |
| `StorageStack` | S3 bucket + bucket policy + auto-delete custom resource | ✅ |

**CloudFormation outputs (after deploy):**

```
AuthStack.UserPoolIdOutput       = ap-south-1_wwhNfufC3
AuthStack.UserPoolClientIdOutput = 1n3hvceu6lu8cqgh796djdachl
AuthStack.UserPoolArnOutput      = arn:aws:cognito-idp:ap-south-1:057481081464:userpool/ap-south-1_wwhNfufC3
AuthStack.CollegeEmailDomainOutput = vitpastudent.ac.in
StorageStack.DocumentsBucketNameOutput = college-portal-docs-vit-ac.in
StorageStack.DocumentsBucketArnOutput  = arn:aws:s3:::college-portal-docs-vit-ac.in
```

---

### 7. AWS Systems Manager (SSM) — Parameter Store

**What it is:** Securely store configuration data and secrets.

**Why used:** CDK bootstrap stores version info in SSM parameters.
- Parameter: `/cdk-bootstrap/hnb659fds/version` — tracks CDK bootstrap version

---

## How the Pieces Work Together

### User Registration Flow
```
1. User fills registration form (name, email, password)
2. POST /api/auth/register
3. API validates: name length, email format, domain (@vitpastudent.ac.in),
   password strength, password match
4. API checks Cognito: does this email already exist?
   - Yes → return 409 "Email already registered"
   - No → proceed
5. In demo mode: return success (Cognito user created separately via SDK)
   In production: call Cognito AdminCreateUser / SignUp
6. User logs in with email + password
7. POST /api/auth/login → returns mock JWT (demo) or real Cognito tokens
8. JWT stored in cookie → used for subsequent API requests
```

### Event Browsing Flow
```
1. Student visits /events
2. Page component fetches GET /api/events
3. API queries DynamoDB College_Events table
   - Uses StatusIndex GSI for status filtering
   - Uses DepartmentDateIndex GSI for dept+date filtering
   - Uses UpcomingIndex GSI for category+startDate filtering
4. Returns list of events → page renders event cards
```

### Admin Certificate Issuance Flow
```
1. Admin visits /certificates/manage
2. Page fetches all events + all certificates from DynamoDB
3. Admin selects event + users → clicks "Issue Certificates"
4. POST /api/certificates → writes to College_Certificates table
5. Certificates appear in the admin list + student's /certificates page
```

---

## Demo Mode

The app has a `NEXT_PUBLIC_DEMO_MODE=true` flag in `.env.local`. In demo mode:

- **Login:** Returns mock JWT tokens (base64-encoded JSON) instead of calling
  Cognito. Any college-domain email + any password works.
- **Registration:** Validates input and checks Cognito for duplicates, but
  doesn't actually create a Cognito user (user must be created via SDK/Console).
- **Payments:** Mock payment creation (no real Razorpay/payment gateway calls).

This allows the app to be fully functional for demonstration without needing
real Cognito authentication flows or payment gateway integration.

---

## Environment Variables (`.env.local`)

```
AWS_REGION              = ap-south-1
AWS_ACCESS_KEY_ID       = YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY   = YOUR_SECRET_ACCESS_KEY
COGNITO_USER_POOL_ID    = ap-south-1_wwhNfufC3
COGNITO_CLIENT_ID       = 1n3hvceu6lu8cqgh796djdachl
NEXT_PUBLIC_DEMO_MODE   = true
NEXT_PUBLIC_SITE_NAME   = VIT Event Portal
COLLEGE_EMAIL_DOMAIN    = vitpastudent.ac.in
```

---

## CDK Commands Used

```bash
# Install dependencies
cd infra && npm install

# Bootstrap (first time only — creates CDKToolkit stack)
cd infra && npx cdk bootstrap

# Deploy all stacks
cd infra && npx cdk deploy --all

# Deploy a single stack
cd infra && npx cdk deploy AuthStack

# Destroy all stacks (removes all resources)
cd infra && npx cdk destroy --all
```

---

## Demo Users Created

| Email | Name | Role | Group |
|---|---|---|---|
| `hod.cse@vitpastudent.ac.in` | Dr. Ramesh | DeptHead | DeptHeads |
| `hod.it@vitpastudent.ac.in` | Dr. Sunita | DeptHead | DeptHeads |
| `hod.ece@vitpastudent.ac.in` | Dr. Anil | DeptHead | DeptHeads |
| `hod.mech@vitpastudent.ac.in` | Dr. Prakash | DeptHead | DeptHeads |
| `hod.aero@vitpastudent.ac.in` | Dr. Kavya | DeptHead | DeptHeads |
| `admin@vitpastudent.ac.in` | System Admin | SuperAdmin | SuperAdmins |
| `ram.21cse@vitpastudent.ac.in` | Ram Kumar | Student | Students |
| `priya.21it@vitpastudent.ac.in` | Priya Singh | Student | Students |
| `arjun.22ece@vitpastudent.ac.in` | Arjun Raj | Student | Students |

**Temporary password for all:** `Vit@12345` (must change on first login in production)

---

## Summary for Faculty

| Aspect | Detail |
|---|---|
| **Total AWS services used** | 7 (DynamoDB, Cognito, S3, Lambda, IAM, CloudFormation, SSM) |
| **Total resources created** | ~30+ (10 DynamoDB tables + GSIs, 1 Cognito pool, 1 app client, 1 Lambda, 3 user groups, 1 S3 bucket, IAM roles, CFN stacks) |
| **Infrastructure as Code** | AWS CDK v2 (TypeScript) — all resources defined in code, version-controllable |
| **Database** | DynamoDB — 10 tables, on-demand billing, GSIs for efficient queries |
| **Authentication** | Cognito — user pool, domain-restricted sign-up, role-based groups, JWT tokens |
| **File storage** | S3 — private bucket with lifecycle management, pre-signed URL access |
| **Serverless compute** | Lambda — PreSignUp trigger (inline code, 128MB, 5s timeout) |
| **Region** | ap-south-1 (Mumbai) |
| **Account** | 057481081464 |
