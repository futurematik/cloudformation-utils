import { CloudFormation } from 'aws-sdk';

export interface ChangeSetParameter {
  ParameterValue?: string;
  UsePreviousValue?: boolean;
  ResolvedValue?: string;
}

export interface ChangeSetParameterMap {
  [key: string]: ChangeSetParameter | string;
}

export function convertParameters(
  map: ChangeSetParameterMap,
): CloudFormation.Parameter[] {
  const params: CloudFormation.Parameter[] = [];

  for (const [key, value] of Object.entries(map)) {
    if (typeof value === 'string') {
      params.push({ ParameterKey: key, ParameterValue: value });
    } else {
      params.push({ ParameterKey: key, ...value });
    }
  }

  return params;
}
