echo "Deleting old deployment..."
aws s3 rm s3://hold-my-clips/static/css/ --recursive
aws s3 rm s3://hold-my-clips/static/js/ --recursive

echo "Uploading new deployment..."
aws s3 sync build/ s3://hold-my-clips

echo "Creating distribution invalidation..."
distribution_id=EAJEQLV6LELMF
echo "Distribution ID: ${distribution_id}"

invalidation_id=$(aws cloudfront create-invalidation --distribution-id ${distribution_id} --paths "/*" --query "Invalidation.Id" --output text)
echo "Invalidation created: ${invalidation_id}"
echo "Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed --distribution-id ${distribution_id} --id ${invalidation_id}
echo "Done!"
