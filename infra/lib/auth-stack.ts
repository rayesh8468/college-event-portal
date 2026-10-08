import {
  Stack,
  StackProps,
  CfnOutput,
  RemovalPolicy,
  Duration,
} from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface AuthStackProps extends StackProps {
  /** College email domain to restrict sign-ups to, e.g. "vit.ac.in" */
  collegeEmailDomain: string;
}

/**
 * PreSignUp trigger Lambda handler (inline).
 *
 * Runs when a sign-up request hits the Cognito user pool.
 * Rejects any email that does not end with @collegeEmailDomain.
 */
const preSignUpHandler = `
exports.handler = async (event) => {
  const allowedDomain = process.env.ALLOWED_DOMAIN || "vit.ac.in";
  const email = event.request?.userAttributes?.email?.toLowerCase() || "";

  if (!email.endsWith("@" + allowedDomain)) {
    throw new Error(
      "Sign-up rejected: only @" + allowedDomain + " email addresses are allowed."
    );
  }

  return event;
};
`;

export class AuthStack extends Stack {
  public readonly userPoolId: string;
  public readonly userPoolArn: string;
  public readonly userPoolClientId: string;
  public readonly collegeEmailDomain: string;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);
    this.collegeEmailDomain = props.collegeEmailDomain;

    // ────────────────────────────────────────────────────────────────
    // 1. Cognito User Pool
    //
    // NOTE: signInConfiguration is not available in this CDK version's
    // UserPoolProps.  Users will sign in with their email as the username
    // (signInCaseSensitive: false ensures case-insensitive match).
    // If you need email-as-alias sign-in, upgrade aws-cdk-lib or use a
    // CfnUserPool override to set SignInPolicy.
    // ────────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, "CollegeEventUserPool", {
      userPoolName: "CollegeEventPortalUsers",
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      mfa: cognito.Mfa.OFF,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.userPoolId = userPool.userPoolId;
    this.userPoolArn = userPool.userPoolArn;

    // ────────────────────────────────────────────────────────────────
    // 2. PreSignUp Trigger Lambda — email domain restriction
    // ────────────────────────────────────────────────────────────────
    const preSignUpFn = new lambda.Function(this, "PreSignUpDomainChecker", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(preSignUpHandler),
      environment: {
        ALLOWED_DOMAIN: props.collegeEmailDomain,
      },
      timeout: Duration.seconds(5),
      memorySize: 128,
      description:
        "PreSignUp trigger: only college domain (@vit.ac.in) emails allowed",
    });

    // v2.269: addTrigger instead of addPreSignUpTrigger
    userPool.addTrigger(
      cognito.UserPoolOperation.PRE_SIGN_UP,
      preSignUpFn,
      cognito.LambdaVersion.V1_0
    );

    // ────────────────────────────────────────────────────────────────
    // 3. User Groups (Roles) — Students, DeptHeads, SuperAdmins
    // ────────────────────────────────────────────────────────────────
    new cognito.UserPoolGroup(this, "StudentsGroup", {
      userPool,
      groupName: "Students",
      description: "General student users",
      precedence: 3,
    });

    new cognito.UserPoolGroup(this, "DeptHeadsGroup", {
      userPool,
      groupName: "DeptHeads",
      description: "HOD / Event creator",
      precedence: 2,
    });

    new cognito.UserPoolGroup(this, "SuperAdminsGroup", {
      userPool,
      groupName: "SuperAdmins",
      description: "Platform-wide administrator",
      precedence: 1,
    });

    // ────────────────────────────────────────────────────────────────
    // 4. Cognito App Client (frontend login)
    //
    // NOTE: tokenValidity replaced by per-token props in v2.269:
    //   idTokenValidity, accessTokenValidity, refreshTokenValidity
    // AuthFlow: refreshToken is NOT a valid AuthFlow property — handled
    //   via refreshTokenValidity on the client instead.
    // ────────────────────────────────────────────────────────────────
    const appClient = new cognito.UserPoolClient(this, "EventPortalClient", {
      userPool,
      userPoolClientName: "CollegeEventPortalClient",
      generateSecret: false,
      authFlows: {
        userSrp: true,         // SRP auth (frontend)
        adminUserPassword: true, // admin create/authenticate
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      idTokenValidity: Duration.hours(1),
      accessTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    this.userPoolClientId = appClient.userPoolClientId;

    // ────────────────────────────────────────────────────────────────
    // 5. Outputs — after `cdk deploy`, printed to terminal + cdk-outputs.json
    //    → duplicate into .env.local of the Next.js app
    // ────────────────────────────────────────────────────────────────
    new CfnOutput(this, "UserPoolIdOutput", {
      value: this.userPoolId,
      description: "Cognito User Pool ID",
      exportName: "CollegeEventUserPoolId",
    });

    new CfnOutput(this, "UserPoolClientIdOutput", {
      value: this.userPoolClientId,
      description: "Cognito App Client ID (for frontend auth)",
      exportName: "CollegeEventUserPoolClientId",
    });

    new CfnOutput(this, "UserPoolArnOutput", {
      value: this.userPoolArn,
      description: "Cognito User Pool ARN",
      exportName: "CollegeEventUserPoolArn",
    });

    new CfnOutput(this, "CollegeEmailDomainOutput", {
      value: this.collegeEmailDomain,
      description: "Allowed sign-up email domain (e.g. vit.ac.in)",
      exportName: "CollegeEmailDomain",
    });
  }
}
