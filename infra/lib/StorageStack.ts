import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess, CorsRule, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CacheHeaderBehavior, CachePolicy, CachedMethods, Distribution, ErrorResponse, OriginAccessIdentity, ViewerProtocolPolicy, OriginRequestPolicy, BehaviorOptions } from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { experimental } from 'aws-cdk-lib/aws-cloudfront';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Role, ManagedPolicy, ServicePrincipal, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import path from 'path';
import {
  ARecord,
  PublicHostedZone,
  RecordTarget
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';


export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const corsRule: CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
    };

    const bucket = new Bucket(this, 'HoldMyClipsS3Bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: 'hold-my-clips',
      cors: [corsRule],
      versioned: true,
    });
    

    // Cert created manually because there is a wait time for approval
    const domainCert = Certificate.fromCertificateArn(
      this,
      'HoldMyClipsDomainCert',
      'arn:aws:acm:us-east-1:879223189443:certificate/7af9de79-58db-41b7-a4ae-d93334ff4f9e'
    );

    const domainName = 'clips.dunned024.com'


    // const apiDefaultHandler = new NodejsFunction(
    //   this,
    //   "apiDefaultHandler",
    //   {
    //     runtime: Runtime.NODEJS_18_X,
    //     handler: "get",
    //     entry: path.join(__dirname, "../../api/default/index.ts"),
    //     memorySize: 1024,
    //   }
    // );

    const uploadLambda = new UploadLambda(this, 'HoldMyClipsUpload');
    const apiGateway = new LambdaRestApi(this, "apiGateway", {
      handler: uploadLambda.handler,
      proxy: false,
    });
    const upload = apiGateway.root.addResource('upload');
    upload.addMethod('POST');  // POST /upload

    // /api
    // const apiRoute = apiGateway.root.addResource("upload")
    
    // /api/upload
    // const apiHelloRoute = apiRoute.addResource("upload");
    // // POST
    // apiHelloRoute.addMethod(
    //   "POST",
    //   new LambdaIntegration(uploadLambda.handler)
    // );

    const apiOrigin = new RestApiOrigin(apiGateway)
    const uploadBehavior: BehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      origin: apiOrigin,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      // edgeLambdas: [{
      //   functionVersion: uploadLambda.handler.currentVersion,
      //   eventType: LambdaEdgeEventType.VIEWER_REQUEST,
      //   includeBody: true
      // }],
    }

    const originAccessIdentity = new OriginAccessIdentity(this, 'HoldMyClipsOAI');

    const cachePolicy = new CachePolicy(this, 'HoldMyClipsDistributionCachePolicy', {
      defaultTtl: Duration.days(7),
      headerBehavior: CacheHeaderBehavior.allowList('Origin'),
      maxTtl: Duration.days(30),
      minTtl: Duration.days(1),
    })

    const authLambda = new AuthLambda(this, 'HoldMyClipsAuth');
    const s3Origin = new S3Origin(bucket, {originAccessIdentity})
    const defaultBehavior: BehaviorOptions = {
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      cachePolicy,
      origin: s3Origin,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      // edgeLambdas: [{
      //   functionVersion: authLambda.edgeLambda.currentVersion,
      //   eventType: LambdaEdgeEventType.VIEWER_REQUEST
      // }],
    }

    // const newDistribution = new CloudFrontWebDistribution(this, 'h', {
    //   originConfigs: [
    //     {
    //       s3OriginSource: {s3BucketSource: bucket, originAccessIdentity},
    //       behaviors: [
    //         { ...defaultBehavior,
    //           // lambdaFunctionAssociations: [
    //           //   {
    //           //     lambdaFunction: staticRewriteLambda,
    //           //     eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
    //           //   },
    //           // ],
    //           isDefaultBehavior: true,
    //         },
    //       ],
    //     },
    //   ],
    //   behaviors: [ {
    //     'upload': uploadBehavior,
    //   }],
    // })

    const errorResponses: ErrorResponse[] = [403, 404].map((status) => {
      return {
        httpStatus: status,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(10),
      }}
    )

    const distribution = new Distribution(this, 'HoldMyClipsDistribution', {
      additionalBehaviors: {
        'upload': uploadBehavior,
      },
      certificate: domainCert,
      defaultBehavior: defaultBehavior,
      defaultRootObject: 'index.html',
      domainNames: [domainName],
      enableLogging: true,
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

class UploadLambda extends Construct {
  public readonly handler: Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const uploadPolicy = new PolicyDocument({
      statements: [new PolicyStatement({
        actions: [
          's3:PutObject*',
          's3:PutObjectAcl*',
          's3:GetObject*',
          's3:GetObjectAcl*',
          's3:DeleteObject',
        ],
        resources: ['arn:aws:s3:::hold-my-clips/clips/*'],
      })]
    })
    
    const uploadRole = new Role(this, 'HoldMyClipsUploadRole', {
      roleName: 'hold-my-clips-lambda-upload-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        'HMC-lambda-s3-access': uploadPolicy
      }
    });

    this.handler = new Function(this, 'HoldMyClipsUploadFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../services/upload/')),
      role: uploadRole,
    });
  }
}
