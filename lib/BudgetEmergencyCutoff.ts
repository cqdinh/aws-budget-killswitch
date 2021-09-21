import { CfnBudget } from "@aws-cdk/aws-budgets";
import { Topic } from "@aws-cdk/aws-sns";
import { Construct } from "@aws-cdk/core";
import { StackDeleteLambda } from "./StackDeleteLambda";

export interface BudgetEmergencyCutoffProps {
    maxDollarsPerMonth: number,
    stacksToDelete: Array<string>
}

export class BudgetEmergencyCutoff extends Construct {
    constructor(scope: Construct, id: string, props: BudgetEmergencyCutoffProps) {
        super(scope, id);

        const topic = new Topic(this, "emergencyCutoffTopic", {
            displayName: "Budget Emergency Cutoff Triggered",
            topicName: "emergency-cutoff-topic"
        });

        const budget = new CfnBudget(this, "max-spending", {
            budget: {
                budgetType: "COST",
                timeUnit: "MONTHLY",
                budgetLimit: {
                    amount: props.maxDollarsPerMonth,
                    unit: "USD"
                }
            },
            notificationsWithSubscribers: [{
                notification: {
                    comparisonOperator: "GREATER_THAN",
                    notificationType: "ACTUAL",
                    threshold: 100
                },
                subscribers: [
                    {
                        subscriptionType: "SNS",
                        address: topic.topicArn
                    }
                ]
            }]
        });

        const lambda = new StackDeleteLambda(this, "stackDeleteLambda", {
            stacksToDelete: props.stacksToDelete,
            triggerTopics: [topic]
        });
    }
}