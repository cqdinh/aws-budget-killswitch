import * as cdk from '@aws-cdk/core';
import { BudgetEmergencyCutoff } from './BudgetEmergencyCutoff';

export class AwsBudgetEmergencyCutoffStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cutoff = new BudgetEmergencyCutoff(this, "budget-cutoff", {
        maxDollarsPerMonth: 0.01,
        stacksToDelete: ["test-stack"]
    })
  }
}
