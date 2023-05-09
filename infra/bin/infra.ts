#!/usr/bin/env node

import { App, Environment } from 'aws-cdk-lib';
import createStacks from "../lib/createStacks";


const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

createStacks(app, env)
