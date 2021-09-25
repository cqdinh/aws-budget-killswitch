import { Construct } from "@aws-cdk/core";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { Topic } from "@aws-cdk/aws-sns";
import { SnsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { Policy, PolicyStatement } from "@aws-cdk/aws-iam";
import { StackToKill } from "./BudgetKillswitch";

export interface StackDeleteLambdaProps {
    stacksToDelete: Array<StackToKill>,
    triggerTopics: Array<Topic>,
    lambdaName?: string
}

// Convert an array into the equivalent python code
function arrayCode(arr: Array<string>) {
    return "['" + arr.join("','") + "']"
}

// Convert an array of StackToKill into a string that is python code for a dictionary
// of the form {region: [stack_1, stack_2, ...]}
function stackDictCode(stacks: Array<StackToKill>) {
    const regions = new Set<string>(stacks.map(stack => stack.region ?? 'DEFAULT'));

    const regionMap = new Map<string, Array<string>>();
    regions.forEach(region => regionMap.set(region, []))
    stacks.forEach(stack => regionMap.get(stack.region ?? 'DEFAULT')?.push(stack.stackName));

    var code = "{";
    regionMap.forEach((stacks, region, map) => {
        code = code + `\n\t\t'${region}': ${arrayCode(stacks)}`
    });

    return code + "\n\t}"
}

function buildPythonCode(stacksToDelete: Array<StackToKill>) {
    const code = `import json
import boto3
boto3.set_stream_logger('boto3.resources', logging.INFO)

def get_client(region):
    if region == 'DEFAULT':
        return boto3.client('cloudformation')

    return boto3.client('cloudformation', region_name=region)

def lambda_handler(event, context):
    stacks_to_delete = ${stackDictCode(stacksToDelete)}

    for region, stacks in stacks_to_delete:
        client = get_client(region)

        for stack_name in stacks:
            client.delete_stack(StackName=stack_name)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Stacks Deleted!')
    }`;

    return code;
}

export class StackDeleteLambda extends Construct {
    lambda: Function;
    lambdaPolicy: PolicyStatement;

    constructor(scope: Construct, id: string, props: StackDeleteLambdaProps) {
        super(scope, id);

        // Generate the python code for the lambda
        const pythonCode = buildPythonCode(props.stacksToDelete);

        // Allow the lambda to delete CloudFormation stacks
        this.lambdaPolicy = new PolicyStatement();
        this.lambdaPolicy.addActions(
            "cloudformation:DeleteStack"
        );
        this.lambdaPolicy.addAllResources();

        // The lambda function that deletes the stacks
        this.lambda = new Function(this, props.lambdaName ?? "CutoffLambda", {
            code: Code.fromInline(pythonCode),
            handler: "index.lambda_handler",
            runtime: Runtime.PYTHON_3_9,
            initialPolicy: [this.lambdaPolicy]
        });

        // Set the lambda to be triggered by all the provided SNS topics
        props.triggerTopics.forEach(topic => {
            this.lambda.addEventSource(new SnsEventSource(topic))
        });
    }
}