import { AutoCertResource } from '@cfnutil/auto-cert';
import {
  ResourceAttributes,
  S3ObjectRef,
  TemplateBuilder,
} from '@cfnutil/core';
import { EmptyBucketResource } from '@cfnutil/empty-bucket';
import { PutObjectResource } from '@cfnutil/put-object';
import { UnpackAssetResource } from '@cfnutil/unpack-asset';
import {
  CloudFrontDistributionAttributes,
  CloudFrontDistributionLambdaFunctionAssociation,
  S3BucketAttributes,
} from '@fmtk/cfntypes';
import { ConfigFile } from './makeContentBucket';
import { makeStaticWebAppFactory } from './makeStaticWebApp';

export interface ReactAppProps {
  CertificateArn?: string;
  Config?: ConfigFile | ConfigFile[];
  DomainName: string;
  EnableIpv6?: boolean;
  HostedZoneId: string;
  LambdaFunctionAssociations?: CloudFrontDistributionLambdaFunctionAssociation[];
  PriceClass?: string;
  Source: S3ObjectRef;
}

export interface ReactAppAttributes {
  Bucket: ResourceAttributes<S3BucketAttributes>;
  CertificateArn: string;
  Distribution: ResourceAttributes<CloudFrontDistributionAttributes>;
}

export interface ReactAppFactory {
  makeResource(
    name: string,
    props: ReactAppProps,
  ): [TemplateBuilder, ReactAppAttributes];
}

export function makeReactAppFactory(dep: {
  autoCert: AutoCertResource;
  emptyBucket: EmptyBucketResource;
  putObject?: PutObjectResource;
  unpackAsset: UnpackAssetResource;
}): ReactAppFactory {
  const factory = makeStaticWebAppFactory(dep);

  return {
    makeResource(
      name: string,
      props: ReactAppProps,
    ): [TemplateBuilder, ReactAppAttributes] {
      return factory.makeResource(name, {
        CustomErrorResponses: [
          // enable client-side routing
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          },
        ],

        DefaultRootObject: 'index.html',

        Metadata: [
          // static stuff never changes (all versioned files); cache forever
          // (1 year is max allowed)
          {
            Glob: 'static/**/*',
            Metadata: { 'cache-control': 'public, max-age=31536000' },
          },
          // root folder stuff doesn't have versioned file names; don't cache
          {
            Glob: '*',
            Metadata: { 'cache-control': 'no-cache, max-age=0' },
          },
        ],

        ...props,
      });
    },
  };
}
