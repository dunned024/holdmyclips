import path from "path";
import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import type { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import {
  type AddBehaviorOptions,
  AllowedMethods,
  type BehaviorOptions,
  CachePolicy,
  CachedMethods,
  Distribution,
  type EdgeLambda,
  type ErrorResponse,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { RestApiOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  Code,
  // biome-ignore lint/suspicious/noShadowRestrictedNames: this ain't the same thing
  Function,
  type IVersion,
  Runtime,
  Version,
} from "aws-cdk-lib/aws-lambda";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  type CfnBucket,
  type CorsRule,
  HttpMethods,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import type { HostedDomain } from "./HostedDomainStack";
import type {
  AuthLambdaFnVersions,
  CloudFrontAuth,
} from "./auth/CloudfrontAuth";
import type { ConfiguredStackProps } from "./config";

export interface StaticSiteStackProps extends ConfiguredStackProps {
  apiGateway: LambdaRestApi;
  cloudFrontAuth: CloudFrontAuth;
  hostedDomain: HostedDomain;
}

export class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);
    const corsRule: CorsRule = {
      allowedMethods: [
        HttpMethods.GET,
        HttpMethods.HEAD,
        HttpMethods.POST,
        HttpMethods.PUT,
      ],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
    };

    const bucket = new Bucket(this, "Bucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: props.bucketName,
      cors: [corsRule],
      versioned: true,
    });

    bucket.addLifecycleRule({
      enabled: true,
      expiredObjectDeleteMarker: true,
      id: "DeleteExpiredNoncurrentVersionsAfter2Weeks",
      noncurrentVersionExpiration: Duration.days(14),
      prefix: "clips/",
    });

    const responseHeadersPolicy = new ResponseHeadersPolicy(
      this,
      "ResponseHeadersPolicy",
      {
        responseHeadersPolicyName: `CorsAndCsp-${props.environment}`,
        comment: `Policy to allow CORS and CSP for media streaming (${props.environment})`,
        corsBehavior: {
          accessControlAllowCredentials: false,
          accessControlAllowMethods: ["GET", "HEAD", "POST", "PUT"],
          accessControlAllowHeaders: ["*"],
          accessControlAllowOrigins: ["*"],
          originOverride: true,
        },
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy:
              "media-src 'self' blob:; manifest-src 'self'",
            override: true,
          },
        },
      },
    );

    const errorResponses: ErrorResponse[] = [403, 404].map((status) => {
      return {
        httpStatus: status,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
        ttl: Duration.minutes(10),
      };
    });

    // Define distribution behaviors
    const originAccessIdentity = new OriginAccessIdentity(this, "OAI");
    const s3Origin = new S3Origin(bucket, { originAccessIdentity });
    const defaultBehavior: BehaviorOptions = {
      origin: s3Origin,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    const linkPreviewBehavior: BehaviorOptions = {
      origin: s3Origin,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      edgeLambdas: [
        this.getLinkPreviewEdgeLambda(props.bucketName, props.environment),
      ],
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    const protectedPageBehavior: AddBehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    const apiBehavior: AddBehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    const uploadBehavior: AddBehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: new CachePolicy(this, "UploadCachePolicy", {
        maxTtl: Duration.seconds(0),
        minTtl: Duration.seconds(0),
      }),
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    // Re-evaluate whether or not this is needed, based on how much it
    // costs to store these logs vs. their usefulness.
    // They're also not easy to use, since I'm not spending money on
    // Athena.
    const logBucket = new Bucket(this, "LogBucket", {
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: `${props.bucketName}-distribution-logs`,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
    });

    // const auth = props.cloudFrontAuth;
    // const authLambdas = this.getAuthLambdaFnVersions(props.environment);
    const apiOrigin = new RestApiOrigin(props.apiGateway, {
      originPath: "/prod",
    }); // originPath points to the Stage
    const distribution = new Distribution(this, "Distribution", {
      additionalBehaviors: {
        // ...auth.createAuthPagesBehaviors(authLambdas, s3Origin),
        // signedin: auth.createProtectedBehavior(
        //   authLambdas,
        //   s3Origin,
        //   protectedPageBehavior,
        // ),
        // upload: auth.createProtectedBehavior(
        //   authLambdas,
        //   s3Origin,
        //   protectedPageBehavior,
        // ),
        // uploadclip: auth.createProtectedBehavior(
        //   authLambdas,
        //   s3Origin,
        //   uploadBehavior,
        // ),
        // clipdata: auth.createProtectedBehavior(
        //   authLambdas,
        //   apiOrigin,
        //   uploadBehavior,
        // ), // pathPattern matches API endpoint
        // clipcomments: auth.createProtectedBehavior(
        //   authLambdas,
        //   apiOrigin,
        //   uploadBehavior,
        // ), // pathPattern matches API endpoint
        "player/*": linkPreviewBehavior, // Adds Edge Lambda for link previews for player/* URIs
      },
      certificate: props.hostedDomain.cert,
      defaultBehavior: defaultBehavior,
      defaultRootObject: "index.html",
      domainNames: [props.fqdn],
      errorResponses: errorResponses,
      logBucket: logBucket,
      priceClass: PriceClass.PRICE_CLASS_100,
    });

    // This path is responsible for returning data from the clipdex
    distribution.addBehavior("clips", apiOrigin, apiBehavior); // pathPattern matches API endpoint
    distribution.addBehavior("clip/*", apiOrigin, apiBehavior); // pathPattern matches API endpoint

    new ARecord(this, "DnsRecord", {
      recordName: props.fqdn,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: props.hostedDomain.hostedZone,
    });

    const policyOverride = bucket.node.findChild("Policy").node
      .defaultChild as CfnBucket;
    policyOverride.addOverride("Properties.PolicyDocument.Statement.0.Action", [
      "s3:GetObject",
      "s3:PutObject",
    ]);

    new CfnOutput(this, "StaticSiteDistributionId", {
      value: distribution.distributionId,
    });
  }

  getAuthLambdaFnVersions(environment: string): AuthLambdaFnVersions {
    function fn(scope: Stack, name: string, env: string): IVersion {
      const value = StringParameter.valueForStringParameter(
        scope,
        `/HMC/${env}/lambdas/${name}Arn`,
      );
      return Version.fromVersionArn(scope, name, value);
    }

    return {
      checkAuthFn: fn(this, "CheckAuthFn", environment),
      httpHeadersFn: fn(this, "HttpHeadersFn", environment),
      parseAuthFn: fn(this, "ParseAuthFn", environment),
      refreshAuthFn: fn(this, "RefreshAuthFn", environment),
      signOutFn: fn(this, "SignOutFn", environment),
    };
  }

  getLinkPreviewEdgeLambda(
    bucketName: string,
    environment: string,
  ): EdgeLambda {
    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:GetObject*", "s3:GetObjectAcl*"],
      resources: [`arn:aws:s3:::${bucketName}/*`],
    });

    const role = new Role(this, "Role", {
      roleName: `hold-my-clips-preview-lambda-role-${environment}`,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
      inlinePolicies: {
        "HMC-preview-lambda-s3-access": new PolicyDocument({
          statements: [s3PolicyStatement],
        }),
      },
    });

    const previewLambda = new Function(this, "LinkPreviewFunction", {
      runtime: Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: Code.fromAsset(path.join(__dirname, "../services/preview/")),
      role,
      timeout: Duration.seconds(5),
    });

    return {
      eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
      functionVersion: previewLambda.currentVersion,
    };
  }
}
