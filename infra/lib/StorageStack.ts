import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess, CorsRule, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CacheHeaderBehavior, CachePolicy, CachedMethods, Distribution, ErrorResponse, OriginAccessIdentity, ViewerProtocolPolicy, LambdaEdgeEventType } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
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


export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const corsRule: CorsRule = {
      allowedMethods: [HttpMethods.GET],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    };

    const bucket = new Bucket(this, 'HoldMyClipsS3Bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: 'hold-my-clips',
      cors: [corsRule],
      versioned: true,
    });
    
    const originAccessIdentity = new OriginAccessIdentity(this, 'HoldMyClipsOAI');

    // Cert created manually because there is a wait time for approval
    const domainCert = Certificate.fromCertificateArn(
      this,
      'HoldMyClipsDomainCert',
      'arn:aws:acm:us-east-1:879223189443:certificate/7af9de79-58db-41b7-a4ae-d93334ff4f9e'
    );

    const domainName = 'clips.dunned024.com'

    const cachePolicy = new CachePolicy(this, 'HoldMyClipsDistributionCachePolicy', {
      defaultTtl: Duration.days(7),
      headerBehavior: CacheHeaderBehavior.allowList('Origin'),
      maxTtl: Duration.days(30),
      minTtl: Duration.days(1),
    })


    const errorResponses: ErrorResponse[] = [403, 404].map((status) => {
      return {
        httpStatus: status,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(10),
      }}
    )
    
    const authLambda = new AuthLambda(this, 'HoldMyClipsAuth');

    const distribution = new Distribution(this, 'HoldMyClipsDistribution', {
      additionalBehaviors: {
        'upload': {
          allowedMethods: AllowedMethods.ALLOW_ALL,
          origin: new S3Origin(bucket, {originAccessIdentity})
        },
        // edgeLambdas: [{
        //   functionVersion: authLambda.edgeLambda.currentVersion,
        //   eventType: LambdaEdgeEventType.VIEWER_REQUEST
        // }],

      },
      certificate: domainCert,
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy,
        // edgeLambdas: [{
        //   functionVersion: authLambda.edgeLambda.currentVersion,
        //   eventType: LambdaEdgeEventType.VIEWER_REQUEST
        // }],
        origin: new S3Origin(bucket, {originAccessIdentity}),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html',
      domainNames: [domainName],
      errorResponses: errorResponses,
    });
    
    // Domain & hosted zone also created manually
    const hostedZone = PublicHostedZone.fromPublicHostedZoneAttributes(
      this,
      'HoldMyClipsPublicHostedZone',
      {
        zoneName: 'dunned024.com',
        hostedZoneId: 'Z03422011GHHEJEF39FO6'
      }
    );

    new ARecord(this, 'HoldMyClipsDnsRecord', {
      recordName: domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone
    });
  }
}


class AuthLambda extends Construct {
    public readonly edgeLambda: experimental.EdgeFunction;

    constructor(scope: Construct, id: string) {
      super(scope, id);

      const authRole = new Role(this, 'HoldMyClipsAuthRole', {
        roleName: 'hold-my-clips-lambda-auth-role',
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        ]
      });

      this.edgeLambda = new experimental.EdgeFunction(this, 'HoldMyClipsAuthFunction', {
        runtime: Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.join(__dirname, '../services/auth/')),
        role: authRole,
      });
    }
}
