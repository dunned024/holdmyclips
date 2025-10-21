import { Duration } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class AuthLambdas extends Construct {
  public readonly checkAuthFn: lambda.Function;
  public readonly httpHeadersFn: lambda.Function;
  public readonly parseAuthFn: lambda.Function;
  public readonly refreshAuthFn: lambda.Function;
  public readonly signOutFn: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const role = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("edgelambda.amazonaws.com"),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    const functionProps = {
      awsSdkConnectionReuse: false,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(5),
      role,
    };

    this.checkAuthFn = new NodejsFunction(this, "check-auth", functionProps);
    this.httpHeadersFn = new NodejsFunction(
      this,
      "http-headers",
      functionProps,
    );
    this.parseAuthFn = new NodejsFunction(this, "parse-auth", functionProps);
    this.refreshAuthFn = new NodejsFunction(
      this,
      "refresh-auth",
      functionProps,
    );
    this.signOutFn = new NodejsFunction(this, "sign-out", functionProps);
  }
}
