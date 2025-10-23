import { LambdaConfig } from "@henrist/cdk-lambda-config";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import {
  type AddBehaviorOptions,
  type BehaviorOptions,
  type IOrigin,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type { IVersion } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import type { AuthLambdas } from "./AuthLambdas";
import type { StoredConfig } from "./util/config";

import { Stack, Token } from "aws-cdk-lib";
import { ConfigureNatOptions } from "aws-cdk-lib/aws-ec2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export interface ConfiguredAuthLambdaParams {
  checkAuthFn: StringParameter;
  httpHeadersFn: StringParameter;
  parseAuthFn: StringParameter;
  refreshAuthFn: StringParameter;
  signOutFn: StringParameter;
}

export interface AuthLambdaFnVersions {
  checkAuthFn: lambda.IVersion;
  httpHeadersFn: lambda.IVersion;
  parseAuthFn: lambda.IVersion;
  refreshAuthFn: lambda.IVersion;
  signOutFn: lambda.IVersion;
}

export interface CloudFrontAuthProps {
  /**
   * Cognito Client that will be used to authenticate the user.
   *
   * If a custom client is provided, the updateClient method cannot
   * be used since we cannot know which parameters was set.
   *
   * @default - a new client will be generated
   */
  userPool: cognito.IUserPool;
  /**
   * The domain that is used for Cognito Auth.
   *
   * If not using custom domains this will be a name under amazoncognito.com.
   *
   * @example `${domain.domainName}.auth.${region}.amazoncognito.com`
   */
  client: cognito.IUserPoolClient;
  cognitoAuthDomain: string;
  authLambdas: AuthLambdas;
  /**
   * Fully-qualified domain name
   */
  fqdn: string;
  /**
   * Environment (prod or dev)
   */
  environment: string;
  /**
   * @default /auth/callback
   */
  callbackPath?: string;
  /**
   * @default /
   */
  signOutRedirectTo?: string;
  /**
   * @default /auth/sign-out
   */
  signOutPath?: string;
  /**
   * @default /auth/refresh
   */
  refreshAuthPath?: string;
  /**
   * Log level.
   *
   * A log level of debug will log secrets and should only be used in
   * a development environment.
   *
   * @default warn
   */
  logLevel?: "none" | "error" | "warn" | "info" | "debug";
  /**
   * Require the user to be part of a specific Cognito group to
   * access any resource.
   */
  requireGroupAnyOf?: string[];
}

/**
 * Configure previously deployed lambda functions, Cognito client
 * and CloudFront distribution.
 */
export class CloudFrontAuth extends Construct {
  public readonly callbackPath: string;
  public readonly signOutRedirectTo: string;
  public readonly signOutPath: string;
  public readonly refreshAuthPath: string;

  public readonly authLambdaParams: ConfiguredAuthLambdaParams;

  private readonly oauthScopes: string[];
  private readonly environment: string;

  constructor(scope: Construct, id: string, props: CloudFrontAuthProps) {
    super(scope, id);

    this.environment = props.environment;

    this.callbackPath = props.callbackPath ?? "/auth/callback";
    this.signOutRedirectTo = props.signOutRedirectTo ?? "/";
    this.signOutPath = props.signOutPath ?? "/auth/sign-out";
    this.refreshAuthPath = props.refreshAuthPath ?? "/auth/refresh";

    this.oauthScopes = [
      "phone",
      "email",
      "profile",
      "openid",
      "aws.cognito.signin.user.admin",
    ];

    const nonceSigningSecret = StringParameter.valueForStringParameter(
      this,
      "hmc-nonce",
    );

    const clientSecretValue = props.client.userPoolClientSecret
      .unsafeUnwrap()
      .toString();

    const config: StoredConfig = {
      httpHeaders: {
        "Content-Security-Policy":
          "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; connect-src 'self'",
        "Strict-Transport-Security":
          "max-age=31536000; includeSubdomains; preload",
        "Referrer-Policy": "same-origin",
        "X-XSS-Protection": "1; mode=block",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
      logLevel: props.logLevel ?? "warn",
      userPoolId: props.userPool.userPoolId,
      clientId: props.client.userPoolClientId,
      clientSecret: clientSecretValue,
      oauthScopes: this.oauthScopes,
      cognitoAuthDomain: props.cognitoAuthDomain,
      callbackPath: this.callbackPath,
      signOutRedirectTo: this.signOutRedirectTo,
      signOutPath: this.signOutPath,
      refreshAuthPath: this.refreshAuthPath,
      requireGroupAnyOf: props.requireGroupAnyOf,
      cookieSettings: {
        /*
        spaMode - consider if this should be supported
        idToken: "Path=/; Secure; SameSite=Lax",
        accessToken: "Path=/; Secure; SameSite=Lax",
        refreshToken: "Path=/; Secure; SameSite=Lax",
        nonce: "Path=/; Secure; HttpOnly; SameSite=Lax",
        */
        idToken: "Path=/; Secure; SameSite=Lax",
        accessToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
        refreshToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
        nonce: "Path=/; Secure; HttpOnly; SameSite=Lax",
      },
      nonceSigningSecret,
    };

    this.authLambdaParams = {
      checkAuthFn: this.createConfiguredLambdaSsmParameter(
        "CheckAuthFn",
        props.authLambdas.checkAuthFn,
        config,
      ),
      httpHeadersFn: this.createConfiguredLambdaSsmParameter(
        "HttpHeadersFn",
        props.authLambdas.httpHeadersFn,
        config,
      ),
      parseAuthFn: this.createConfiguredLambdaSsmParameter(
        "ParseAuthFn",
        props.authLambdas.parseAuthFn,
        config,
      ),
      refreshAuthFn: this.createConfiguredLambdaSsmParameter(
        "RefreshAuthFn",
        props.authLambdas.refreshAuthFn,
        config,
      ),
      signOutFn: this.createConfiguredLambdaSsmParameter(
        "SignOutFn",
        props.authLambdas.signOutFn,
        config,
      ),
    };
  }

  createConfiguredLambdaSsmParameter(
    name: string,
    fn: lambda.Function,
    config: StoredConfig,
  ) {
    const fnVersion = new LambdaConfig(this, name, {
      function: fn.currentVersion,
      config,
    }).version;

    return new StringParameter(this, `${name}SsmParam`, {
      parameterName: `/HMC/${this.environment}/lambdas/${name}Arn`,
      stringValue: fnVersion.edgeArn,
    });
  }

  /**
   * Create behaviors for authentication pages.
   *
   * - callback page
   * - refresh page
   * - sign out page
   */
  public createAuthPagesBehaviors(
    authLambdas: AuthLambdaFnVersions,
    origin: IOrigin,
  ): Record<string, BehaviorOptions> {
    function path(path: string, fn: IVersion): Record<string, BehaviorOptions> {
      return {
        [path]: {
          origin,
          compress: true,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          edgeLambdas: [
            {
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
              functionVersion: fn,
            },
          ],
        },
      };
    }

    return {
      ...path(this.callbackPath, authLambdas.parseAuthFn),
      ...path(this.refreshAuthPath, authLambdas.refreshAuthFn),
      ...path(this.signOutPath, authLambdas.signOutFn),
    };
  }

  /**
   * Create behavior that includes authorization check.
   */
  public createProtectedBehavior(
    authLambdas: AuthLambdaFnVersions,
    origin: IOrigin,
    options?: AddBehaviorOptions,
  ): BehaviorOptions {
    return {
      origin,
      compress: true,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      edgeLambdas: [
        {
          eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          functionVersion: authLambdas.checkAuthFn,
        },
        {
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
          functionVersion: authLambdas.httpHeadersFn,
        },
      ],
      ...options,
    };
  }
}
