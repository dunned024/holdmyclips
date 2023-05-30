import { App, Environment, Fn, Stack } from 'aws-cdk-lib';
import { StorageStack } from './StorageStack';
import { UploadStack } from './UploadStack';

export default function createStacks(app: App, env: Environment): Stack[] {
  const uploadStack = new UploadStack(app, 'HMCUpload', {env});
  const storageStack = new StorageStack(app, 'HMCStorage', {env, apiGateway: uploadStack.apiGateway});

  return [storageStack, uploadStack];
}
