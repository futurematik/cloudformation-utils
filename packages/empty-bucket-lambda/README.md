# @cfn-util/empty-bucket-lambda

CloudFormation custom resource handler to empty a bucket on a create, update and/or delete of a custom resource.

## Resource Properties

```typescript
interface EmptyBucketProps {
  Bucket: string;
  EmptyOnCreate?: boolean;
  EmptyOnDelete?: boolean;
  EmptyOnUpdate?: boolean;
  Prefix?: string;
}
```
