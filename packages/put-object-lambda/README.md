# @cfn-util/put-object-lambda

CloudFormation custom resource handler to put an object in a bucket.

## Resource Properties

```typescript
interface PutObjectProps {
  Target: S3ObjectRef;
  Contents?: unknown;
  Metadata?: Metadata;
  Replacements?: TextReplacement[];
  Source?: S3ObjectRef;
}

interface S3ObjectRef {
  S3Bucket: string;
  S3Key: string;
  S3ObjectVersion?: string;
}

interface TextReplacement {
  Regex?: boolean;
  Replace: string;
  Search: string;
}
```
