import { Construct } from "@aws-cdk/core";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { Topic } from "@aws-cdk/aws-sns";
import { SnsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { PolicyStatement } from "@aws-cdk/aws-iam";

export interface StackDeleteLambdaProps {
    stacksToDelete: Array<string>,
    triggerTopics: Array<Topic>,
    lambdaName?: string
}

function arrayCode(arr: Array<string>) {
    return "['" + arr.join("','") + "']"
}

function buildPythonCode(stacksToDelete: Array<string>) {
    const code_start = `import json
import boto3
def lambda_handler(event, context):
    stacks_to_delete = `;

    const deleteStacksCode = arrayCode(stacksToDelete);

    const code_end = `

    client = boto3.client('cloudformation')
    for stack_name in stacks_to_delete:
        client.delete_stack(StackName=stack_name)
        
    
    return {
        'statusCode': 200,
        'body': json.dumps('Stacks Deleted!')
    }`;

    const code = code_start + deleteStacksCode + code_end;

    return code;
}

export class StackDeleteLambda extends Construct {
    constructor(scope: Construct, id: string, props: StackDeleteLambdaProps) {
        super(scope, id);

        const pythonCode = buildPythonCode(props.stacksToDelete);

        const lambdaPolicy = new PolicyStatement();
        lambdaPolicy.addActions(
            "cloudformation:DeleteStack"
        );
        lambdaPolicy.addAllResources();

        const lambda = new Function(this, props.lambdaName ?? "CutoffLambda", {
            code: Code.fromInline(pythonCode),
            handler: "index.lambda_handler",
            runtime: Runtime.PYTHON_3_9,
            initialPolicy: [lambdaPolicy]
        });

        // Set the lambda to be triggered by all the provided SNS topics
        props.triggerTopics.forEach(topic => {
            lambda.addEventSource(new SnsEventSource(topic))
        });
    }
}