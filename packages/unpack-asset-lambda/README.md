# @cfn-util/unpack-asset-lambda

CloudFormation custom resource handler to unpack a zip into a bucket.

## Resource Properties

```typescript
interface UnpackAssetProps {
  DestinationBucket: string;
  DestinationPrefix?: string;
  Metadata?: MetadataGlob[];
  Source: S3ObjectRef;
}

interface S3ObjectRef {
  S3Bucket: string;
  S3Key: string;
  S3ObjectVersion?: string;
}
```
