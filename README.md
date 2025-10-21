# Hold My Clips

Hold My Clips is a small-scale serverless video hosting app, built for enjoyment amongst friends.

## Local Development

When running locally, clip metadata is spoofed using [json-server](https://www.npmjs.com/package/json-server). The clips themselves (i.e. media) are still retrieved from S3.

### Start Development

```bash
# Start mock API server
docker-compose up -d

# Install and run
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

### Stop Development

```bash
docker-compose down
```
