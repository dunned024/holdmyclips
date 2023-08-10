import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as path from "path"
import { Construct } from "constructs"
import { Duration } from "aws-cdk-lib"


export class AuthLambdas extends Construct {
  public readonly checkAuthFn: lambda.Function
  public readonly httpHeadersFn: lambda.Function
  public readonly parseAuthFn: lambda.Function
  public readonly refreshAuthFn: lambda.Function
  public readonly signOutFn: lambda.Function

  constructor(scope: Construct, id: string) {
    super(scope, id)

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
    })

    this.checkAuthFn = this.addFunction("CheckAuthFn", "check-auth", role)
    this.httpHeadersFn = this.addFunction("HttpHeadersFn", "http-headers", role)
    this.parseAuthFn = this.addFunction("ParseAuthFn", "parse-auth", role)
    this.refreshAuthFn = this.addFunction("RefreshAuthFn", "refresh-auth", role)
    this.signOutFn = this.addFunction("SignOutFn", "sign-out", role)
  }

  private addFunction(id: string, assetName: string, role: iam.IRole) {
    return new lambda.Function(this, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, `../lambdas/${assetName}`)),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(5),
      role,
    })
  }
}