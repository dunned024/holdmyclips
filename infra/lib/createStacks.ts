import { type App, type Environment, Fn, type Stack } from "aws-cdk-lib";
import { AuthStack } from "./AuthStack";
import { ClipdexStack } from "./ClipdexStack";
import { HostedDomainStack } from "./HostedDomainStack";
import { StaticSiteStack } from "./StaticSiteStack";
import { UserMigrationStack } from "./UserMigrationStack";
import {
  type ConfiguredStackProps,
  type EnvironmentType,
  loadConfig,
} from "./config";
import { toCamelCase } from "./utils";

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
  const envSuffix = toCamelCase(environment);

  const authStack = new AuthStack(app, `HMCAuth${envSuffix}`, {
    ...config,
    hostedDomain: hostedDomainStack.hostedDomain,
  });

  const clipdexStack = new ClipdexStack(app, `HMCClipdex${envSuffix}`, {
    ...config,
    cognitoUserPoolId: authStack.userPool.userPoolId,
    cognitoUserPoolClientId: authStack.userPoolClientV2.userPoolClientId,
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

  const stacks: Stack[] = [
    hostedDomainStack,
    clipdexStack,
    authStack,
    staticSiteStack,
  ];

  // Conditionally add migration stack for production if enabled
  if (config.migration?.enabled) {
    const migrationStack = new UserMigrationStack(
      app,
      `HMCUserMigration${envSuffix}`,
      {
        ...config,
        newUserPool: authStack.userPool,
        oldUserPoolId: config.migration.oldUserPoolId,
        oldClientId: config.migration.oldClientId,
      },
    );

    // Ensure migration stack is created after auth stack
    // migrationStack.addDependency(authStack);

    stacks.push(migrationStack);

    console.log(`[${environment}] User migration stack enabled`);
    console.log(`  Old User Pool: ${config.migration.oldUserPoolId}`);
  }

  return stacks;
}
