#!/usr/bin/env node
/**
 * CDK App Entry Point
 * College Event Portal — Infrastructure
 *
 * Deploys: Auth (Cognito), Data (DynamoDB), Storage (S3)
 */

import { App, Tags } from "aws-cdk-lib";
import { AuthStack } from "../lib/auth-stack";
import { DataStack } from "../lib/data-stack";
import { StorageStack } from "../lib/storage-stack";

const app = new App();

// ── Project tags applied to every resource ──────────────────────────
Tags.of(app).add("Project", "CollegeEventPortal");
Tags.of(app).add("ManagedBy", "CDK");

// ── The stacks ───────────────────────────────────────────────────────
const data = new DataStack(app, "DataStack");

const auth = new AuthStack(app, "AuthStack", {
  collegeEmailDomain:
    process.env.COLLEGE_EMAIL_DOMAIN || "vit.ac.in",
});

const storage = new StorageStack(app, "StorageStack", {
  collegeEmailDomain: auth.collegeEmailDomain,
});

// ── Outputs ──────────────────────────────────────────────────────────
// After `cdk deploy`, values are printed to terminal and written to
// cdk-outputs.json — wire them into .env.local of the Next.js app.
