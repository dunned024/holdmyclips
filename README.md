# Hold My Clips

Hold My Clips is a small-scale serverless video hosting app, built for enjoyment amongst friends.

## Local Development

When running locally, the frontend points to the dev or prod cloud services (API Gateway, S3, Cognito). Configure the environment by setting the appropriate `VITE_*` environment variables in a `.env` file or by exporting them in your shell.

### Start Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.development.local` file to configure which cloud environment to use:

```bash
VITE_API_ENDPOINT=https://your-api-endpoint
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_DOMAIN=your-cognito-domain
VITE_COGNITO_REDIRECT_URI=http://localhost:3000/
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
```
