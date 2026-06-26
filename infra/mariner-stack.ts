import * as path from 'node:path';
import { Stack, type StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class MarinerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, '..', 'src', 'handlers', 'api.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
    });

    const httpApi = new HttpApi(this, 'MarinerHttpApi', {
      apiName: 'mariner-api',
      defaultIntegration: new HttpLambdaIntegration('ApiIntegration', apiFunction),
    });

    new CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
    });
  }
}
