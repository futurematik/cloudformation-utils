import { awsStr } from '@cfnutil/core';

export function makeOaiArn(name: string): string {
  return awsStr`origin-access-identity/cloudfront/${name}`;
}
