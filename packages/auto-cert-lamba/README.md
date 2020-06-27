# @cfn-util/auto-cert-lambda

CloudFormation custom resource handler to automatically provision a certificate in the given region.

## Resource Properties

```typescript
interface AutoCertProps {
  DomainName: string;
  HostedZoneId: string;
  Region?: string;
  SubjectAlternativeNames?: string[];
}
```
