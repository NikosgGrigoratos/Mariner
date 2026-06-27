import { Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { CfnBudget } from 'aws-cdk-lib/aws-budgets';

export interface GuardrailsStackProps extends StackProps {
  monthlyLimitUsd: number;
  alertEmail: string;
}

export class GuardrailsStack extends Stack {
  constructor(scope: Construct, id: string, props: GuardrailsStackProps) {
    super(scope, id, props);

    const { monthlyLimitUsd, alertEmail } = props;

    const subscriber = {
      subscriptionType: 'EMAIL',
      address: alertEmail,
    };

    const atThreshold = (notificationType: 'ACTUAL' | 'FORECASTED', threshold: number) => ({
      notification: {
        notificationType,
        comparisonOperator: 'GREATER_THAN',
        threshold,
        thresholdType: 'PERCENTAGE',
      },
      subscribers: [subscriber],
    });

    new CfnBudget(this, 'MonthlyCostBudget', {
      budget: {
        budgetName: 'mariner-monthly-cost',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: monthlyLimitUsd, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        atThreshold('ACTUAL', 50),
        atThreshold('ACTUAL', 80),
        atThreshold('ACTUAL', 100),
        atThreshold('FORECASTED', 100),
      ],
    });
  }
}
