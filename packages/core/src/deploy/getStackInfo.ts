import { CloudFormation } from 'aws-sdk';

export async function getStackInfo(
  name: string,
  cloudFormation = new CloudFormation(),
): Promise<CloudFormation.Stack | undefined> {
  const stacks = await getAllStacks(cloudFormation);
  return stacks.find((x) => x.StackName === name);
}

export async function getAllStacks(
  cloudFormation = new CloudFormation(),
): Promise<CloudFormation.Stack[]> {
  let nextToken: string | undefined;
  const stacks: CloudFormation.Stack[] = [];
  do {
    const result = await cloudFormation
      .describeStacks({
        NextToken: nextToken,
      })
      .promise();

    if (result.Stacks) {
      stacks.push(...result.Stacks);
    }
    nextToken = result.NextToken;
  } while (nextToken);

  return stacks.filter(
    (stack) =>
      !['REVIEW_IN_PROGRESS', 'DELETE_COMPLETE'].includes(stack.StackStatus),
  );
}
