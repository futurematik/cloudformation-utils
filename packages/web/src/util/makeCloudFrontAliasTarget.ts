import { Route53RecordSetAliasTarget } from '@fmtk/cfntypes';

export const CloudFrontHostedZoneId = 'Z2FDTNDATAQYW2';

export function makeCloudFrontAliasTarget(
  domainName: string,
): Route53RecordSetAliasTarget {
  return {
    HostedZoneId: CloudFrontHostedZoneId,
    DNSName: domainName,
  };
}
