import { App, Environment, Fn, Stack } from 'aws-cdk-lib';
import { StorageStack } from './StorageStack';

export default function createStacks(app: App, env: Environment): Stack[] {
  const storageStack = new StorageStack(app, 'HMCStorage', {env});

  return [storageStack];
}
