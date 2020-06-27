import {
  makeAssetFromPackage,
  makeTemplateBuilder,
  TemplateBuilder,
} from '@cfnutil/core';
import { makeReactAppFactory } from '@cfnutil/web';
import { makeAutoCertResource } from '@cfnutil/auto-cert';
import { makeEmptyBucketResource } from '@cfnutil/empty-bucket';
import { makePutObjectResource } from '@cfnutil/put-object';
import { makeUnpackAssetResource } from '@cfnutil/unpack-asset';

export interface StackProps {
  DomainName: string;
  HostedZoneId: string;
}

export function makeStack(name: string, props: StackProps): TemplateBuilder {
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
    ...props,
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
    appAssetBuilder,
    appBuilder,
  ]);
}
