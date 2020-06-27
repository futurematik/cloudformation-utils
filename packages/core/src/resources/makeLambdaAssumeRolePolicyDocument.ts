import { makePolicyDocument, PolicyDocument } from '../policy/PolicyDocument';
import { PolicyEffect } from '../policy/PolicyStatement';

export function makeLambdaAssumeRolePolicyDocument(): PolicyDocument {
  return makePolicyDocument({
    Principal: { Service: 'lambda.amazonaws.com' },
    Action: 'sts:AssumeRole',
    Effect: PolicyEffect.Allow,
  });
}
