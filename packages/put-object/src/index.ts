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
import { PutObjectProps } from '@cfnutil/put-object-lambda';
import { ResourceType } from '@fmtk/cfntypes';

export interface PutObjectResource {
  makeResource(
    name: string,
    props: PutObjectProps,
    options?: ResourceBase,
  ): [TemplateBuilder, ResourceAttributesBase];
}

export function makePutObjectResource(
  name: string,
): [TemplateBuilder, PutObjectResource] {
  const [codeAssetBuilder, codeAsset] = makeAssetFromPackage(
    `${name}Code`,
    '@cfnutil/put-object-lambda',
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
        props: PutObjectProps,
        options?: ResourceBase,
      ): [TemplateBuilder, ResourceAttributesBase] {
        if (props.Source) {
          role.addStatement(
            makePolicyStatement({
              Action: 's3:GetObject*',
              Effect: PolicyEffect.Allow,
              Resource: bucketArn(props.Source.S3Bucket, props.Source.S3Key),
            }),
          );
        }
        role.addStatement(
          makePolicyStatement({
            Action: 's3:PutObject*',
            Effect: PolicyEffect.Allow,
            Resource: bucketArn(props.Target.S3Bucket, props.Target.S3Key),
          }),
        );
        const [resource, attribs] = makeResource(
          'Custom::PutObject',
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
