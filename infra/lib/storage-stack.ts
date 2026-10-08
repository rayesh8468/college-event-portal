import {
  Stack,
  StackProps,
  CfnOutput,
  RemovalPolicy,
  Duration,
} from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface StorageStackProps extends StackProps {
  /** College email domain — used to derive a readable bucket name */
  collegeEmailDomain: string;
}

/**
 * StorageStack — Private S3 bucket for documents.
 *
 * Stores: certificates, NAAC/NBA/AICTE reports, OD letters.
 * All objects are private by default; access via PreSigned URLs only.
 * Lifecycle rules archive docs older than 365 days to Glacier.
 */
export class StorageStack extends Stack {
  /** Bucket name — reference from env / API routes */
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const domain = props.collegeEmailDomain.replace(".", "-");
    const bucketId = `college-portal-docs-${domain}`;

    const bucket = new s3.Bucket(this, "DocumentsBucket", {
      bucketName: bucketId,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY, // demo; prod → RETAIN
      autoDeleteObjects: true,
      serverAccessLogsPrefix: "access-logs/",
      lifecycleRules: [
        {
          id: "ArchiveOldDocuments",
          prefix: "",
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: Duration.days(365),
            },
          ],
          expiration: Duration.days(730),
        },
        {
          id: "AbortIncompleteMultipartUploads",
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    this.bucketName = bucket.bucketName;

    // ────────────────────────────────────────────────────────────────
    // Outputs
    // ────────────────────────────────────────────────────────────────
    new CfnOutput(this, "DocumentsBucketNameOutput", {
      value: this.bucketName,
      description: "S3 bucket for documents (certificates, reports, OD letters)",
      exportName: "CollegePortalDocumentsBucket",
    });

    new CfnOutput(this, "DocumentsBucketArnOutput", {
      value: bucket.bucketArn,
      description: "S3 bucket ARN for documents",
      exportName: "CollegePortalDocumentsBucketArn",
    });
  }
}
