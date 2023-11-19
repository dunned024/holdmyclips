# Hold My Clips

Hold My Clips is a small-scale serverless video hosting app, built for enjoyment amongst friends.


## Local Development

When running locally, clip metadata is spoofed using [json-server](https://www.npmjs.com/package/json-server). The clips themselves are still retrieved from S3.

Simply start the json-server and client containers with:

```
docker-compose up --build -d
```

Then visit [https://localhost:3000](https://localhost:3000).
