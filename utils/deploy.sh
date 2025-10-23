#!/bin/bash

# Usage: bash utils/deploy.sh [env]
# env: 'dev' or 'prod' (default: prod)

ENV=${1:-prod}

# Validate environment argument
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: Invalid environment '$ENV'. Must be 'dev' or 'prod'."
  exit 1
fi

echo "Deploying to $ENV environment..."

# Set environment-specific variables
if [[ "$ENV" == "prod" ]]; then
  BUCKET_NAME="hold-my-clips"
  DISTRIBUTION_ID="EAJEQLV6LELMF"
else
  BUCKET_NAME="hold-my-clips-dev"
  DISTRIBUTION_ID="EQTDEZTES3QCU"
fi

echo "Bucket: $BUCKET_NAME"
echo "Distribution ID: $DISTRIBUTION_ID"

echo "Deleting old deployment..."
aws s3 rm s3://${BUCKET_NAME}/static/css/ --recursive
aws s3 rm s3://${BUCKET_NAME}/static/js/ --recursive

echo "Uploading new deployment..."
aws s3 sync build/ s3://${BUCKET_NAME}

echo "Creating CloudFront invalidation..."
invalidation_id=$(aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*" --query "Invalidation.Id" --output text)
echo "Invalidation created: ${invalidation_id}"
echo "Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed --distribution-id ${DISTRIBUTION_ID} --id ${invalidation_id}
echo "Deployment to $ENV complete!"
