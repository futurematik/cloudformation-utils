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
  ResourceAttributes,
} from '@cfnutil/core';
import { AutoCertProps } from '@cfnutil/auto-cert-lambda';
import { ResourceType } from '@fmtk/cfntypes';

export interface AutoCertAttributes {
  CertificateArn: string;
}

export interface AutoCertResource {
  makeResource(
    name: string,
    props: AutoCertProps,
    options?: ResourceBase,
  ): [TemplateBuilder, ResourceAttributes<AutoCertAttributes>];
}

export function makeAutoCertResource(
  name: string,
): [TemplateBuilder, AutoCertResource] {
  const [codeAssetBuilder, codeAsset] = makeAssetFromPackage(
    `${name}Code`,
    '@cfnutil/auto-cert-lambda',
    __dirname,
  );

  const [roleBuilder, role] = makeIamRole(`${name}Role`, {
    AssumeRolePolicyDocument: makeLambdaAssumeRolePolicyDocument(),
    ManagedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    ],
  });

  role.addStatement(
    makePolicyStatement({
      Action: [
        'acm:RequestCertificate',
        'acm:DescribeCertificate',
        'acm:DeleteCertificate',
      ],
      Effect: PolicyEffect.Allow,
      Resource: '*',
    }),
  );

  role.addStatement(
    makePolicyStatement({
      Action: ['route53:GetChange'],
      Effect: PolicyEffect.Allow,
      Resource: '*',
    }),
  );

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
        props: AutoCertProps,
        options?: ResourceBase,
      ): [TemplateBuilder, ResourceAttributes<AutoCertAttributes>] {
        role.addStatement(
          makePolicyStatement({
            Action: ['route53:changeResourceRecordSets'],
            Effect: PolicyEffect.Allow,
            Resource: [
              awsStr`arn:aws:route53:::hostedzone/${props.HostedZoneId}`,
            ],
          }),
        );

        const [resource, attribs] = makeResource(
          'Custom::AutoCertificate',
          name,
          {
            ServiceToken: handler.out.Arn,
            ...props,
          },
          options,
          ['CertificateArn'],
        );

        return [makeTemplateBuilder([resource]), attribs];
      },
    },
  ];
}
