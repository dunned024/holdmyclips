import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class UserLambda extends Construct {
  public readonly handler: Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const cognitoRole = new Role(this, 'Role', {
      roleName: 'hold-my-clips-lambda-cognito-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoReadOnly'),
      ],
    });

    // const helloFunction = new NodejsFunction(this, 'function');
    // new LambdaRestApi(this, 'apigw', {
    //   handler: helloFunction,
    // });

    this.handler = new Function(this, 'Function', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../services/cognito/')),
      role: cognitoRole,
    });
}}