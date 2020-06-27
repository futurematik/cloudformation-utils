import {
  makeAwsResource,
  bucketArn,
  makePolicyDocument,
  PolicyEffect,
  makeDomainAlias,
  ItemOrBuilder,
  ResourceAttributes,
  filterFalsey,
  S3ObjectRef,
  TemplateBuilder,
  makeTemplateBuilder,
} from '@cfnutil/core';
import { EmptyBucketResource } from '@cfnutil/empty-bucket';
import { PutObjectResource } from '@cfnutil/put-object';
import { UnpackAssetResource } from '@cfnutil/unpack-asset';
import { AutoCertResource, AutoCertAttributes } from '@cfnutil/auto-cert';
import {
  ResourceType,
  S3BucketAttributes,
  CloudFrontDistributionAttributes,
} from '@fmtk/cfntypes';
import { makeOaiArn } from '../util/makeOaiArn';
import { makeCloudFrontAliasTarget } from '../util/makeCloudFrontAliasTarget';
import { Metadata } from '@cfnutil/runtime';

export interface ConfigFile {
  CacheControl?: string;
  Contents: string;
  ContentType?: string;
  FileName: string;
  Metadata?: Metadata;
}

export interface ReactAppProps {
  CertificateArn?: string;
  Config?: ConfigFile | ConfigFile[];
  DomainName: string;
  EnableIpv6?: boolean;
  HostedZoneId: string;
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
  autoCert?: AutoCertResource;
  emptyBucket: EmptyBucketResource;
  putObject?: PutObjectResource;
  unpackAsset: UnpackAssetResource;
}): ReactAppFactory {
  return {
    makeResource(
      name: string,
      props: ReactAppProps,
    ): [TemplateBuilder, ReactAppAttributes] {
      const [bucketBuilder, bucket] = makeAwsResource(
        ResourceType.S3Bucket,
        `${name}Content`,
        {
          WebsiteConfiguration: {
            IndexDocument: 'index.html',
          },
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
        },
        {
          DependsOn: [emptyBucket.name],
        },
      );

      const [oaiBuilder, oai] = makeAwsResource(
        ResourceType.CloudFrontCloudFrontOriginAccessIdentity,
        `${name}AccessIdentity`,
        {
          CloudFrontOriginAccessIdentityConfig: { Comment: bucket.ref },
        },
      );

      const [bucketPolicyBuilder] = makeAwsResource(
        ResourceType.S3BucketPolicy,
        `${name}BucketPolicy`,
        {
          Bucket: bucket.ref,
          PolicyDocument: makePolicyDocument(
            {
              Action: ['s3:GetObject*'],
              Effect: PolicyEffect.Allow,
              Resource: [bucketArn(bucket.ref, '*')],
              Principal: { CanonicalUser: oai.out.S3CanonicalUserId },
            },
            {
              Action: ['s3:GetBucket*', 's3:ListBucket*'],
              Effect: PolicyEffect.Allow,
              Resource: [bucketArn(bucket.ref)],
              Principal: { CanonicalUser: oai.out.S3CanonicalUserId },
            },
          ),
        },
      );

      let certificateArn = props.CertificateArn;
      let certificateBuilder: ItemOrBuilder | undefined;

      if (!certificateArn) {
        let certificate: ResourceAttributes<AutoCertAttributes>;

        if (!dep.autoCert) {
          throw new Error(`must provide CertificateArn or AutoCertResource`);
        }

        [certificateBuilder, certificate] = dep.autoCert.makeResource(
          `${name}Certificate`,
          {
            DomainName: props.DomainName,
            HostedZoneId: props.HostedZoneId,
            Region: 'us-east-1',
          },
        );
        certificateArn = certificate.out.CertificateArn;
      }

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

      const [distributionBuilder, distribution] = makeAwsResource(
        ResourceType.CloudFrontDistribution,
        `${name}CloudFrontDistribution`,
        {
          DistributionConfig: {
            Aliases: [props.DomainName],
            Enabled: true,
            IPV6Enabled: props.EnableIpv6,
            Origins: [
              {
                DomainName: bucket.out.RegionalDomainName,
                Id: 'S3Origin',
                S3OriginConfig: {
                  OriginAccessIdentity: makeOaiArn(oai.ref),
                },
              },
            ],
            PriceClass: props.PriceClass || 'PriceClass_100',
            CustomErrorResponses: [
              {
                ErrorCode: 404,
                ResponseCode: 200,
                ResponsePagePath: '/index.html',
              },
            ],
            DefaultRootObject: 'index.html',
            DefaultCacheBehavior: {
              ForwardedValues: {
                QueryString: false,
              },
              TargetOriginId: 'S3Origin',
              ViewerProtocolPolicy: 'redirect-to-https',
            },
            ViewerCertificate: {
              AcmCertificateArn: certificateArn,
              SslSupportMethod: 'sni-only',
            },
          },
        },
      );

      const [domainAliasBuilder] = makeDomainAlias(`${name}Alias`, {
        Target: makeCloudFrontAliasTarget(distribution.out.DomainName),
        HostedZoneId: props.HostedZoneId,
        Name: props.DomainName,
        EnableIpv6: props.EnableIpv6,
      });

      return [
        makeTemplateBuilder(
          filterFalsey([
            bucketBuilder,
            certificateBuilder,
            emptyBucketBuilder,
            unpackAssetBuilder,
            ...configBuilders,
            oaiBuilder,
            distributionBuilder,
            bucketPolicyBuilder,
            domainAliasBuilder,
          ]),
        ),
        {
          Bucket: bucket,
          CertificateArn: certificateArn as string,
          Distribution: distribution,
        },
      ];
    },
  };
}
