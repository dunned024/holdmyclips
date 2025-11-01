import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

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

  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    console.error("Missing TABLE_NAME environment variable");
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  try {
    // Atomically increment the view count
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        id: clipId,
      },
      UpdateExpression:
        "SET #views = if_not_exists(#views, :zero) + :inc, itemType = if_not_exists(itemType, :itemType)",
      ExpressionAttributeNames: {
        "#views": "views",
      },
      ExpressionAttributeValues: {
        ":inc": 1,
        ":zero": 0,
        ":itemType": "CLIP",
      },
      ReturnValues: "ALL_NEW",
    });

    const response = await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "View recorded",
        views: response.Attributes?.views || 1,
      }),
    };
  } catch (error) {
    console.error("Error incrementing views:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to record view",
        details: error.message,
      }),
    };
  }
};
