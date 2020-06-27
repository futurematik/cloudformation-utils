import { CloudFormation } from 'aws-sdk';

export async function stackExists(
  name: string,
  cloudFormation = new CloudFormation(),
): Promise<boolean> {
  const { StackSummaries } = await cloudFormation.listStacks({}).promise();

  const stack = StackSummaries?.find(
    (x) =>
      x.StackName === name &&
      !['REVIEW_IN_PROGRESS', 'DELETE_COMPLETE'].includes(x.StackStatus),
  );

  return !!stack;
}
