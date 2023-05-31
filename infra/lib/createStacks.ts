import { App, Environment, Fn, Stack } from 'aws-cdk-lib';
import { StaticSiteStack } from './StaticSiteStack';
import { ClipdexStack } from './ClipdexStack';

export default function createStacks(app: App, env: Environment): Stack[] {
  const clipdexStack = new ClipdexStack(app, 'HMCClipdex', {env});
  const staticSiteStack = new StaticSiteStack(app, 'HMCStaticSite', {env, apiGateway: clipdexStack.apiGateway});

  return [staticSiteStack, clipdexStack];
}
