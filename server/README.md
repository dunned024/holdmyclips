# Hold My Clips - Server

Hold My Clips is serverless in production. This folder can be used to mock clip metadata as if it were being returned by S3.

## Setup

The preferred method of using the mock server is by running `docker-compose up --build -d` in the root dir of the repo.

If you wish to run the server outside of Docker, you can do so by installing the necessary packages with `npm i`, then running `npm run server`.
