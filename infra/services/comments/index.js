import { CloudFormation } from "@aws-sdk/client-cloudformation";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { verifyToken } from "/opt/nodejs/cognitoAuth.js";

export const handler = async (event, context, callback) => {
  console.log(event);
  console.log(event.body);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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
  const bucketName = process.env.BUCKET_NAME || "hold-my-clips";

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

  console.log("Authenticated user:", verification.username);

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

  const parsedData = JSON.parse(event.body || "{}");
  console.log({ clipId, parsedData });

  const s3 = new S3Client({});

  // Download clip comments file if it exists
  const commentsObj = await getClipCommentsObject(s3, clipId, bucketName);
  if ("error" in commentsObj) {
    console.log("Error when getting comments: ", commentsObj);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(commentsObj),
    };
  }

  console.log(commentsObj);
  const comments = commentsObj["comments"];
  console.log(comments);

  let newCommentsObj;
  if (event.httpMethod === "POST") {
    // Add comment - use verified username from token
    newCommentsObj = addCommentToCommentsObject(
      comments,
      verification.username, // Use verified username, not from request body
      parsedData["commentText"],
      parsedData["postedAt"],
    );
  } else if (event.httpMethod == "DELETE") {
    // Delete comment
    const targetComment = comments.find(
      (o) => o.commentId === parsedData["commentId"],
    );

    if (targetComment === undefined) {
      const err = `Comment with ID ${parsedData["commentId"]} not found`;
      console.log("Error when deleting comment: ", err);
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: err }),
      };
    }

    // Verify the user owns this comment (use verified username)
    if (targetComment["author"] !== verification.username) {
      const err = `Cannot delete comment: author mismatch`;
      console.log("Error when deleting comment: ", err);
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: err }),
      };
    }

    newCommentsObj = deleteCommentFromCommentsObject(
      comments,
      parsedData["commentId"],
    );
  } else {
    const err = `Invalid request method: ${event.httpMethod}`;
    console.log(err);
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: err }),
    };
  }

  const response = await uploadClipCommentsObject(
    s3,
    clipId,
    newCommentsObj,
    bucketName,
  );

  if ("error" in response) {
    console.log("Error when uploading new comments object: ", response);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: response }),
    };
  }

  await invalidateDistributionPath(clipId);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Comment operation successful",
      comments: newCommentsObj.comments,
    }),
  };
};

const getClipCommentsObject = async (s3, clipId, bucketName) => {
  const s3Obj = {
    Bucket: bucketName,
    Key: `clips/${clipId}/${clipId}.comments.json`,
  };
  const getCommand = new GetObjectCommand(s3Obj);

  try {
    const getResponse = await s3.send(getCommand);
    const body = await getResponse.Body?.transformToString();
    console.log(body);
    return JSON.parse(body);
  } catch (err) {
    console.log(err);
    if ("$metadata" in err && err["$metadata"]["httpStatusCode"] === "403") {
      return { error: err };
    } else {
      console.log(`Comment file not found for clip ${clipId}. Creating one.`);
      return { comments: [] };
    }
  }
};

const addCommentToCommentsObject = (
  comments,
  author,
  newCommentText,
  postedAt,
) => {
  let nextId;
  if (!comments.length) {
    nextId = 1;
  } else {
    nextId =
      Math.max.apply(
        Math,
        comments.map((o) => o.commentId),
      ) + 1;
  }

  const newComment = {
    commentId: nextId,
    author: author,
    commentText: newCommentText,
    postedAt: postedAt,
  };

  comments.push(newComment);
  const newCommentsObj = {
    comments: comments.sort((x, y) => {
      return x.postedAt - y.postedAt;
    }),
  };
  return newCommentsObj;
};

const deleteCommentFromCommentsObject = (comments, commentId) => {
  const newCommentsObj = {
    comments: comments.filter((obj) => obj.commentId != commentId),
  };
  return newCommentsObj;
};

const uploadClipCommentsObject = async (
  s3,
  clipId,
  newCommentsObj,
  bucketName,
) => {
  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: `clips/${clipId}/${clipId}.comments.json`,
    Body: JSON.stringify(newCommentsObj),
  });
  try {
    return await s3.send(putCommand);
  } catch (err) {
    console.error(err);
    return { error: err };
  }
};

const invalidateDistributionPath = async (clipId) => {
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
        Quantity: 1,
        Items: [`/clips/${clipId}/${clipId}.comments.json`],
      },
      CallerReference: callerReference,
    },
  };

  const cloudFront = new CloudFront({});
  cloudFront.createInvalidation(invalidationParams, (err, data) => {
    if (err) console.log({ err, errStack: err.stack });
    else console.log(data);
  });
};

const _getStackOutput = (stackName, outputKey) =>
  new Promise((resolve, reject) => {
    const cloudFormation = new CloudFormation({});

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
