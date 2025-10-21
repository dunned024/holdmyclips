import { CloudFormation } from "@aws-sdk/client-cloudformation";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const handler = async (event, context, callback) => {
  console.log(event);
  console.log(event.body);
  const parsedData = JSON.parse(event.body);
  console.log({ parsedData });

  const clipId = parsedData["clipId"];
  const s3 = new S3Client({});

  // Download clip comments file if it exists
  const commentsObj = await getClipCommentsObject(s3, clipId);
  if ("error" in commentsObj) {
    console.log("Error when getting comments: ", commentsObj);
    return commentsObj;
  }

  console.log(commentsObj);
  const comments = commentsObj["comments"];
  console.log(comments);

  let newCommentsObj;
  if (event.httpMethod === "POST") {
    // Add comment
    newCommentsObj = addCommentToCommentsObject(
      comments,
      parsedData["author"],
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
      return { error: err };
    }

    if (targetComment["author"] != parsedData["author"]) {
      const err = `Target comment author (${targetComment["author"]}) does not match user (${parsedData["author"]})`;
      console.log("Error when deleting comment: ", err);
      return { error: err };
    }
    newCommentsObj = deleteCommentFromCommentsObject(
      comments,
      parsedData["commentId"],
    );
  } else {
    const err = `Invalid request method: ${event.httpMethod}`;
    console.log(err);
    return { error: err };
  }

  const response = await uploadClipCommentsObject(s3, clipId, newCommentsObj);

  if ("error" in response) {
    console.log("Error when uploading new comments object: ", response);
    return { error: response };
  }

  await invalidateDistributionPath(clipId);
  callback(null, event);
};

const getClipCommentsObject = async (s3, clipId) => {
  const s3Obj = {
    Bucket: "hold-my-clips",
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

const uploadClipCommentsObject = async (s3, clipId, newCommentsObj) => {
  const putCommand = new PutObjectCommand({
    Bucket: "hold-my-clips",
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
  const distributionId = await _getStackOutput(
    "HMCStaticSite",
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
