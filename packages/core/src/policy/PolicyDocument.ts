import { PolicyStatement } from './PolicyStatement';

export interface PolicyDocument {
  Version?: string;
  Statement: PolicyStatement[];
}

export function makePolicyDocument(
  ...statements: PolicyStatement[]
): PolicyDocument {
  return {
    Version: '2012-10-17',
    Statement: statements,
  };
}
