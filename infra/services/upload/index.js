import { CloudFormation } from "@aws-sdk/client-cloudformation";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3 } from "@aws-sdk/client-s3";
import { verifyToken } from "/opt/nodejs/cognitoAuth.js";

export const handler = async (event) => {
  console.log({ event });
  console.log({ stringEvent: JSON.stringify(event) });

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
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

  if (!userPoolId || !clientId) {
    console.error("Missing required environment variables", {
      userPoolId,
      clientId,
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

  // TODO: This is returning 'undefined' -- do we need to specify username in the token manually?
  console.log("Authenticated user:", verification.username);

  if (event.httpMethod === "PUT") {
    // Handle metadata upload (clipdata)
    // Note: File uploads now use presigned URLs and go directly to S3
    try {
      const parsedData = JSON.parse(event.body);
      console.log({ parsedData });

      // Override uploader with verified username from token
      parsedData.uploader = verification.username;

      const id = parsedData.id;
      const bucket = process.env.BUCKET_NAME || "hold-my-clips";

      const s3 = new S3();
      await s3.putObject({
        Bucket: bucket,
        Key: `clips/${id}/${id}.json`,
        Body: JSON.stringify(parsedData),
        ContentType: "application/json",
      });

      await storeIndexRecord(id, parsedData);
      await invalidateDistributionPath();

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Metadata uploaded successfully",
          id: id,
        }),
      };
    } catch (error) {
      console.error("Error uploading metadata:", error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Failed to upload metadata",
          details: error.message,
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};

const storeIndexRecord = async (id, parsedData) => {
  console.log(
    "storeIndexRecord called with:",
    JSON.stringify(parsedData, null, 2),
  );

  const indexItem = {};

  const sanitizedTitle = parsedData.title.replace(/"/g, '\\"');

  indexItem.id = { S: id };
  indexItem.itemType = { S: "CLIP" }; // Enables GSI queries (efficient querying/sorting from DynamoDB)
  indexItem.title = { S: sanitizedTitle };
  indexItem.uploader = { S: parsedData.uploader };
  indexItem.uploadedOn = { N: String(parsedData.uploadedOn) };
  indexItem.duration = { N: String(parsedData.duration) };
  indexItem.fileExtension = { S: parsedData.fileExtension || "mp4" };
  indexItem.views = { N: "0" };
  indexItem.likes = { N: "0" };

  // Only add description if it exists and is not empty
  if (parsedData.description && parsedData.description.trim() !== "") {
    const sanitizedDescription = parsedData.description.replace(/"/g, '\\"');
    indexItem.description = { S: sanitizedDescription };
  }

  console.log("Built indexItem:", JSON.stringify(indexItem, null, 2));

  // Get environment-specific stack name
  const environment = process.env.ENVIRONMENT || "Prod";
  const stackName = `HMCClipdex${environment}`;
  const tableName = await _getStackOutput(stackName, "ClipdexTableName");
  console.log({ tableName });

  const putParams = {
    TableName: tableName,
    Item: indexItem,
  };

  try {
    const dynamodb = new DynamoDB();
    const result = await dynamodb.putItem(putParams);
    console.log("DynamoDB putItem success:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("DynamoDB putItem error:", error);
    throw error;
  }
};

const invalidateDistributionPath = async () => {
  // Get environment-specific stack name
  const environment = process.env.ENVIRONMENT || "Prod";
  const stackName = `HMCStaticSite${environment}`;
  const distributionId = await _getStackOutput(
    stackName,
    "StaticSiteDistributionId",
  );
  console.log({ distributionId });

  const callerReference = new Date().toISOString().replace(/\:|\-|\./g, "");
  console.log({ callerReference });

  const invalidationParams = {
    DistributionId: distributionId,
    InvalidationBatch: {
      Paths: {
        Quantity: 2,
        Items: ["/", "/clips"],
      },
      CallerReference: callerReference,
    },
  };

  const cloudFront = new CloudFront();
  cloudFront.createInvalidation(invalidationParams, (err, data) => {
    if (err) console.log({ err, errStack: err.stack });
    else console.log(data);
  });
};

const _getStackOutput = (stackName, outputKey) =>
  new Promise((resolve, reject) => {
    const cloudFormation = new CloudFormation();

    cloudFormation.describeStacks({ StackName: stackName }, (err, data) => {
      if (err) {
        console.log({ err, errStack: err.stack });
        reject(err);
      } else {
        const stackOutputs = data.Stacks[0].Outputs;
        const output = stackOutputs.find(
          (o) => o.OutputKey === outputKey,
        ).OutputValue;
        resolve(output);
      }
    });
  });
