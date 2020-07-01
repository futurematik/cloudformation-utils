import {
  makeAssetFromPackage,
  makeTemplateBuilder,
  TemplateBuilder,
  makeParameters,
} from '@cfnutil/core';
import { makeReactAppFactory } from '@cfnutil/web';
import { makeAutoCertResource } from '@cfnutil/auto-cert';
import { makeEmptyBucketResource } from '@cfnutil/empty-bucket';
import { makePutObjectResource } from '@cfnutil/put-object';
import { makeUnpackAssetResource } from '@cfnutil/unpack-asset';

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
  });

  return makeTemplateBuilder([
    autoCertBuilder,
    emptyBucketBuilder,
    putObjectBuilder,
    unpackAssetBuilder,
    paramsBuilder,
    appAssetBuilder,
    appBuilder,
  ]);
}
