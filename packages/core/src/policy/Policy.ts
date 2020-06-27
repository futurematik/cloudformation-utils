import { PolicyDocument, makePolicyDocument } from './PolicyDocument';
import { PolicyStatement } from './PolicyStatement';

export interface Policy {
  PolicyName: string;
  PolicyDocument: PolicyDocument;
}

export function makePolicy(
  name: string,
  statements: PolicyStatement[],
): Policy {
  return {
    PolicyName: name,
    PolicyDocument: makePolicyDocument(...statements),
  };
}
