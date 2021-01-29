import {
  ItemOrBuilder,
  makeAwsResource,
  makeTemplateBuilder,
  ResourceAttributes,
  S3ObjectRef,
  TemplateBuilder,
} from '@cfnutil/core';
import { EmptyBucketResource } from '@cfnutil/empty-bucket';
import { PutObjectResource } from '@cfnutil/put-object';
import { Metadata, MetadataGlob } from '@cfnutil/runtime';
import { UnpackAssetResource } from '@cfnutil/unpack-asset';
import {
  ResourceType,
  S3BucketAttributes,
  S3BucketWebsiteConfiguration,
} from '@fmtk/cfntypes';

export interface ConfigFile {
  CacheControl?: string;
  Contents: string;
  ContentType?: string;
  FileName: string;
  Metadata?: Metadata;
}

export interface ContentBucketProps {
  Config?: ConfigFile | ConfigFile[];
  Metadata?: MetadataGlob[];
  Source: S3ObjectRef;
  WebsiteConfiguration?: S3BucketWebsiteConfiguration;
}

export interface ContentBucketFactory {
  makeResource(
    name: string,
    props: ContentBucketProps,
  ): [TemplateBuilder, ResourceAttributes<S3BucketAttributes>];
}

export function makeContentBucketFactory(dep: {
  emptyBucket: EmptyBucketResource;
  putObject?: PutObjectResource;
  unpackAsset: UnpackAssetResource;
}): ContentBucketFactory {
  return {
    makeResource(
      name: string,
      props: ContentBucketProps,
    ): [TemplateBuilder, ResourceAttributes<S3BucketAttributes>] {
      const [bucketBuilder, bucket] = makeAwsResource(
        ResourceType.S3Bucket,
        `${name}Content`,
        {
          WebsiteConfiguration: props.WebsiteConfiguration,
        },
      );

      const [emptyBucketBuilder, emptyBucket] = dep.emptyBucket.makeResource(
        `${name}Empty`,
        {
          Bucket: bucket.ref,
          EmptyOnDelete: true,
        },
      );

      const [unpackAssetBuilder, unpackAsset] = dep.unpackAsset.makeResource(
        `${name}UnpackAssets`,
        {
          DestinationBucket: bucket.ref,
          Source: props.Source,
          Metadata: props.Metadata,
        },
        {
          DependsOn: [emptyBucket.name],
        },
      );

      const configBuilders: ItemOrBuilder[] = [];

      if (props.Config) {
        if (!dep.putObject) {
          throw new Error(`Config specified without PutObjectResource`);
        }

        const configs = Array.isArray(props.Config)
          ? props.Config
          : [props.Config];

        for (let i = 0; i < configs.length; ++i) {
          const config = configs[i];

          const meta: Metadata = {
            'cache-control': config.CacheControl || 'no-cache, max-age=0',
          };
          if (config.ContentType) {
            meta['content-type'] = config.ContentType;
          }

          const [builder] = dep.putObject.makeResource(
            `${name}Config${i}`,
            {
              Contents: config.Contents,
              Metadata: {
                ...meta,
                ...config.Metadata,
              },
              Target: {
                S3Bucket: bucket.ref,
                S3Key: config.FileName,
              },
            },
            {
              DependsOn: [emptyBucket.name, unpackAsset.name],
            },
          );
          configBuilders.push(builder);
        }
      }

      return [
        makeTemplateBuilder([
          bucketBuilder,
          emptyBucketBuilder,
          unpackAssetBuilder,
          ...configBuilders,
        ]),
        bucket,
      ];
    },
  };
}
