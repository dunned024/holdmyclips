import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { CachePolicy, Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Construct } from 'constructs';

export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'HoldMyClipsS3Bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName: 'hold-my-clips',
    });
    
    const originAccessIdentity = new OriginAccessIdentity(this, 'HoldMyClipsOAI');

    const cachePolicy = new CachePolicy(this, 'HoldMyClipsDistributionCachePolicy', {
      defaultTtl: Duration.days(7),
      maxTtl: Duration.days(30),
      minTtl: Duration.days(1),
    })
    
    new Distribution(this, 'HoldMyClipsDistribution', {
      defaultBehavior: {
        origin: new S3Origin(bucket, {originAccessIdentity}),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy
      },
    });
  }
}
