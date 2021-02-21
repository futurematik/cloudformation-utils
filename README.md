# CloudFormation Utils

_Documentation is a work in progress!_

A toolkit for generating CloudFormation templates programmatically.

It is designed to be as close as possible to the raw cloudformation while vastly improving the maintainability and composability of deployments.

## Example

```typescript
const [lambdaRoleBuilder, lambdaRole] = makeAwsResource(
  ResourceType.IAMRole,
  `ApiLambdaRole`,
  {
    AssumeRolePolicyDocument: makePolicyDocument({
      Principal: { Service: 'lambda.amazonaws.com' },
      Action: 'sts:AssumeRole',
      Effect: PolicyEffect.Allow,
    }),
    ManagedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    ],
  },
);

const [lambdaBuilder] = makeAwsResource(
  ResourceType.LambdaFunction,
  `ApiLambda`,
  {
    Code: apiAsset.ref,
    Role: lambdaRole.ref,
    Handler: 'index.handler',
  },
);
```
