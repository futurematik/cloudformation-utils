import { properties, text, optional } from '@fmtk/validation';

export interface S3ObjectRef {
  S3Bucket: string;
  S3Key: string;
  S3ObjectVersion?: string;
}

export const validateS3ObjectRef = properties<S3ObjectRef>({
  S3Bucket: text(),
  S3Key: text(),
  S3ObjectVersion: optional(text()),
});
