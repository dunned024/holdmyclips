import path from "path";
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  BehaviorOptions,
  CacheHeaderBehavior,
  CachePolicy,
  CachedMethods,
  Distribution,
  ErrorResponse,
  IDistribution,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { experimental } from "aws-cdk-lib/aws-cloudfront";
import { RestApiOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  OAuthScope,
  UserPool,
  type UserPoolClient,
  UserPoolClientIdentityProvider,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  ARecord,
  PublicHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import {
  CloudFrontTarget,
  UserPoolDomainTarget,
} from "aws-cdk-lib/aws-route53-targets";
import {
  BlockPublicAccess,
  Bucket,
  CfnBucket,
  CorsRule,
  HttpMethods,
} from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import type { HostedDomain } from "./HostedDomainStack";
import { AuthLambdas } from "./auth/AuthLambdas";
import type { CloudFrontAuth } from "./auth/CloudfrontAuth";
import type { ConfiguredStackProps } from "./config";

export interface AuthStackProps extends ConfiguredStackProps {
  hostedDomain: HostedDomain;
}

export class AuthStack extends Stack {
  public readonly cloudFrontAuth: CloudFrontAuth;
  public readonly userPool: UserPool;
  public readonly userPoolClientV2: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, "UserPool", {
      autoVerify: { email: true },
      userPoolName: `hold-my-clips-user-pool-${props.environment}`,
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
        emailSubject: "Please come hold clips",
        emailBody:
          "{username}, your time has come. You must sign in to Hold My Clips and hold some clips. Your temporary password is {####}",
      },
      userVerification: {
        emailSubject: "Verify your email to hold clips",
        emailBody:
          "Thanks for signing up to hold some clips. Your verification code is {####}",
        emailStyle: VerificationEmailStyle.CODE,
      },
    });

    // const userPoolClient = this.userPool.addClient("UserPoolClient", {
    //   authFlows: {
    //     userPassword: true,
    //     userSrp: true,
    //   },
    //   oAuth: {
    //     flows: {
    //       authorizationCodeGrant: true,
    //     },
    //     callbackUrls: [`https://${props.fqdn}${props.authPaths.callbackPath}`],
    //     logoutUrls: [
    //       `https://${props.fqdn}${props.authPaths.signOutRedirectTo}`,
    //     ],
    //   },
    //   preventUserExistenceErrors: true,
    //   generateSecret: true,
    // });

    this.userPoolClientV2 = this.userPool.addClient("UserPoolClientV2", {
      authFlows: {
        userPassword: false, // Disable direct password auth for SPA
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: [`https://${props.fqdn}/`, "http://localhost:3000/"],
        logoutUrls: [`https://${props.fqdn}/`, "http://localhost:3000/"],
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
      },
      preventUserExistenceErrors: true,
      generateSecret: false,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
    });

    new CfnOutput(this, "UserPoolClientV2Id", {
      value: this.userPoolClientV2.userPoolClientId,
    });

    const authDomainName = `oauth.${props.fqdn}`;

    // "You must create an A record for the parent domain in your DNS
    // configuration" before creating an A Record for a custom domain.
    // For dev (or first-time deployments), create a dummy A record that
    // will later be replaced by the StaticSiteStack's CloudFront distribution.
    // See: https://repost.aws/knowledge-center/cognito-custom-domain-errors
    // let dummyARecord: ARecord | undefined;
    // dummyARecord = new ARecord(this, "DummyParentARecord", {
    //   recordName: props.fqdn,
    //   // Use a dummy IP address (this will be replaced by StaticSiteStack)
    //   target: RecordTarget.fromIpAddresses("192.0.2.1"), // RFC 5737 TEST-NET-1 address
    //   zone: props.hostedDomain.hostedZone,
    //   comment: `Temporary A record for ${props.environment} - will be replaced by StaticSiteStack`,
    //   ttl: Duration.seconds(60),
    // });

    const domain = this.userPool.addDomain("Domain", {
      customDomain: {
        domainName: authDomainName,
        certificate: props.hostedDomain.cert,
      },
    });

    // This A record depends on the parent domain A record existing
    const authARecord = new ARecord(this, "AuthDnsRecord", {
      recordName: authDomainName,
      target: RecordTarget.fromAlias(new UserPoolDomainTarget(domain)),
      zone: props.hostedDomain.hostedZone,
    });

    // If we created a dummy record, ensure the auth record depends on it
    // if (dummyARecord) {
    //   authARecord.node.addDependency(dummyARecord);
    // }

    //   this.cloudFrontAuth = new CloudFrontAuth(this, "Auth", {
    //     cognitoAuthDomain: authDomainName,
    //     authLambdas: new AuthLambdas(this, "AuthLambdas"),
    //     fqdn: props.fqdn,
    //     environment: props.environment,
    //     logLevel: "info",
    //     userPool: this.userPool,
    //     client: userPoolClient,
    //     ...props.authPaths,
    //   });
    // }
  }
}
