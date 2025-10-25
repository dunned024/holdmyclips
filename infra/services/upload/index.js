import { CloudFormation } from "@aws-sdk/client-cloudformation";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3 } from "@aws-sdk/client-s3";
import { verifyToken } from "/opt/nodejs/cognitoAuth.js";

export const handler = async (event, context, callback) => {
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
        "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
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
    // Check if this is a file upload (uploadclip) or metadata (clipdata)
    const isFileUpload = event.queryStringParameters?.filename;

    if (isFileUpload) {
      // Handle file upload (video or thumbnail)
      const filename = event.queryStringParameters.filename;
      const bucket = process.env.BUCKET_NAME || "hold-my-clips";

      // Extract clip ID from filename (e.g., "abc123.mp4" -> "abc123")
      const clipId = filename.split(".")[0];

      console.log("File upload:", { filename, clipId, bucket });

      const s3 = new S3();

      // TODO: error occurs after this point
      /*
        {
            "errorType": "TypeError",
            "errorMessage": "Cannot read properties of null (reading 'readableFlowing')",
            "stack": [
                "TypeError: Cannot read properties of null (reading 'readableFlowing')",
                "    at readableStreamHasher (/var/task/node_modules/@smithy/hash-stream-node/dist-cjs/index.js:48:24)",
                "    at getAwsChunkedEncodingStream (/var/task/node_modules/@smithy/util-stream/dist-cjs/getAwsChunkedEncodingStream.js:11:39)",
                "    at /var/task/node_modules/@aws-sdk/middleware-flexible-checksums/dist-cjs/index.js:218:27"
            ]
        }
      */
      // API Gateway base64 encodes binary data
      const buffer = event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : event.body;

      const contentType =
        event.headers["content-type"] ||
        event.headers["Content-Type"] ||
        "application/octet-stream";

      await s3.putObject({
        Bucket: bucket,
        Key: `clips/${clipId}/${filename}`,
        Body: buffer,
        ContentType: contentType,
      });

      console.log("File uploaded successfully:", filename);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "File uploaded successfully",
          filename: filename,
        }),
      };
    } else {
      // Handle metadata upload (clipdata)
      const parsedData = JSON.parse(event.body);
      console.log({ parsedData });

      // Override uploader with verified username from token
      parsedData.uploader = verification.username;

      const id = parsedData["id"];
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
  const indexItem = {};

  const sanitizedTitle = parsedData["title"].replace(/"/g, '\\"');
  const sanitizedDescription = (parsedData["description"] || "").replace(
    /"/g,
    '\\"',
  );
  console.log({ parsedTitle: parsedData["title"], sanitizedTitle });

  indexItem["id"] = { S: id };
  indexItem["title"] = { S: sanitizedTitle };
  indexItem["uploader"] = { S: parsedData["uploader"] };
  indexItem["uploadedOn"] = { N: parsedData["uploadedOn"] };
  indexItem["description"] = { S: sanitizedDescription };
  indexItem["duration"] = { N: parsedData["duration"] };

  // Get environment-specific stack name
  const environment = process.env.ENVIRONMENT || "Prod";
  const stackName = `HMCClipdex${environment}`;
  const tableName = await _getStackOutput(stackName, "ClipdexTableName");
  console.log({ tableName });

  const putParams = {
    TableName: tableName,
    Item: indexItem,
  };
  console.log({ putParams });

  const dynamodb = new DynamoDB();
  dynamodb.putItem(putParams);
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
        const output = stackOutputs.find((o) => o.OutputKey === outputKey)[
          "OutputValue"
        ];
        resolve(output);
      }
    });
  });
