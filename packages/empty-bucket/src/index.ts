import {
  TemplateBuilder,
  ResourceBase,
  ResourceAttributesBase,
  makeAwsResource,
  makeIamRole,
  LambdaRuntime,
  makeLambdaAssumeRolePolicyDocument,
  makeTemplateBuilder,
  makePolicyStatement,
  PolicyEffect,
  bucketArn,
  makeResource,
  makeAssetFromPackage,
} from '@cfnutil/core';
import { EmptyBucketProps } from '@cfnutil/empty-bucket-lambda';
import { ResourceType } from '@fmtk/cfntypes';

export interface EmptyBucketResource {
  makeResource(
    name: string,
    props: EmptyBucketProps,
    options?: ResourceBase,
  ): [TemplateBuilder, ResourceAttributesBase];
}

export function makeEmptyBucketResource(
  name: string,
): [TemplateBuilder, EmptyBucketResource] {
  const [codeAssetBuilder, codeAsset] = makeAssetFromPackage(
    `${name}Code`,
    '@cfnutil/empty-bucket-lambda',
    __dirname,
  );

  const [roleBuilder, role] = makeIamRole(`${name}Role`, {
    AssumeRolePolicyDocument: makeLambdaAssumeRolePolicyDocument(),
    ManagedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
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
      Timeout: 10 * 60,
    },
  );

  return [
    makeTemplateBuilder([codeAssetBuilder, roleBuilder, handlerBuilder]),

    {
      makeResource(
        name: string,
        props: EmptyBucketProps,
        options?: ResourceBase,
      ): [TemplateBuilder, ResourceAttributesBase] {
        role.addStatement(
          makePolicyStatement({
            Action: 's3:ListBucket*',
            Effect: PolicyEffect.Allow,
            Resource: bucketArn(props.Bucket),
          }),
        );
        role.addStatement(
          makePolicyStatement({
            Action: 's3:DeleteObject*',
            Effect: PolicyEffect.Allow,
            Resource: bucketArn(props.Bucket, '*'),
          }),
        );
        const [resource, attribs] = makeResource(
          'Custom::EmptyBucket',
          name,
          {
            ServiceToken: handler.out.Arn,
            ...props,
          },
          options,
        );
        return [makeTemplateBuilder([resource]), attribs];
      },
    },
  ];
}
