import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const handler = async (event, context, callback) => {
  const request = event.Records[0].cf.request;
  console.log(request);

  const clipId = request.uri.replace("/player/", "");
  console.log(clipId);

  const s3 = new S3Client({});
  const indexBody = await _get_index_page(s3);
  console.log(indexBody);

  const clipDetails = await _get_clip_details(s3, clipId);
  console.log(clipDetails);

  const response = event.Records[0].cf.response;
  console.log(response);

  response.body = _replace_meta_tags(indexBody, clipId, clipDetails);
  console.log(response.body);

  response.status = "200";
  response.statusDescription = "OK";
  response.headers["content-type"] = [
    {
      value: "text/html",
      key: "Content-Type",
    },
  ];

  console.log(response);

  callback(null, response);
};

const _get_index_page = async (s3) => {
  const s3Obj = {
    Bucket: "hold-my-clips",
    Key: "index.html",
  };
  const getCommand = new GetObjectCommand(s3Obj);
  const getResponse = await s3.send(getCommand);
  return getResponse.Body.transformToString();
};

const _get_clip_details = async (s3, clipId) => {
  const s3Obj = {
    Bucket: "hold-my-clips",
    Key: `clips/${clipId}/${clipId}.json`,
  };
  const getCommand = new GetObjectCommand(s3Obj);
  const getResponse = await s3.send(getCommand);
  const clipDetailsString = await getResponse.Body.transformToString();
  return JSON.parse(clipDetailsString);
};

const _replace_meta_tags = (body, clipId, clipDetails) => {
  body = _replace_meta_tag_content(body, "og:title", clipDetails["title"]);
  body = _replace_meta_tag_content(
    body,
    "og:description",
    clipDetails["description"],
  );
  body = _replace_meta_tag_content(
    body,
    "og:image",
    `/clips/${clipId}/${clipId}.png`,
  );
  return body;
};

const _replace_meta_tag_content = (body, tagName, replacementValue) => {
  const pattern = new RegExp(`<meta name="${tagName}" content="(.*?)"\/>`, "g");
  const replacer =
    replacementValue !== undefined
      ? `<meta name="${tagName}" content="${replacementValue}"\/>`
      : "";
  return body.replace(pattern, replacer);
};
