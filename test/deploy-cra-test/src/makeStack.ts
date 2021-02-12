import { makeAutoCertResource } from '@cfnutil/auto-cert';
import {
  LambdaRuntime,
  makeAssetFromPackage,
  makeAwsResource,
  makeLambdaAssumeRolePolicyDocument,
  makeParameters,
  makePolicyDocument,
  makeTemplateBuilderWithOptionalResources,
  PolicyEffect,
  TemplateBuilder,
} from '@cfnutil/core';
import { makeEmptyBucketResource } from '@cfnutil/empty-bucket';
import { makePutObjectResource } from '@cfnutil/put-object';
import { makeRegionalFunctionResource } from '@cfnutil/regional-function';
import { makeUnpackAssetResource } from '@cfnutil/unpack-asset';
import { makeReactAppFactory } from '@cfnutil/web';
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

  const [apiAsset1Builder, apiAsset1] = makeAssetFromPackage(
    `${name}ApiAsset1`,
    '@cfnutil-test/test-api',
    {
      resolveRoot: __dirname,
      name: 'b1',
    },
  );

  const [apiAsset2Builder, apiAsset2] = makeAssetFromPackage(
    `${name}ApiAsset2`,
    '@cfnutil-test/test-api',
    {
      resolveRoot: __dirname,
      name: 'b2',
    },
  );

  const [lambdaRoleBuilder, lambdaRole] = makeAwsResource(
    ResourceType.IAMRole,
    `${name}Role`,
    {
      AssumeRolePolicyDocument: makeLambdaAssumeRolePolicyDocument(),
      ManagedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
    },
  );

  const [lambda1Builder] = makeAwsResource(
    ResourceType.LambdaFunction,
    `${name}ApiLambda1`,
    {
      Code: apiAsset1.ref,
      Role: lambdaRole.ref,
      Handler: 'index.handler',
    },
  );

  const [lambda2Builder] = makeAwsResource(
    ResourceType.LambdaFunction,
    `${name}ApiLambda2`,
    {
      Code: apiAsset2.ref,
      Role: lambdaRole.ref,
      Handler: 'index.handler',
    },
  );

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
    lambdaRoleBuilder,
    apiAsset1Builder,
    lambda1Builder,
    apiAsset2Builder,
    lambda2Builder,
  ]);
}
