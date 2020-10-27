import {
  makeAssetFromPackage,
  TemplateBuilder,
  makeParameters,
  makeAwsResource,
  makePolicyDocument,
  PolicyEffect,
  LambdaRuntime,
  makeTemplateBuilderWithOptionalResources,
} from '@cfnutil/core';
import { makeReactAppFactory } from '@cfnutil/web';
import { makeAutoCertResource } from '@cfnutil/auto-cert';
import { makeEmptyBucketResource } from '@cfnutil/empty-bucket';
import { makePutObjectResource } from '@cfnutil/put-object';
import { makeUnpackAssetResource } from '@cfnutil/unpack-asset';
import { makeRegionalFunctionResource } from '@cfnutil/regional-function';
import { ResourceType } from '@fmtk/cfntypes';

export function makeStack(name: string): TemplateBuilder {
  const [autoCertBuilder, autoCert] = makeAutoCertResource(
    `${name}AutoCertResource`,
  );
  const [emptyBucketBuilder, emptyBucket] = makeEmptyBucketResource(
    `${name}EmptyBucketResource`,
  );
  const [putObjectBuilder, putObject] = makePutObjectResource(
    `${name}PutObjectResource`,
  );
  const [
    regionalFunctionBuilder,
    regionalFunction,
  ] = makeRegionalFunctionResource(`${name}RegionalFunctionResource`);
  const [unpackAssetBuilder, unpackAsset] = makeUnpackAssetResource(
    `${name}UnpackAssetResource`,
  );

  const [paramsBuilder, params] = makeParameters({
    DomainName: 'String',
    HostedZoneId: 'String',
  });

  const reactApp = makeReactAppFactory({
    autoCert,
    emptyBucket,
    putObject,
    unpackAsset,
  });

  const [testFuncRoleBuilder, testFuncRole] = makeAwsResource(
    ResourceType.IAMRole,
    `${name}ViewerRequestRole`,
    {
      AssumeRolePolicyDocument: makePolicyDocument({
        Principal: {
          Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
        },
        Action: 'sts:AssumeRole',
        Effect: PolicyEffect.Allow,
      }),
      ManagedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
    },
  );

  const [testFuncBuilder, testFunc] = regionalFunction.makeResource(
    `${name}ViewerRequest`,
    {
      Code: {
        ZipFile: `
exports.handler = (event, context, callback) => {
  callback(null, {
    status: 200,
    body: 'hello world :)'
  });
};`,
      },
      FunctionName: `${name}ViewerRequestFn`,
      Handler: 'index.handler',
      Region: 'us-east-1',
      Role: testFuncRole.out.Arn,
      Runtime: LambdaRuntime.NodeJs_12,
    },
  );

  const [appAssetBuilder, appAsset] = makeAssetFromPackage(
    `${name}AppAsset`,
    '@cfnutil-test/cra-test',
    __dirname,
  );

  const [appBuilder] = reactApp.makeResource(`${name}App`, {
    DomainName: params.DomainName.ref,
    HostedZoneId: params.HostedZoneId.ref,
    Source: appAsset.ref,
    Config: {
      Contents: `window.env={"greeting":"hello, world"}`,
      FileName: 'env.js',
    },
    LambdaFunctionAssociations: [
      {
        EventType: 'viewer-request',
        LambdaFunctionARN: testFunc.out.VersionArn,
      },
    ],
  });

  return makeTemplateBuilderWithOptionalResources([
    autoCertBuilder,
    emptyBucketBuilder,
    putObjectBuilder,
    regionalFunctionBuilder,
    unpackAssetBuilder,
    paramsBuilder,
    testFuncRoleBuilder,
    testFuncBuilder,
    appAssetBuilder,
    appBuilder,
  ]);
}
