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
  awsStr,
} from '@cfnutil/core';
import { UnpackAssetProps } from '@cfnutil/unpack-asset-lambda';
import { ResourceType } from '@fmtk/cfntypes';

export interface UnpackAssetResource {
  makeResource(
    name: string,
    props: UnpackAssetProps,
    options?: ResourceBase,
  ): [TemplateBuilder, ResourceAttributesBase];
}

export function makeUnpackAssetResource(
  name: string,
): [TemplateBuilder, UnpackAssetResource] {
  const [codeAssetBuilder, codeAsset] = makeAssetFromPackage(
    `${name}Code`,
    '@cfnutil/unpack-asset-lambda',
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
        props: UnpackAssetProps,
        options?: ResourceBase,
      ): [TemplateBuilder, ResourceAttributesBase] {
        role.addStatement(
          makePolicyStatement({
            Action: 's3:GetObject*',
            Effect: PolicyEffect.Allow,
            Resource: bucketArn(props.Source.S3Bucket, props.Source.S3Key),
          }),
        );
        role.addStatement(
          makePolicyStatement({
            Action: 's3:PutObject*',
            Effect: PolicyEffect.Allow,
            Resource: bucketArn(
              props.DestinationBucket,
              props.DestinationPrefix
                ? awsStr`${props.DestinationPrefix}/*`
                : '*',
            ),
          }),
        );
        const [resource, attribs] = makeResource(
          'Custom::UnpackAsset',
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
