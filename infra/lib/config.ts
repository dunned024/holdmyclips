import type { App, Environment, StackProps } from "aws-cdk-lib";

export type EnvironmentType = "prod" | "dev";

export interface ConfiguredStackProps extends StackProps {
  env: Environment;
  environment: EnvironmentType;
  domainName: string;
  fqdn: string; // Fully qualified domain name
  bucketName: string;
  certArn: string;
  hostedZoneId: string;
  authPaths: {
    callbackPath: string;
    signOutRedirectTo: string;
    signOutPath: string;
    refreshAuthPath: string;
  };
  // Optional migration settings for production user pool migration
  migration?: {
    enabled: boolean;
    oldUserPoolId: string;
    oldClientId: string;
  };
}

export function loadConfig(
  app: App,
  env: Environment,
  environment: EnvironmentType,
): ConfiguredStackProps {
  const appConfig = app.node.tryGetContext(`${environment}Config`);

  if (!appConfig) {
    throw new Error(
      `Configuration for environment "${environment}" not found in CDK context`,
    );
  }

  return {
    env,
    environment,
    domainName: appConfig.domainName,
    fqdn: appConfig.fqdn,
    bucketName: appConfig.bucketName,
    certArn: appConfig.certArn,
    hostedZoneId: appConfig.hostedZoneId,
    authPaths: appConfig.authPaths,
    migration: appConfig.migration,
  };
}
