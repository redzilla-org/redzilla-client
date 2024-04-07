const { S3Client, SyncCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { CloudFormationClient, DescribeStackResourceCommand } = require('@aws-sdk/client-cloudformation');

const deployToS3 = async () => {
  const s3Client = new S3Client();
  const syncCommand = new SyncCommand({
    source: 'build/',
    destination: `s3://${process.env.DEPLOYMENT_BUCKET}/public/`,
    recursive: true,
  });

  try {
    await s3Client.send(syncCommand);
    console.log('Deployment to S3 successful');
  } catch (error) {
    console.error('Error deploying to S3:', error);
    process.exit(1);
  }
};

const invalidateCloudFront = async () => {
  const cloudFormationClient = new CloudFormationClient();
  const describeStackResourceCommand = new DescribeStackResourceCommand({
    StackName: `${process.env.STACK_NAME}-runtime`,
    LogicalResourceId: 'MyDistribution',
  });

  try {
    const response = await cloudFormationClient.send(describeStackResourceCommand);
    const distributionId = response.StackResourceDetail.PhysicalResourceId;

    const cloudfrontClient = new CloudFrontClient();
    const invalidationCommand = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
      },
    });

    await cloudfrontClient.send(invalidationCommand);
    console.log('CloudFront invalidation successful');
  } catch (error) {
    console.error('Error invalidating CloudFront:', error);
    process.exit(1);
  }
};

const deploy = async () => {
  try {
    const credentials = JSON.parse(process.argv[2]);
    process.env.AWS_ACCESS_KEY_ID = credentials.Credentials.AccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = credentials.Credentials.SecretAccessKey;
    process.env.AWS_SESSION_TOKEN = credentials.Credentials.SessionToken;

    await deployToS3();
    await invalidateCloudFront();

    console.log('Deployment completed successfully');
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
};

deploy();