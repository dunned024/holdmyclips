import { type App, type Environment, Fn, type Stack } from "aws-cdk-lib";
import { AuthStack } from "./AuthStack";
import { ClipdexStack } from "./ClipdexStack";
import { HostedDomainStack } from "./HostedDomainStack";
import { StaticSiteStack } from "./StaticSiteStack";
import {
  type ConfiguredStackProps,
  type EnvironmentType,
  loadConfig,
} from "./config";

export default function createStacks(
  app: App,
  env: Environment,
  environment: EnvironmentType,
): Stack[] {
  const config: ConfiguredStackProps = loadConfig(app, env, environment);

  // Shared hosted domain stack (used by both prod and dev)
  const hostedDomainStack = new HostedDomainStack(
    app,
    "HMCHostedDomain",
    config,
  );

  // Environment-specific stack names
  const envSuffix = environment.charAt(0).toUpperCase() + environment.slice(1);

  const authStack = new AuthStack(app, `HMCAuth${envSuffix}`, {
    ...config,
    hostedDomain: hostedDomainStack.hostedDomain,
  });

  const clipdexStack = new ClipdexStack(app, `HMCClipdex${envSuffix}`, {
    ...config,
  });

  const staticSiteStack = new StaticSiteStack(
    app,
    `HMCStaticSite${envSuffix}`,
    {
      ...config,
      apiGateway: clipdexStack.apiGateway,
      cloudFrontAuth: authStack.cloudFrontAuth,
      hostedDomain: hostedDomainStack.hostedDomain,
    },
  );

  return [hostedDomainStack, clipdexStack, authStack, staticSiteStack];
}
