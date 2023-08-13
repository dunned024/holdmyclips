import { App, Environment, Fn, Stack } from 'aws-cdk-lib';
import { StaticSiteStack } from './StaticSiteStack';
import { ClipdexStack } from './ClipdexStack';
import { HostedDomainStack } from './HostedDomainStack';
import { AuthStack } from './AuthStack';
import { ConfiguredStackProps, loadConfig } from './config';

export default function createStacks(app: App, env: Environment): Stack[] {
  const config: ConfiguredStackProps = loadConfig(app, env);

  const hostedDomainStack = new HostedDomainStack(app, 'HMCHostedDomain', config);

  const authStack = new AuthStack(app, 'HMCAuth', {
    ...config,
    hostedDomain: hostedDomainStack.hostedDomain
  });

  const clipdexStack = new ClipdexStack(app, 'HMCClipdex', {
    ...config,
    // authUserPool: authStack.userPool,
    // authUserPoolClient: authStack.cloudFrontAuth.client
  });

  const staticSiteStack = new StaticSiteStack(app, 'HMCStaticSite', {
    ...config,
    apiGateway: clipdexStack.apiGateway,
    cloudFrontAuth: authStack.cloudFrontAuth,
    hostedDomain: hostedDomainStack.hostedDomain
  });


  return [hostedDomainStack, clipdexStack, authStack, staticSiteStack];
}
