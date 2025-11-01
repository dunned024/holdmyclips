import path from "path";
import { CfnOutput, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  AccessLogFormat,
  AwsIntegration,
  LambdaIntegration,
  type LambdaRestApi,
  LogGroupLogDestination,
  MethodLoggingLevel,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, ProjectionType, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
// biome-ignore lint/suspicious/noShadowRestrictedNames: this ain't the same thing
import { Code, Function, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import type { ConfiguredStackProps } from "./config";
import { toCamelCase } from "./utils";

export interface ClipdexStackProps extends ConfiguredStackProps {
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
}

export class ClipdexStack extends Stack {
  public readonly apiGateway: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ClipdexStackProps) {
    super(scope, id, props);

    // Create DynamoDB table to act as metadata index
    const clipdexTable = new Table(this, "ClipdexTable", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      // Prevent accidental deletion in production
      removalPolicy:
        props.environment === "prod"
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      deletionProtection: props.environment === "prod",
    });

    // Add GSI for querying all clips sorted by upload date
    clipdexTable.addGlobalSecondaryIndex({
      indexName: "AllClipsByUploadDate",
      partitionKey: { name: "itemType", type: AttributeType.STRING },
      sortKey: { name: "uploadedOn", type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    // Add GSI for querying all clips sorted by title
    clipdexTable.addGlobalSecondaryIndex({
      indexName: "AllClipsByTitle",
      partitionKey: { name: "itemType", type: AttributeType.STRING },
      sortKey: { name: "title", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Add GSI for querying all clips sorted by views
    clipdexTable.addGlobalSecondaryIndex({
      indexName: "AllClipsByViews",
      partitionKey: { name: "itemType", type: AttributeType.STRING },
      sortKey: { name: "views", type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    // Create table to track user likes (for preventing duplicate likes)
    const userLikesTable = new Table(this, "UserLikesTable", {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "clipId", type: AttributeType.STRING },
      removalPolicy:
        props.environment === "prod"
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      deletionProtection: props.environment === "prod",
    });

    // Create REST API Gateway for querying table & uploading things
    const logGroup = new LogGroup(
      this,
      `HMCClipdexAPILogs${toCamelCase(props.environment)}`,
      {
        logGroupName: `/aws/apigateway/HMCClipdexAPI-${props.environment}-access-logs`,
      },
    );

    this.apiGateway = new RestApi(
      this,
      `HMCClipdexAPI${toCamelCase(props.environment)}`,
      {
        cloudWatchRole: true,
        defaultCorsPreflightOptions: {
          allowOrigins: ["*"],
          allowMethods: ["*"],
          allowHeaders: ["*"],
          allowCredentials: false,
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
          loggingLevel: MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
        },
      },
    );

    // Create IAM Role for reading from table
    const readTableRole = new Role(this, "IntegrationRole", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
    clipdexTable.grantReadData(readTableRole);

    // Create 'clips' resource for querying clip metadata
    const clipsResource = this.apiGateway.root.addResource("clips");

    clipsResource.addMethod(
      "GET",
      getAllClipsIntegration(readTableRole, clipdexTable.tableName),
      {
        requestParameters: {
          "method.request.querystring.sortIndex": false,
          "method.request.querystring.order": false,
          "method.request.querystring.limit": false,
          "method.request.querystring.nextToken": false,
        },
        methodResponses: [{ statusCode: "200" }],
      },
    );

    const clipResource = this.apiGateway.root.addResource("clip");
    const singleClipResource = clipResource.addResource("{id}");
    singleClipResource.addMethod(
      "GET",
      getSingleClipIntegration(readTableRole, clipdexTable.tableName),
      {
        methodResponses: [{ statusCode: "200" }],
      },
    );

    // Define Lambda layer for shared utilities
    const sharedLayer = new LayerVersion(this, "SharedLayer", {
      code: Code.fromAsset(path.join(__dirname, "../services/shared/")),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
    });

    // Add Lambda integration for uploading clips
    const lambdaRole = getLambdaRole(this, props.environment, props.bucketName);
    const uploadLambda = new Function(
      this,
      `UploadFunction${toCamelCase(props.environment)}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: Code.fromAsset(path.join(__dirname, "../services/upload/")),
        role: lambdaRole,
        timeout: Duration.minutes(2),
        layers: [sharedLayer],
        environment: {
          USER_POOL_ID: props.cognitoUserPoolId,
          COGNITO_REGION: "us-east-1",
          CLIENT_ID: props.cognitoUserPoolClientId,
          BUCKET_NAME: props.bucketName,
          ENVIRONMENT: toCamelCase(props.environment),
        },
      },
    );
    const uploadIntegration = new LambdaIntegration(uploadLambda);

    // Create /clipdata resource for metadata uploads
    const clipDataResource = this.apiGateway.root.addResource("clipdata");
    clipDataResource.addMethod("PUT", uploadIntegration); // PUT /clipdata

    clipdexTable.grantReadWriteData(uploadLambda);

    // Add Lambda integration for managing comments
    const commentsLambda = new Function(
      this,
      `CommentsFunction${toCamelCase(props.environment)}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: Code.fromAsset(path.join(__dirname, "../services/comments/")),
        role: lambdaRole,
        timeout: Duration.minutes(2),
        layers: [sharedLayer],
        environment: {
          USER_POOL_ID: props.cognitoUserPoolId,
          COGNITO_REGION: "us-east-1",
          CLIENT_ID: props.cognitoUserPoolClientId,
          BUCKET_NAME: props.bucketName,
          ENVIRONMENT: toCamelCase(props.environment),
        },
      },
    );
    const commentsIntegration = new LambdaIntegration(commentsLambda);

    // Create /clip/{id}/comment endpoint
    const commentResource = singleClipResource.addResource("comment");
    commentResource.addMethod("POST", commentsIntegration); // POST /clip/{id}/comment
    commentResource.addMethod("DELETE", commentsIntegration); // DELETE /clip/{id}/comment

    // Add Lambda integration for generating presigned URLs
    const presignLambda = new Function(
      this,
      `PresignFunction${toCamelCase(props.environment)}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: Code.fromAsset(path.join(__dirname, "../services/presign/")),
        role: lambdaRole,
        timeout: Duration.seconds(30),
        layers: [sharedLayer],
        environment: {
          USER_POOL_ID: props.cognitoUserPoolId,
          COGNITO_REGION: "us-east-1",
          CLIENT_ID: props.cognitoUserPoolClientId,
          BUCKET_NAME: props.bucketName,
          ENVIRONMENT: toCamelCase(props.environment),
        },
      },
    );
    const presignIntegration = new LambdaIntegration(presignLambda);

    // Create /presign resource for getting presigned URLs
    const presignResource = this.apiGateway.root.addResource("presign");
    presignResource.addMethod("POST", presignIntegration); // POST /presign

    // Add Lambda integration for tracking views
    const viewsLambda = new Function(
      this,
      `ViewsFunction${toCamelCase(props.environment)}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: Code.fromAsset(path.join(__dirname, "../services/views/")),
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: clipdexTable.tableName,
        },
      },
    );
    clipdexTable.grantReadWriteData(viewsLambda);
    const viewsIntegration = new LambdaIntegration(viewsLambda);

    // Create /clip/{id}/view endpoint
    const viewResource = singleClipResource.addResource("view");
    viewResource.addMethod("POST", viewsIntegration); // POST /clip/{id}/view

    // Add Lambda integration for managing likes
    const likesLambda = new Function(
      this,
      `LikesFunction${toCamelCase(props.environment)}`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: Code.fromAsset(path.join(__dirname, "../services/likes/")),
        timeout: Duration.seconds(10),
        layers: [sharedLayer],
        environment: {
          USER_POOL_ID: props.cognitoUserPoolId,
          COGNITO_REGION: "us-east-1",
          CLIENT_ID: props.cognitoUserPoolClientId,
          CLIPS_TABLE_NAME: clipdexTable.tableName,
          USER_LIKES_TABLE_NAME: userLikesTable.tableName,
        },
      },
    );
    clipdexTable.grantReadWriteData(likesLambda);
    userLikesTable.grantReadWriteData(likesLambda);
    const likesIntegration = new LambdaIntegration(likesLambda);

    // Create /clip/{id}/like endpoint
    const likeResource = singleClipResource.addResource("like");
    likeResource.addMethod("POST", likesIntegration); // POST /clip/{id}/like
    likeResource.addMethod("DELETE", likesIntegration); // DELETE /clip/{id}/like

    new CfnOutput(this, "ClipdexTableName", { value: clipdexTable.tableName });
    new CfnOutput(this, "ApiGatewayUrl", {
      value: this.apiGateway.url,
      description: "API Gateway endpoint URL",
    });
  }
}

function getLambdaRole(
  scope: Construct,
  environment: string,
  bucketName: string,
) {
  const s3PolicyStatement = new PolicyStatement({
    actions: [
      "s3:PutObject*",
      "s3:PutObjectAcl*",
      "s3:GetObject*",
      "s3:GetObjectAcl*",
      "s3:DeleteObject",
    ],
    resources: [`arn:aws:s3:::${bucketName}/clips/*`],
  });

  const cloudformationPolicyStatement = new PolicyStatement({
    actions: ["cloudformation:DescribeStacks"],
    resources: ["arn:aws:cloudformation:us-east-1:*:stack/HMC*"],
  });

  const cloudfrontPolicyStatement = new PolicyStatement({
    actions: ["cloudfront:CreateInvalidation"],
    resources: ["*"],
  });

  const uploadPolicy = new PolicyDocument({
    statements: [
      s3PolicyStatement,
      cloudformationPolicyStatement,
      cloudfrontPolicyStatement,
    ],
  });

  return new Role(scope, "Role", {
    roleName: `hold-my-clips-lambda-role-${environment}`,
    assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    ],
    inlinePolicies: {
      "HMC-lambda-s3-access": uploadPolicy,
    },
  });
}

function getAllClipsIntegration(role: Role, tableName: string) {
  // GET Integration with DynamoDb for all clips using Query on GSI
  return new AwsIntegration({
    service: "dynamodb",
    action: "Query",
    options: {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      requestTemplates: {
        "application/json": `
          #set($sortIndex = $input.params('sortIndex'))
          #set($validIndices = ["UploadDate", "Title"])
          #if($validIndices.contains($sortIndex))
            #set($indexName = "AllClipsBy$sortIndex")
          #else
            #set($indexName = "AllClipsByUploadDate")
          #end
          {
          "TableName": "${tableName}",
          "IndexName": "$indexName",
          "KeyConditionExpression": "itemType = :itemType",
          "ExpressionAttributeValues": {
            ":itemType": {"S": "CLIP"}
          },
          "ScanIndexForward": #if($input.params('order') == 'asc')true#{else}false#end,
          "Limit": #if($input.params('limit'))$input.params('limit')#{else}20#end
          #if($input.params('nextToken') != ''),"ExclusiveStartKey": $util.base64Decode($input.params('nextToken'))#end
        }`,
      },
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": `#set($inputRoot = $input.path('$'))
              {
                "clips": [
              #foreach($item in $inputRoot.Items)
                  {
                    "id": "$util.escapeJavaScript($item.id.S)",
                    "title": "$util.escapeJavaScript($item.title.S).replaceAll("\\\\'", "'")",
                    "uploader": "$util.escapeJavaScript($item.uploader.S)",
                    "uploadedOn": "$item.uploadedOn.N",
                    "duration": "$item.duration.N",
                    "description": "$util.escapeJavaScript($item.description.S).replaceAll("\\\\'", "'")",
                    "views": #if($item.views)"$item.views.N"#else"0"#end,
                    "likes": #if($item.likes)"$item.likes.N"#else"0"#end#if($item.fileExtension),
                    "fileExtension": "$item.fileExtension.S"#end
                  }#if($foreach.hasNext),#end
              #end
                ],
                "nextToken": #if($inputRoot.LastEvaluatedKey)"$util.base64Encode($input.json('$.LastEvaluatedKey'))"#else null#end,
                "hasMore": #if($inputRoot.LastEvaluatedKey)true#else false#end
              }`,
          },
        },
      ],
    },
  });
}

function getSingleClipIntegration(role: Role, tableName: string) {
  // GET Integration with DynamoDb for single clip
  return new AwsIntegration({
    service: "dynamodb",
    action: "GetItem",
    options: {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      requestTemplates: {
        "application/json": `{
          "Key": {
            "id": {
              "S": "$method.request.path.id"
            }
          },
          "TableName": "${tableName}"
        }`,
      },
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": `
            {
              "id": "$input.path('$.Item.id.S')",
              "duration": "$input.path('$.Item.duration.N')",
              "description": "$util.escapeJavaScript($input.path('$.Item.description.S')).replaceAll("\\\\'","'")",
              "uploader": "$input.path('$.Item.uploader.S')",
              "uploadedOn": "$input.path('$.Item.uploadedOn.N')",
              "title": "$util.escapeJavaScript($input.path('$.Item.title.S')).replaceAll("\\\\'","'")",
              "views": #if($input.path('$.Item.views'))"$input.path('$.Item.views.N')"#else"0"#end,
              "likes": #if($input.path('$.Item.likes'))"$input.path('$.Item.likes.N')"#else"0"#end#if($input.path('$.Item.fileExtension')),
              "fileExtension": "$input.path('$.Item.fileExtension.S')"#end
            }
          `,
          },
        },
      ],
    },
  });
}
