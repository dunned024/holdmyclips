#!/usr/bin/env node

import { App, type Environment } from "aws-cdk-lib";
import type { EnvironmentType } from "../lib/config";
import createStacks from "../lib/createStacks";

const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

// Get environment from context (defaults to 'prod' if not specified)
// Usage: cdk deploy --context environment=dev
const environment: EnvironmentType =
  (app.node.tryGetContext("environment") as EnvironmentType) || "prod";

if (environment !== "prod" && environment !== "dev") {
  throw new Error(
    `Invalid environment "${environment}". Must be "prod" or "dev".`,
  );
}

console.log(`Deploying stacks for environment: ${environment}`);

createStacks(app, env, environment);
