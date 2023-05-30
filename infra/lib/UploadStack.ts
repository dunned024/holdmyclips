import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';

export class UploadStack extends Stack {
  public readonly apiGateway: LambdaRestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);    
    const uploadLambda = new UploadLambda(this, 'Lambda');
    this.apiGateway = new LambdaRestApi(this, "RestApi", {
      handler: uploadLambda.handler,
      proxy: false,
    });

    const upload = this.apiGateway.root.addResource('upload');
    upload.addMethod('PUT');  // PUT /upload

    const clipIndex = new Table(this, 'ClipIndex', {
      partitionKey: {name:'id', type: AttributeType.STRING},
    });

    clipIndex.grantReadWriteData(uploadLambda.handler);

    new CfnOutput(this, 'DynamoDbTableName', { value: clipIndex.tableName });
  }
}

class UploadLambda extends Construct {
  public readonly handler: Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const s3PolicyStatement = new PolicyStatement({
      actions: [
        's3:PutObject*',
        's3:PutObjectAcl*',
        's3:GetObject*',
        's3:GetObjectAcl*',
        's3:DeleteObject',
      ],
      resources: ['arn:aws:s3:::hold-my-clips/clips/*'],
    })

    const cloudformationPolicyStatement = new PolicyStatement({
      actions: [
        'cloudformation:DescribeStacks',
      ],
      resources: ['arn:aws:cloudformation:us-east-1:*:stack/HMCUpload*'],
    })

    const uploadPolicy = new PolicyDocument({
      statements: [s3PolicyStatement, cloudformationPolicyStatement]
    })
    
    const uploadRole = new Role(this, 'Role', {
      roleName: 'hold-my-clips-lambda-upload-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        'HMC-lambda-s3-access': uploadPolicy
      }
    });

    this.handler = new Function(this, 'Function', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../services/upload/')),
      role: uploadRole,
    });
  }
}
