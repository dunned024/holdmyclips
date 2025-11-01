import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { verifyToken } from "/opt/nodejs/cognitoAuth.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const cloudFrontClient = new CloudFrontClient({});
const cloudFormationClient = new CloudFormationClient({});

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  // Extract token from Authorization header
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    console.error("No Authorization header found");
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Unauthorized: No token provided" }),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  // Get environment variables
  const userPoolId = process.env.USER_POOL_ID;
  const region = process.env.COGNITO_REGION || "us-east-1";
  const clientId = process.env.CLIENT_ID;
  const clipsTableName = process.env.CLIPS_TABLE_NAME;
  const userLikesTableName = process.env.USER_LIKES_TABLE_NAME;

  if (!userPoolId || !clientId || !clipsTableName || !userLikesTableName) {
    console.error("Missing required environment variables", {
      userPoolId,
      clientId,
      clipsTableName,
      userLikesTableName,
    });
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Verify token
  const verification = await verifyToken(token, userPoolId, region, clientId);
  if (!verification.valid) {
    console.error("Token verification failed:", verification.error);
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Unauthorized: Invalid token",
        details: verification.error,
      }),
    };
  }

  const userId = verification.username;
  console.log("Authenticated user:", userId);

  // Extract clip ID from path parameters
  const clipId = event.pathParameters?.id;
  if (!clipId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Missing clip ID" }),
    };
  }

  try {
    if (event.httpMethod === "GET") {
      // Check if user has liked this clip
      return await checkLike(userId, clipId, userLikesTableName, docClient);
    } else if (event.httpMethod === "POST") {
      // Add like
      return await addLike(
        userId,
        clipId,
        clipsTableName,
        userLikesTableName,
        docClient,
      );
    } else if (event.httpMethod === "DELETE") {
      // Remove like
      return await removeLike(
        userId,
        clipId,
        clipsTableName,
        userLikesTableName,
        docClient,
      );
    } else {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }
  } catch (error) {
    console.error("Error processing like:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to process like",
        details: error.message,
      }),
    };
  }
};

async function getStackOutput(stackName, outputKey) {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const data = await cloudFormationClient.send(command);
  const stackOutputs = data.Stacks[0].Outputs;
  const output = stackOutputs.find((o) => o.OutputKey === outputKey);
  return output?.OutputValue;
}

async function invalidateCloudFrontCache(clipId) {
  try {
    // Get environment-specific stack name
    const environment = process.env.ENVIRONMENT || "Prod";
    const stackName = `HMCStaticSite${environment}`;
    const distributionId = await getStackOutput(
      stackName,
      "StaticSiteDistributionId",
    );

    if (!distributionId) {
      console.warn(
        "Could not retrieve distribution ID, skipping CloudFront cache invalidation",
      );
      return;
    }

    console.log({ distributionId });

    const callerReference = `like-${clipId}-${Date.now()}`;

    const invalidationParams = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: callerReference,
        Paths: {
          Quantity: 1,
          Items: [`/clip/${clipId}`],
        },
      },
    };

    const command = new CreateInvalidationCommand(invalidationParams);
    const result = await cloudFrontClient.send(command);
    console.log(
      `CloudFront invalidation created for clip ${clipId}:`,
      result.Invalidation.Id,
    );
  } catch (error) {
    console.error(
      `Failed to create CloudFront invalidation for clip ${clipId}:`,
      error,
    );
    // Don't throw - cache invalidation failure shouldn't fail the whole request
  }
}

async function checkLike(userId, clipId, userLikesTableName, docClient) {
  const checkCommand = new GetCommand({
    TableName: userLikesTableName,
    Key: {
      userId: userId,
      clipId: clipId,
    },
  });

  const result = await docClient.send(checkCommand);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      liked: !!result.Item,
    }),
  };
}

async function addLike(
  userId,
  clipId,
  clipsTableName,
  userLikesTableName,
  docClient,
) {
  // Check if user has already liked this clip
  const checkCommand = new GetCommand({
    TableName: userLikesTableName,
    Key: {
      userId: userId,
      clipId: clipId,
    },
  });

  const existingLike = await docClient.send(checkCommand);
  if (existingLike.Item) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Already liked",
        message: "You have already liked this clip",
      }),
    };
  }

  // Add like to user likes table
  const putCommand = new PutCommand({
    TableName: userLikesTableName,
    Item: {
      userId: userId,
      clipId: clipId,
      likedAt: Date.now(),
    },
  });

  await docClient.send(putCommand);

  // Atomically increment the like count in clips table
  const updateCommand = new UpdateCommand({
    TableName: clipsTableName,
    Key: {
      id: clipId,
    },
    UpdateExpression:
      "SET #likes = if_not_exists(#likes, :zero) + :inc, itemType = if_not_exists(itemType, :itemType)",
    ExpressionAttributeNames: {
      "#likes": "likes",
    },
    ExpressionAttributeValues: {
      ":inc": 1,
      ":zero": 0,
      ":itemType": "CLIP",
    },
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(updateCommand);

  // Invalidate CloudFront cache for this clip
  await invalidateCloudFrontCache(clipId);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Like added",
      likes: response.Attributes?.likes || 1,
      liked: true,
    }),
  };
}

async function removeLike(
  userId,
  clipId,
  clipsTableName,
  userLikesTableName,
  docClient,
) {
  // Check if user has liked this clip
  const checkCommand = new GetCommand({
    TableName: userLikesTableName,
    Key: {
      userId: userId,
      clipId: clipId,
    },
  });

  const existingLike = await docClient.send(checkCommand);
  if (!existingLike.Item) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Not liked",
        message: "You have not liked this clip",
      }),
    };
  }

  // Remove like from user likes table
  const deleteCommand = new DeleteCommand({
    TableName: userLikesTableName,
    Key: {
      userId: userId,
      clipId: clipId,
    },
  });

  await docClient.send(deleteCommand);

  // Atomically decrement the like count in clips table
  const updateCommand = new UpdateCommand({
    TableName: clipsTableName,
    Key: {
      id: clipId,
    },
    UpdateExpression: "SET #likes = if_not_exists(#likes, :one) - :dec",
    ExpressionAttributeNames: {
      "#likes": "likes",
    },
    ExpressionAttributeValues: {
      ":dec": 1,
      ":one": 1,
    },
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(updateCommand);

  // Invalidate CloudFront cache for this clip
  await invalidateCloudFrontCache(clipId);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Like removed",
      likes: Math.max(0, response.Attributes?.likes || 0),
      liked: false,
    }),
  };
}
