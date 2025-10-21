import { CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { AccessLogFormat, AwsIntegration, LambdaIntegration, LambdaRestApi, LogGroupLogDestination, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import { ConfiguredStackProps } from './config';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class ClipdexStack extends Stack {
  public readonly apiGateway: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ConfiguredStackProps) {
    super(scope, id, props);
    // Create DynamoDB table to act as metadata index
    const clipdexTable = new Table(this, 'ClipdexTable', {
      partitionKey: {name:'id', type: AttributeType.STRING},
    });

    // Create REST API Gateway for querying table & uploading things
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

    // Create IAM Role for reading from table
    const readTableRole = new Role(this, 'IntegrationRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })
    clipdexTable.grantReadData(readTableRole);
  
    // Create 'clips' resource for querying clip metadata
    const clipsResource = this.apiGateway.root.addResource('clips');
    clipsResource.addMethod('GET', getAllClipsIntegration(readTableRole, clipdexTable.tableName), {
      methodResponses: [{ statusCode: '200' }],
    })

    const clipResource = this.apiGateway.root.addResource('clip');
    const singleClipResource = clipResource.addResource('{id}');
    singleClipResource.addMethod('GET', getSingleClipIntegration(readTableRole, clipdexTable.tableName), {
      methodResponses: [{ statusCode: '200' }],
    })
  
    // Add Lambda integration for uploading clips
    const lambdaRole = getLambdaRole(this)
    const clipDataResource = this.apiGateway.root.addResource('clipdata');
    const uploadLambda = new Function(this, 'UploadFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../services/upload/')),
      role: lambdaRole,
      timeout: Duration.minutes(2),
    });
    const uploadIntegration = new LambdaIntegration(uploadLambda)
    clipDataResource.addMethod('PUT', uploadIntegration)  // PUT /clipdata
    clipdexTable.grantReadWriteData(uploadLambda);

    // Add Lambda integration for managing comments
    const clipCommentsResource = this.apiGateway.root.addResource('clipcomments');
    const commentsLambda = new Function(this, 'CommentsFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../services/comments/')),
      role: lambdaRole,
      timeout: Duration.minutes(2),
    });
    const commentsIntegration = new LambdaIntegration(commentsLambda)
    clipCommentsResource.addMethod('POST', commentsIntegration)  // POST /clipcomments
    clipCommentsResource.addMethod('DELETE', commentsIntegration)  // DELETE /clipcomments

    new CfnOutput(this, 'ClipdexTableName', { value: clipdexTable.tableName });
  }
}

function getLambdaRole(scope: Construct) {
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
  
  return new Role(scope, 'Role', {
    roleName: 'hold-my-clips-lambda-role',
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ],
    inlinePolicies: {
      'HMC-lambda-s3-access': uploadPolicy
    }
  });
} 


function getAllClipsIntegration(role: Role, tableName: string) {
  // GET Integration with DynamoDb for all clips
  return new AwsIntegration({
    service: 'dynamodb',
    action: 'Scan',
    options: {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      requestTemplates: {
        'application/json': JSON.stringify({
            'TableName': tableName,
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
}

function getSingleClipIntegration(role: Role, tableName: string) {
  // GET Integration with DynamoDb for single clip
  return new AwsIntegration({
    service: 'dynamodb',
    action: 'GetItem',
    options: {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      requestTemplates: {
        'application/json': `{
          "Key": {
            "id": {
              "S": "$method.request.path.id"
            }
          },
          "TableName": "${tableName}"
        }`,
      },
      integrationResponses: [{ 
        statusCode: '200', 
        responseTemplates: {
          'application/json': `
            {
              "id": "$input.path('$.Item.id.S')",
              "duration": "$input.path('$.Item.duration.N')",
              "description": "$util.escapeJavaScript($input.path('$.Item.description.S')).replaceAll("\\\\'","'")",
              "uploader": "$input.path('$.Item.uploader.S')",
              "title": "$util.escapeJavaScript($input.path('$.Item.title.S')).replaceAll("\\\\'","'")"
            }
          `
        } 
      }],
    }
  })
}
