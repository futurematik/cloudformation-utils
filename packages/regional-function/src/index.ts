import {
  TemplateBuilder,
  ResourceBase,
  makeAwsResource,
  makeIamRole,
  LambdaRuntime,
  makeLambdaAssumeRolePolicyDocument,
  makeTemplateBuilder,
  makePolicyStatement,
  PolicyEffect,
  makeResource,
  makeAssetFromPackage,
  awsStr,
  AWS,
  ResourceAttributes,
  makePolicy,
} from '@cfnutil/core';
import {
  RegionalFunctionProps as BaseProps,
  RegionalFunctionAttributes,
} from '@cfnutil/regional-function-lambda';
import { makeResourceName } from '@cfnutil/runtime';
import { ResourceType } from '@fmtk/cfntypes';

export interface RegionalFunctionProps extends Omit<BaseProps, 'FunctionName'> {
  FunctionName?: string;
}

export interface RegionalFunctionResource {
  makeResource(
    name: string,
    props: RegionalFunctionProps,
    options?: ResourceBase,
  ): [TemplateBuilder, ResourceAttributes<RegionalFunctionAttributes>];
}

export function makeRegionalFunctionResource(
  name: string,
): [TemplateBuilder, RegionalFunctionResource] {
  const [codeAssetBuilder, codeAsset] = makeAssetFromPackage(
    `${name}Code`,
    '@cfnutil/regional-function-lambda',
    __dirname,
  );

  const [roleBuilder, role] = makeIamRole(`${name}Role`, {
    AssumeRolePolicyDocument: makeLambdaAssumeRolePolicyDocument(),
    ManagedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    ],
    Policies: [
      makePolicy(`${name}DeletePolicy`, [
        makePolicyStatement({
          Action: ['lambda:DeleteFunction'],
          Effect: PolicyEffect.Allow,
          Resource: '*', // need all resources so it still works on delete
        }),
      ]),
    ],
  });

  const [handlerBuilder, handler] = makeAwsResource(
    ResourceType.LambdaFunction,
    `${name}Fn`,
    {
      Code: codeAsset.ref,
      Handler: 'index.handler',
      Role: role.out.Arn,
      Runtime: LambdaRuntime.NodeJs_12,
      Timeout: 2 * 60,
    },
  );

  return [
    makeTemplateBuilder([codeAssetBuilder, roleBuilder, handlerBuilder]),

    {
      makeResource(
        name: string,
        props: RegionalFunctionProps,
        options?: ResourceBase,
      ): [TemplateBuilder, ResourceAttributes<RegionalFunctionAttributes>] {
        props = {
          ...props,
          FunctionName: props.FunctionName || makeResourceName(name),
        };
        role.addStatement(
          makePolicyStatement({
            Action: [
              'lambda:CreateFunction',
              'lambda:Get*',
              'lambda:PublishVersion',
              'lambda:UpdateFunction*',
            ],
            Effect: PolicyEffect.Allow,
            Resource: awsStr`arn:${AWS.Partition}:lambda:${props.Region}:${AWS.AccountId}:function:${props.FunctionName}`,
          }),
        );
        role.addStatement(
          makePolicyStatement({
            Action: ['iam:PassRole'],
            Effect: PolicyEffect.Allow,
            Resource: props.Role,
          }),
        );
        const [resource, attribs] = makeResource(
          'Custom::RegionalFunction',
          name,
          {
            ServiceToken: handler.out.Arn,
            ...props,
          },
          options,
          ['Arn', 'Version', 'VersionArn'],
        );
        return [makeTemplateBuilder([resource]), attribs];
      },
    },
  ];
}
