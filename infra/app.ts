import { App } from 'aws-cdk-lib';
import { MarinerStack } from './mariner-stack';
import { GuardrailsStack } from './guardrails-stack';

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const alertEmail = app.node.tryGetContext('alertEmail') as string | undefined;
const monthlyLimitUsd = Number(app.node.tryGetContext('monthlyBudgetUsd') ?? 5);

if (!alertEmail) {
  throw new Error('Missing "alertEmail" context value (set it in cdk.json).');
}

new GuardrailsStack(app, 'MarinerGuardrailsStack', { env, alertEmail, monthlyLimitUsd });
new MarinerStack(app, 'MarinerStack', { env });
