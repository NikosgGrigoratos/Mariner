import { App } from 'aws-cdk-lib';
import { MarinerStack } from './mariner-stack';

const app = new App();

new MarinerStack(app, 'MarinerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
