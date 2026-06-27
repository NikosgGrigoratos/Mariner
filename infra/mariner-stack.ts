import * as path from 'node:path';
import { Stack, type StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Vpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
  DatabaseCluster,
  DatabaseClusterEngine,
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
} from 'aws-cdk-lib/aws-rds';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

const DB_NAME = 'mariner';

export class MarinerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Minimal VPC: isolated subnets only, no NAT gateway (keeps networking free).
    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'isolated', subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // Aurora Serverless v2 PostgreSQL, accessed via the Data API (no VPC needed for Lambda).
    const cluster = new DatabaseCluster(this, 'Database', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_6,
      }),
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      writer: ClusterInstance.serverlessV2('writer'),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 1,
      enableDataApi: true,
      credentials: Credentials.fromGeneratedSecret('postgres'),
      defaultDatabaseName: DB_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    if (!cluster.secret) {
      throw new Error('Expected the database cluster to have a generated secret.');
    }

    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, '..', 'src', 'handlers', 'api.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      environment: {
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: cluster.secret.secretArn,
        DB_NAME,
      },
    });

    // Allow the Lambda to call the Data API and read the DB credentials secret.
    cluster.grantDataApiAccess(apiFunction);

    const httpApi = new HttpApi(this, 'MarinerHttpApi', {
      apiName: 'mariner-api',
      defaultIntegration: new HttpLambdaIntegration('ApiIntegration', apiFunction),
    });

    new CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new CfnOutput(this, 'ClusterArn', { value: cluster.clusterArn });
    new CfnOutput(this, 'SecretArn', { value: cluster.secret.secretArn });
    new CfnOutput(this, 'DbName', { value: DB_NAME });
  }
}
