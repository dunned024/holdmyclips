import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess, CorsRule, HttpMethods, CfnBucket } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CacheHeaderBehavior, CachePolicy, CachedMethods, Distribution, ErrorResponse, OriginAccessIdentity, ViewerProtocolPolicy, OriginRequestPolicy, BehaviorOptions } from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { experimental } from 'aws-cdk-lib/aws-cloudfront';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Role, ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import path from 'path';
import {
  ARecord,
  PublicHostedZone,
  RecordTarget
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';


export interface StaticSiteStackProps extends StackProps {
  apiGateway: LambdaRestApi
}


export class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);
    const corsRule: CorsRule = {
      allowedMethods: [HttpMethods.DELETE, HttpMethods.GET, HttpMethods.HEAD, HttpMethods.POST, HttpMethods.PUT],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    };

    const bucket = new Bucket(this, 'Bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: 'hold-my-clips',
      cors: [corsRule],
      versioned: true,
    });

    const apiOrigin = new RestApiOrigin(props.apiGateway, {originPath: '/prod'}) // originPath points to the Stage
    const clipdexBehavior: BehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      origin: apiOrigin,
      originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    }

    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI');

    // const cachePolicy = new CachePolicy(this, 'DistributionCachePolicy', {
    //   defaultTtl: Duration.days(7),
    //   headerBehavior: CacheHeaderBehavior.allowList('Origin'),
    //   maxTtl: Duration.days(30),
    //   minTtl: Duration.days(1),
    // })

    const authLambda = new AuthLambda(this, 'AuthLambda');
    const s3Origin = new S3Origin(bucket, {originAccessIdentity})
    const defaultBehavior: BehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      origin: s3Origin,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      // edgeLambdas: [{
      //   functionVersion: authLambda.edgeLambda.currentVersion,
      //   eventType: LambdaEdgeEventType.VIEWER_REQUEST
      // }],
    }

    const errorResponses: ErrorResponse[] = [403, 404].map((status) => {
      return {
        httpStatus: status,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(10),
      }}
    )

    // Cert created manually because there is a wait time for approval
    const domainCert = Certificate.fromCertificateArn(
      this,
      'DomainCert',
      'arn:aws:acm:us-east-1:879223189443:certificate/7af9de79-58db-41b7-a4ae-d93334ff4f9e'
    );

    const domainName = 'clips.dunned024.com'
  
    const distribution = new Distribution(this, 'Distribution', {
      additionalBehaviors: {
        'clips': clipdexBehavior, // pathPattern matches API endpoint
      },
      certificate: domainCert,
      defaultBehavior: defaultBehavior,
      defaultRootObject: 'index.html',
      domainNames: [domainName],
      errorResponses: errorResponses,
    });

    // Domain & hosted zone also created manually
    const hostedZone = PublicHostedZone.fromPublicHostedZoneAttributes(
      this,
      'PublicHostedZone',
      {
        zoneName: 'dunned024.com',
        hostedZoneId: 'Z03422011GHHEJEF39FO6'
      }
    );

    new ARecord(this, 'DnsRecord', {
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone
    });

    const policyOverride = bucket.node.findChild("Policy").node.defaultChild as CfnBucket;
    policyOverride.addOverride(
      "Properties.PolicyDocument.Statement.0.Action",
      ["s3:GetObject", "s3:PutObject"],
    );

    new CfnOutput(this, 'StaticSiteDistributionId', { value: distribution.distributionId });
  }
}


class AuthLambda extends Construct {
    public readonly edgeLambda: experimental.EdgeFunction;

    constructor(scope: Construct, id: string) {
      super(scope, id);

      const authRole = new Role(this, 'Role', {
        roleName: 'hold-my-clips-lambda-auth-role',
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        ]
      });

      this.edgeLambda = new experimental.EdgeFunction(this, 'Function', {
        runtime: Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.join(__dirname, '../services/auth/')),
        role: authRole,
      });
    }
}
