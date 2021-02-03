import { AutoCertResource } from '@cfnutil/auto-cert';
import {
  AWS,
  bucketArn,
  Intrinsics,
  makeAwsResource,
  makeCondition,
  makeDomainAlias,
  makePolicyDocument,
  makeTemplateBuilder,
  PolicyEffect,
  ResourceAttributes,
  S3ObjectRef,
  TemplateBuilder,
} from '@cfnutil/core';
import { EmptyBucketResource } from '@cfnutil/empty-bucket';
import { PutObjectResource } from '@cfnutil/put-object';
import { MetadataGlob } from '@cfnutil/runtime';
import { UnpackAssetResource } from '@cfnutil/unpack-asset';
import {
  CloudFrontDistributionAttributes,
  CloudFrontDistributionCustomErrorResponse,
  CloudFrontDistributionLambdaFunctionAssociation,
  ResourceType,
  S3BucketAttributes,
} from '@fmtk/cfntypes';
import { makeCloudFrontAliasTarget } from '../util/makeCloudFrontAliasTarget';
import { makeOaiArn } from '../util/makeOaiArn';
import { ConfigFile, makeContentBucketFactory } from './makeContentBucket';

export interface StaticWebAppProps {
  CertificateArn?: string;
  Config?: ConfigFile | ConfigFile[];
  CustomErrorResponses?: CloudFrontDistributionCustomErrorResponse[];
  DefaultRootObject?: string;
  DomainName: string;
  EnableIpv6?: boolean;
  HostedZoneId: string;
  LambdaFunctionAssociations?: CloudFrontDistributionLambdaFunctionAssociation[];
  Metadata?: MetadataGlob[];
  PriceClass?: string;
  Source: S3ObjectRef;
}

export interface StaticWebAppAttributes {
  Bucket: ResourceAttributes<S3BucketAttributes>;
  CertificateArn: string;
  Distribution: ResourceAttributes<CloudFrontDistributionAttributes>;
}

export interface StaticWebAppFactory {
  makeResource(
    name: string,
    props: StaticWebAppProps,
  ): [TemplateBuilder, StaticWebAppAttributes];
}

export function makeStaticWebAppFactory(dep: {
  autoCert: AutoCertResource;
  emptyBucket: EmptyBucketResource;
  putObject?: PutObjectResource;
  unpackAsset: UnpackAssetResource;
}): StaticWebAppFactory {
  const bucketFactory = makeContentBucketFactory({
    emptyBucket: dep.emptyBucket,
    unpackAsset: dep.unpackAsset,
    putObject: dep.putObject,
  });

  return {
    makeResource(
      name: string,
      props: StaticWebAppProps,
    ): [TemplateBuilder, StaticWebAppAttributes] {
      const [bucketBuilder, bucket] = bucketFactory.makeResource(name, {
        Source: props.Source,
        Config: props.Config,
        Metadata: props.Metadata,
      });

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

      const [certConditionBuilder, certCondition] = makeCondition(
        `${name}ProvisionCert`,
        Intrinsics.equals(props.CertificateArn ?? '', ''),
      );

      const [certificateBuilder, certificate] = dep.autoCert.makeResource(
        `${name}Certificate`,
        {
          DomainName: props.DomainName,
          HostedZoneId: props.HostedZoneId,
          Region: 'us-east-1',
        },
        {
          Condition: certCondition.name,
        },
      );

      const certificateArn = Intrinsics.ifThen(
        certCondition.name,
        certificate.out.CertificateArn,
        props.CertificateArn ?? AWS.NoValue,
      );

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
            CustomErrorResponses: props.CustomErrorResponses,
            DefaultRootObject: props.DefaultRootObject,
            DefaultCacheBehavior: {
              ForwardedValues: {
                QueryString: false,
              },
              LambdaFunctionAssociations: props.LambdaFunctionAssociations,
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
        makeTemplateBuilder([
          bucketBuilder,
          certConditionBuilder,
          certificateBuilder,
          oaiBuilder,
          distributionBuilder,
          bucketPolicyBuilder,
          domainAliasBuilder,
        ]),
        {
          Bucket: bucket,
          CertificateArn: certificateArn as string,
          Distribution: distribution,
        },
      ];
    },
  };
}
