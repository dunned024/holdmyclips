import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { AwsIntegration, LambdaIntegration, LambdaRestApi, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import { ConfiguredStackProps } from './config';

export class ClipdexStack extends Stack {
  public readonly apiGateway: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ConfiguredStackProps) {
    super(scope, id, props);
    this.apiGateway = new RestApi(this, "RestApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
      }
    });
    const clipsResource = this.apiGateway.root.addResource('clips');

    const integrationRole = new Role(this, 'IntegrationRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })

    // Create DynamoDB table to act as metadata index
    const clipdexTable = new Table(this, 'ClipdexTable', {
      partitionKey: {name:'id', type: AttributeType.STRING},
    });

    // GET Integration with DynamoDb
    const dynamoQueryIntegration = new AwsIntegration({
      service: 'dynamodb',
      action: 'Scan',
      options: {
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        credentialsRole: integrationRole,
        requestTemplates: {
          'application/json': JSON.stringify({
              'TableName': clipdexTable.tableName,
          }),
        },
        integrationResponses: [{ 
          statusCode: '200', 
          responseTemplates: {
            'application/json': JSON.stringify(`
              #set($inputRoot = $input.path('$'))
              {
                  "clips": [
                      #foreach($elem in $inputRoot.Items) {
                          "id": "$elem.id.S",
                          "duration": "$elem.duration.N",
                          "description": "$elem.description.N",
                          "uploader": "$elem.uploader.N",
                          "title": "$elem.title.S"
                      }#if($foreach.hasNext),#end
                #end
                  ]
              }
            `)
          } 
        }],
      }
    })

    clipsResource.addMethod('GET', dynamoQueryIntegration, {
      methodResponses: [{ statusCode: '200' }],
    })

    clipdexTable.grantReadData(integrationRole);

    // Add Lambda integration for uploading clips
    const uploadLambda = new UploadLambda(this, 'Lambda');
    const uploadIntegration = new LambdaIntegration(uploadLambda.handler)
    clipsResource.addMethod('PUT', uploadIntegration);  // PUT /clips
    clipdexTable.grantReadWriteData(uploadLambda.handler);

    new CfnOutput(this, 'ClipdexTableName', { value: clipdexTable.tableName });
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
      resources: ['arn:aws:cloudformation:us-east-1:*:stack/HMC*'],
    })

    const cloudfrontPolicyStatement = new PolicyStatement({
      actions: [
        'cloudfront:CreateInvalidation',
      ],
      resources: ['*'],
    })

    const uploadPolicy = new PolicyDocument({
      statements: [s3PolicyStatement, cloudformationPolicyStatement, cloudfrontPolicyStatement]
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
