import { awsStr } from './awsStr';
import { IntrinsicValue } from './Intrinsics';

export function bucketArn(bucketName: string, path?: string): IntrinsicValue {
  if (path) {
    return awsStr`arn:aws:s3:::${bucketName}/${path}`;
  } else {
    return awsStr`arn:aws:s3:::${bucketName}`;
  }
}
