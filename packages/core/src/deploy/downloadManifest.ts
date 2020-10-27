import { AssetManifest, validateAssetManifest } from './AssetManifest';
import { S3 } from 'aws-sdk';
import { assertValid, ValidationMode, ExtraFieldsMode } from '@fmtk/validation';

export async function downloadManifest(
  bucket: string,
  key: string,
  region?: string,
): Promise<AssetManifest> {
  const s3 = new S3({ region });

  const stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return assertValid(
    JSON.parse(Buffer.concat(chunks).toString('utf-8')),
    validateAssetManifest,
    { mode: ValidationMode.String, extraFields: ExtraFieldsMode.Ignore },
  );
}
