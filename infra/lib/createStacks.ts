import { type App, type Environment, Fn, type Stack } from "aws-cdk-lib";
import { AuthStack } from "./AuthStack";
import { ClipdexStack } from "./ClipdexStack";
import { HostedDomainStack } from "./HostedDomainStack";
import { StaticSiteStack } from "./StaticSiteStack";
import { type ConfiguredStackProps, loadConfig } from "./config";

export default function createStacks(app: App, env: Environment): Stack[] {
  const config: ConfiguredStackProps = loadConfig(app, env);

  const hostedDomainStack = new HostedDomainStack(
    app,
    "HMCHostedDomain",
    config,
  );

  const authStack = new AuthStack(app, "HMCAuth", {
    ...config,
    hostedDomain: hostedDomainStack.hostedDomain,
  });

  const clipdexStack = new ClipdexStack(app, "HMCClipdex", {
    ...config,
    // authUserPool: authStack.userPool,
    // authUserPoolClient: authStack.cloudFrontAuth.client
  });

  const staticSiteStack = new StaticSiteStack(app, "HMCStaticSite", {
    ...config,
    apiGateway: clipdexStack.apiGateway,
    cloudFrontAuth: authStack.cloudFrontAuth,
    hostedDomain: hostedDomainStack.hostedDomain,
  });

  return [hostedDomainStack, clipdexStack, authStack, staticSiteStack];
}
