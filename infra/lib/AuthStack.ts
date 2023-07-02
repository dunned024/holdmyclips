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
import { CloudFrontTarget, UserPoolDomainTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { OAuthScope, UserPool, UserPoolClientIdentityProvider, VerificationEmailStyle } from 'aws-cdk-lib/aws-cognito';
import { HostedDomain } from './HostedDomainStack';
import { ConfiguredStackProps } from './config';
import { AuthLambdas, CloudFrontAuth } from '@henrist/cdk-cloudfront-auth';


export interface AuthStackProps extends ConfiguredStackProps {
  hostedDomain: HostedDomain
}

export class AuthStack extends Stack {
  public readonly cloudFrontAuth: CloudFrontAuth;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'UserPool', {
      autoVerify: { email: true },
      userPoolName: 'hold-my-clips-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
        preferredUsername: true,
      },
      signInCaseSensitive: false,
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        preferredUsername: {
          required: false,
          mutable: true,
        },
      },
      userInvitation: {
        emailSubject: 'Please come hold clips',
        emailBody: '{username}, your time has come. You must sign in to Hold My Clips and hold some clips. Your temporary password is {####}',
      },
      userVerification: {
        emailSubject: 'Verify your email to hold clips',
        emailBody: 'Thanks for signing up to hold some clips. Your verification code is {####}',
        emailStyle: VerificationEmailStyle.CODE,
      },
    });

    // const client = userPool.addClient('Client', {
    //   preventUserExistenceErrors: true,
    //   oAuth: {
    //     flows: {
    //       authorizationCodeGrant: true,
    //     },
    //     scopes: [ OAuthScope.OPENID ],
    //     callbackUrls: [ `https://${props.fqdn}/welcome` ],
    //     logoutUrls: [ `https://${props.fqdn}/signin` ],
    //   },
    // });

    const authDomainName = `auth.${props.fqdn}`
    const domain = userPool.addDomain('Domain', {
      customDomain: {
        domainName: authDomainName,
        certificate: props.hostedDomain.cert,
      },
    });
    
    // "You must create an A record for the parent domain in your DNS
    // configuration" before creating an A Record for a custom domain. I
    // had already created an A Record for the FQDN when standing up the
    // CloudFront distribution, but if I reversed the order of deployment,
    // I would need to create a 'dummy' A Record (that could later be
    // deleted).
    // See: https://repost.aws/knowledge-center/cognito-custom-domain-errors
    new ARecord(this, 'DnsRecord', {
      recordName: authDomainName,
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(domain)),
      zone: props.hostedDomain.hostedZone
    });

    // From https://github.com/henrist/cdk-cloudfront-auth
    const authLambdas = new AuthLambdas(this, 'AuthLambdas', {
      regions: ["us-east-1"],
    })

    this.cloudFrontAuth = new CloudFrontAuth(this, 'Auth', {
      cognitoAuthDomain: authDomainName,
      authLambdas,
      userPool,
    })
  }
}