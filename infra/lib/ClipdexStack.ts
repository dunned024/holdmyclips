import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AccessLogFormat, AuthorizationType, AwsIntegration, CognitoUserPoolsAuthorizer, LambdaIntegration, LambdaRestApi, LogGroupLogDestination, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import { ConfiguredStackProps } from './config';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export interface ClipdexStackProps extends ConfiguredStackProps {
  // authUserPool: UserPool
  // authUserPoolClient: UserPoolClient
}

export class ClipdexStack extends Stack {
  public readonly apiGateway: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ClipdexStackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, "APILogs");
    this.apiGateway = new RestApi(this, "RestApi", {
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
      },
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
    });

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
            'application/json': `
              #set($inputRoot = $input.path('$'))
              {
                "clips": [
                    #foreach($elem in $inputRoot.Items) {
                        "id": "$elem.id.S",
                        "duration": "$elem.duration.N",
                        "description": "$util.escapeJavaScript($elem.description.S).replaceAll("\\\\'","'")",
                        "uploader": "$elem.uploader.S",
                        "title": "$util.escapeJavaScript($elem.title.S).replaceAll("\\\\'","'")"
                      }#if($foreach.hasNext),#end
                    #end
                  ]
              }
            `
          } 
        }],
      }
    })

    // Create 'clips' resource for uploading & querying clip metadata
    const clipsResource = this.apiGateway.root.addResource('clips');
    clipsResource.addMethod('GET', dynamoQueryIntegration, {
      methodResponses: [{ statusCode: '200' }],
    })

    clipdexTable.grantReadData(integrationRole);

    // Add Lambda integration for uploading clips
    const clipDataResource = this.apiGateway.root.addResource('clipdata');
    const uploadLambda = new UploadLambda(this, 'Lambda');
    const uploadIntegration = new LambdaIntegration(uploadLambda.handler)
    clipDataResource.addMethod('PUT', uploadIntegration)  // PUT /clipdata
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
      timeout: Duration.minutes(2),
    });
  }
}
