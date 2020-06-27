import fs from 'fs';
import path from 'path';
import S3 from 'aws-sdk/clients/s3';
import { assertValid, ValidationMode, ExtraFieldsMode } from '@fmtk/validation';
import { validateAssetManifest } from './AssetManifest';

export interface UploadProgressReporter {
  (file: string, bytesUp: number, totalBytes: number): void;
}

export async function uploadStack(
  manifestPath: string,
  bucket: string,
  report?: UploadProgressReporter,
): Promise<void> {
  const manifestDir = path.dirname(manifestPath);

  const manifest = assertValid(
    JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8')),
    validateAssetManifest,
    {
      mode: ValidationMode.JSON,
      extraFields: ExtraFieldsMode.Ignore,
    },
  );

  const templatePath = path.resolve(manifestDir, manifest.template);
  const s3 = new S3();

  await Promise.all([
    uploadFile(manifestPath, bucket, s3, report),
    uploadFile(templatePath, bucket, s3, report),
    ...Object.values(manifest.assets).map((x) =>
      uploadFile(path.resolve(manifestDir, x), bucket, s3, report),
    ),
  ]);
}

async function uploadFile(
  localPath: string,
  bucket: string,
  s3: S3,
  report?: UploadProgressReporter,
): Promise<void> {
  const filename = path.basename(localPath);
  const stat = await fs.promises.stat(localPath);

  if (report) {
    report(filename, 0, stat.size);
  }

  const result = s3.upload({
    Bucket: bucket,
    Key: filename,
    Body: fs.createReadStream(localPath),
  });

  if (report) {
    result.on('httpUploadProgress', (progress) => {
      report(filename, progress.loaded, stat.size);
    });
  }

  await result.promise();
}
