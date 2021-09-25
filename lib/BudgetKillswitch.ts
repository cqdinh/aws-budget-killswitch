import { CfnBudget } from "@aws-cdk/aws-budgets";
import { Topic } from "@aws-cdk/aws-sns";
import { Construct } from "@aws-cdk/core";
import { StackDeleteLambda } from "./StackDeleteLambda";

export interface StackToKill {
    stackName: string,
    region?: string
}

export interface BudgetKillswitchProps {
    maxDollarsPerMonth: number,
    stacksToDelete: Array<StackToKill | string>
}

function getStackToKill(stack: StackToKill | string): StackToKill {
    if (typeof stack === "string" || stack instanceof String) {
        return {
            stackName: stack as string
        };
    }

    return stack as StackToKill;
}

export class BudgetKillswitch extends Construct {

    topic: Topic;
    budget: CfnBudget;

    constructor(scope: Construct, id: string, props: BudgetKillswitchProps) {
        super(scope, id);

        this.topic = new Topic(this, "BudgetKillswitchTopic", {
            displayName: "Budget Killswitch Triggered",
            topicName: "budget-killswitch-topic"
        });

        this.budget = new CfnBudget(this, "killswitch-trigger", {
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
                        address: this.topic.topicArn
                    }
                ]
            }]
        });

        const lambda = new StackDeleteLambda(this, "stackDeleteLambda", {
            stacksToDelete: props.stacksToDelete.map(getStackToKill),
            triggerTopics: [this.topic]
        });
    }
}