import { CloudFormation } from 'aws-sdk';
import { getStackInfo } from './getStackInfo';

export async function stackExists(
  name: string,
  cloudFormation = new CloudFormation(),
): Promise<boolean> {
  const stack = await getStackInfo(name, cloudFormation);
  return !!stack;
}
