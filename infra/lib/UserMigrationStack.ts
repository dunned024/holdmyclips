import path from "path";
import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { type UserPool, UserPoolOperation } from "aws-cdk-lib/aws-cognito";
import {
  ManagedPolicy as ManagedPolicyClass,
  PolicyDocument as PolicyDocumentClass,
  PolicyStatement as PolicyStatementClass,
  Role as RoleClass,
  ServicePrincipal as ServicePrincipalClass,
} from "aws-cdk-lib/aws-iam";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import type { ConfiguredStackProps } from "./config";

export interface UserMigrationStackProps extends ConfiguredStackProps {
  newUserPool: UserPool;
  oldUserPoolId: string;
  oldClientId: string;
}

/**
 * Separate stack for just-in-time user migration from old to new Cognito User Pool.
 *
 * This stack is designed to be:
 * 1. Only deployed to production
 * 2. Easily removable after migration is complete
 * 3. Self-contained with no dependencies from other stacks
 *
 * To remove after migration:
 * 1. Remove this stack from createStacks.ts
 * 2. Run `cdk destroy HMCUserMigrationProd`
 * 3. Delete the old User Pool manually from AWS Console (optional)
 */
export class UserMigrationStack extends Stack {
  constructor(scope: Construct, id: string, props: UserMigrationStackProps) {
    super(scope, id, props);

    // Create IAM role for migration Lambda
    const migrationLambdaRole = new RoleClass(this, "MigrationLambdaRole", {
      assumedBy: new ServicePrincipalClass("lambda.amazonaws.com"),
      description:
        "Role for user migration Lambda to access old and new Cognito pools",
      managedPolicies: [
        ManagedPolicyClass.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
      inlinePolicies: {
        CognitoMigrationPolicy: new PolicyDocumentClass({
          statements: [
            // Permission to authenticate users in old pool
            new PolicyStatementClass({
              actions: ["cognito-idp:InitiateAuth", "cognito-idp:AdminGetUser"],
              resources: [
                `arn:aws:cognito-idp:${props.env.region}:${props.env.account}:userpool/${props.oldUserPoolId}`,
              ],
            }),
          ],
        }),
      },
    });

    // Create migration Lambda
    const migrationLambda = new LambdaFunction(this, "MigrationFunction", {
      runtime: Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: Code.fromAsset(path.join(__dirname, "../services/migrateAuth/")),
      role: migrationLambdaRole,
      timeout: Duration.seconds(30),
      description:
        "Just-in-time user migration from old to new Cognito User Pool",
      environment: {
        OLD_USER_POOL_ID: props.oldUserPoolId,
        OLD_CLIENT_ID: props.oldClientId,
      },
    });

    // Add Lambda trigger to new User Pool
    props.newUserPool.addTrigger(
      UserPoolOperation.USER_MIGRATION,
      migrationLambda,
    );

    // Grant Lambda permission to be invoked by Cognito
    migrationLambda.grantInvoke(
      new ServicePrincipalClass("cognito-idp.amazonaws.com"),
    );

    new CfnOutput(this, "MigrationLambdaArn", {
      value: migrationLambda.functionArn,
      description: "ARN of the user migration Lambda function",
    });

    new CfnOutput(this, "OldUserPoolId", {
      value: props.oldUserPoolId,
      description: "ID of the old User Pool being migrated from",
    });

    new CfnOutput(this, "MigrationStatus", {
      value: "ACTIVE",
      description:
        "Migration is active. Remove this stack when migration is complete.",
    });
  }
}
