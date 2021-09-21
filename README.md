# Budget Emergency Cutoff

This CDK code provides a construct that uses a Lambda to automatically delete CloudFormation stacks when the account's spending gets too high. This is intended as a way to avoid accidentally incurring huge bills for personal projects, experimental / test setups, and other situations where a complete shutdown is preferable to exceeding a budget.

## Initializer
`BudgetEmergencyCutoff(scope: Construct, id: string, props: BudgetEmergencyCutoffProps)`

#### Parameters
- scope `Construct`
- id `string`
- props `BudgetEmergencyCutoffProps`

## Construct Props
| Name | Type | Description |
| ---- | ---- | ----------- |
| maxDollarsPerMonth | `number` | If the AWS account's total bill for the month reaches this threshold, the cutoff will be triggered. | 
| stacksToDelete | `Array<string>` | The names of the CloudFormation stacks that should be deleted when the cutoff is reached |

## Example Usage
The code below will create a lambda to delete the stack named `test-stack` when $10.00 has been spent.

```
const cutoff = new BudgetEmergencyCutoff(this, "budget-cutoff", {
    maxDollarsPerMonth: 10.00,
    stacksToDelete: ["test-stack"]
})
```