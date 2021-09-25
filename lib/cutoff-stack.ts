import * as cdk from '@aws-cdk/core';
import { BudgetKillswitch } from './BudgetKillswitch';

export class AwsBudgetEmergencyCutoffStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cutoff = new BudgetKillswitch(this, "budget-cutoff", {
        maxDollarsPerMonth: 10.00,
        stacksToDelete: ["test-stack-a", {
            stackName: "test-stack-b",
            region: "us-west-1"
        }]
    })
  }
}
