import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import {
  AddBehaviorOptions,
  BehaviorOptions,
  IOrigin,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront"
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { IVersion } from "aws-cdk-lib/aws-lambda"
import { LambdaConfig } from "@henrist/cdk-lambda-config"
import { StoredConfig } from "../auth/util/config"
import { AuthLambdas } from "../auth/AuthLambdas"
import { Construct } from "constructs"

import { StringParameter } from 'aws-cdk-lib/aws-ssm';


export interface CloudFrontAuthProps {
  /**
   * Cognito Client that will be used to authenticate the user.
   *
   * If a custom client is provided, the updateClient method cannot
   * be used since we cannot know which parameters was set.
   *
   * @default - a new client will be generated
   */
  userPool: cognito.IUserPool
  /**
   * The domain that is used for Cognito Auth.
   *
   * If not using custom domains this will be a name under amazoncognito.com.
   *
   * @example `${domain.domainName}.auth.${region}.amazoncognito.com`
   */
  cognitoAuthDomain: string
  authLambdas: AuthLambdas
  /**
   * Fully-qualified domain name
   */
  fqdn: string
  /**
   * @default /auth/callback
   */
  callbackPath?: string
  /**
   * @default /
   */
  signOutRedirectTo?: string
  /**
   * @default /auth/sign-out
   */
  signOutPath?: string
  /**
   * @default /auth/refresh
   */
  refreshAuthPath?: string
  /**
   * Log level.
   *
   * A log level of debug will log secrets and should only be used in
   * a development environment.
   *
   * @default warn
   */
  logLevel?: "none" | "error" | "warn" | "info" | "debug"
  /**
   * Require the user to be part of a specific Cognito group to
   * access any resource.
   */
  requireGroupAnyOf?: string[]
}

/**
 * Configure previously deployed lambda functions, Cognito client
 * and CloudFront distribution.
 */
export class CloudFrontAuth extends Construct {
  public readonly callbackPath: string
  public readonly signOutRedirectTo: string
  public readonly signOutPath: string
  public readonly refreshAuthPath: string

  private readonly userPool: cognito.IUserPool
  public readonly client: cognito.UserPoolClient

  private readonly checkAuthFn: lambda.IVersion
  private readonly httpHeadersFn: lambda.IVersion
  private readonly parseAuthFn: lambda.IVersion
  private readonly refreshAuthFn: lambda.IVersion
  private readonly signOutFn: lambda.IVersion

  private readonly oauthScopes: string[]

  constructor(scope: Construct, id: string, props: CloudFrontAuthProps) {
    super(scope, id)

    this.callbackPath = props.callbackPath ?? "/auth/callback"
    this.signOutRedirectTo = props.signOutRedirectTo ?? "/"
    this.signOutPath = props.signOutPath ?? "/auth/sign-out"
    this.refreshAuthPath = props.refreshAuthPath ?? "/auth/refresh"

    this.oauthScopes = [
      "phone",
      "email",
      "profile",
      "openid",
      "aws.cognito.signin.user.admin",
    ]

    this.userPool = props.userPool

    this.client =
      props.userPool.addClient("UserPoolClient", {
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          callbackUrls: [`https://${props.fqdn}${this.callbackPath}`],
          logoutUrls: [`https://${props.fqdn}${this.signOutRedirectTo}`]
        },
        preventUserExistenceErrors: true,
        generateSecret: true,
      })

    const nonceSigningSecret = StringParameter.valueForStringParameter(this, 'hmc-nonce')
  
    const clientSecretValue = this.client.userPoolClientSecret.unsafeUnwrap().toString()

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
      userPoolId: this.userPool.userPoolId,
      clientId: this.client.userPoolClientId,
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
        idToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
        accessToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
        refreshToken: "Path=/; Secure; HttpOnly; SameSite=Lax",
        nonce: "Path=/; Secure; HttpOnly; SameSite=Lax",
      },
      nonceSigningSecret,
    }

    this.checkAuthFn = new LambdaConfig(this, "CheckAuthFn", {
      function: props.authLambdas.checkAuthFn,
      config,
    }).version

    this.httpHeadersFn = new LambdaConfig(this, "HttpHeadersFn", {
      function: props.authLambdas.httpHeadersFn,
      config,
    }).version

    this.parseAuthFn = new LambdaConfig(this, "ParseAuthFn", {
      function: props.authLambdas.parseAuthFn,
      config,
    }).version

    this.refreshAuthFn = new LambdaConfig(this, "RefreshAuthFn", {
      function: props.authLambdas.refreshAuthFn,
      config,
    }).version

    this.signOutFn = new LambdaConfig(this, "SignOutFn", {
      function: props.authLambdas.signOutFn,
      config,
    }).version
  }

  /**
   * Create behaviors for authentication pages.
   *
   * - callback page
   * - refresh page
   * - sign out page
   *
   * This is to be used with Distribution.
   */
  public createAuthPagesBehaviors(
    origin: IOrigin,
    options?: AddBehaviorOptions,
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
          ...options,
        },
      }
    }

    return {
      ...path(this.callbackPath, this.parseAuthFn),
      ...path(this.refreshAuthPath, this.refreshAuthFn),
      ...path(this.signOutPath, this.signOutFn),
    }
  }

  /**
   * Create behavior that includes authorization check.
   *
   * This is to be used with Distribution.
   */
  public createProtectedBehavior(
    origin: IOrigin,
    options?: AddBehaviorOptions,
  ): BehaviorOptions {
    if (options?.edgeLambdas != null) {
      throw Error("User-defined edgeLambdas is currently not supported")
    }

    return {
      origin,
      compress: true,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      edgeLambdas: [
        {
          eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          functionVersion: this.checkAuthFn,
        },
        {
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
          functionVersion: this.httpHeadersFn,
        },
      ],
      ...options,
    }
  }
}
