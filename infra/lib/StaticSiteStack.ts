import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess, CorsRule, HttpMethods, CfnBucket, ObjectOwnership, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CacheHeaderBehavior, CachePolicy, CachedMethods, Distribution, ErrorResponse, OriginAccessIdentity, ViewerProtocolPolicy, OriginRequestPolicy, BehaviorOptions, AddBehaviorOptions, ResponseHeadersPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { experimental } from 'aws-cdk-lib/aws-cloudfront';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Role, ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import path from 'path';
import {
  ARecord,
  RecordTarget
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { HostedDomain } from './HostedDomainStack'
import { ConfiguredStackProps } from './config';
import { CloudFrontAuth } from '@henrist/cdk-cloudfront-auth';


export interface StaticSiteStackProps extends ConfiguredStackProps {
  apiGateway: LambdaRestApi
  cloudFrontAuth: CloudFrontAuth
  hostedDomain: HostedDomain
}

export class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);
    const corsRule: CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.HEAD, HttpMethods.POST, HttpMethods.PUT],
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
    //   headerBehavior: CacheHeaderBehavior.allowList('Origin', "Content-Security-Policy"),
    //   maxTtl: Duration.days(30),
    //   minTtl: Duration.days(1),
    // })

    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: 'CorsAndCsp',
      comment: 'Policy to allow CORS and CSP for media streaming',
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowMethods: ['GET', 'HEAD', 'POST', 'PUT'],
        accessControlAllowHeaders: ['*'],
        accessControlAllowOrigins: ['*'],
        originOverride: true,
      },
      securityHeadersBehavior: {
        contentSecurityPolicy: { contentSecurityPolicy: "media-src 'self' blob:; manifest-src 'self'", override: true },
      }
    })
  
    const errorResponses: ErrorResponse[] = [403, 404].map((status) => {
      return {
        httpStatus: status,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(10),
      }}
    )

    // Re-evaluate whether or not this is needed, based on how much it
    // costs to store these logs vs. their usefulness.
    // They're also not easy to use, since I'm not spending money on
    // Athena.
    const logBucket = new Bucket(this, 'LogBucket', {
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: 'hold-my-clips-distribution-logs',
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
    });

    const s3Origin = new S3Origin(bucket, {originAccessIdentity})
    const defaultBehavior: BehaviorOptions = {
      origin: s3Origin,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    }

    const uploadBehavior: AddBehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    }
    const auth = props.cloudFrontAuth;
    const distribution = new Distribution(this, 'Distribution', {
      additionalBehaviors: {
        ...auth.createAuthPagesBehaviors(s3Origin),
        'upload': auth.createProtectedBehavior(s3Origin, uploadBehavior),
        'clips': clipdexBehavior, // pathPattern matches API endpoint
      },
      certificate: props.hostedDomain.cert,
      defaultBehavior: defaultBehavior,
      defaultRootObject: 'index.html',
      domainNames: [props.fqdn],
      errorResponses: errorResponses,
      logBucket: logBucket,
    });

    new ARecord(this, 'DnsRecord', {
      recordName: props.fqdn,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: props.hostedDomain.hostedZone
    });

    auth.updateClient("ClientUpdate", {
      signOutUrl: `https://${props.fqdn}${auth.signOutRedirectTo}`,
      callbackUrl: `https://${props.fqdn}${auth.callbackPath}`,
    })

    const policyOverride = bucket.node.findChild("Policy").node.defaultChild as CfnBucket;
    policyOverride.addOverride(
      "Properties.PolicyDocument.Statement.0.Action",
      ["s3:GetObject", "s3:PutObject"],
    );

    new CfnOutput(this, 'StaticSiteDistributionId', { value: distribution.distributionId });
  }
}
