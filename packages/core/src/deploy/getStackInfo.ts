import { CloudFormation } from 'aws-sdk';

export async function getStackInfo(
  name: string,
  cloudFormation = new CloudFormation(),
): Promise<CloudFormation.Stack | undefined> {
  const result = await cloudFormation
    .describeStacks({
      StackName: name,
    })
    .promise();
  return result.Stacks && result.Stacks[0];
}
