import json
import boto3
def lambda_handler(event, context):
    stacks_to_delete = ['wordpress-stack']

    client = boto3.client('cloudformation')
    for stack_name in stacks_to_delete:
        client.delete_stack(StackName=stack_name)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }