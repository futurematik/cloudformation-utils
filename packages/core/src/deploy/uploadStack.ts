import fs from 'fs';
import path from 'path';
import S3 from 'aws-sdk/clients/s3';
import { assertValid, ValidationMode, ExtraFieldsMode } from '@fmtk/validation';
import { validateAssetManifest } from './AssetManifest';

export type UploadProgress =
  | {
      bytesUp: number;
      done?: false;
      file: string;
      total: number;
    }
  | { done: true };

export interface UploadProgressReporter {
  (progress: UploadProgress): void;
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
  if (report) {
    report({ done: true });
  }
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
    report({ file: filename, bytesUp: 0, total: stat.size });
  }

  const result = s3.upload({
    Bucket: bucket,
    Key: filename,
    Body: fs.createReadStream(localPath),
  });

  if (report) {
    result.on('httpUploadProgress', (progress) => {
      report({ file: filename, bytesUp: progress.loaded, total: stat.size });
    });
  }

  await result.promise();
}
