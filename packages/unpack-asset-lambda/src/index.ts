import fs from 'fs';
import path from 'path';
import S3 from 'aws-sdk/clients/s3';
import {
  makeHandler,
  ResourceResponse,
  MetadataGlob,
  S3ObjectRef,
  validateMetadataGlob,
  validateS3ObjectRef,
  matchMetadata,
  splitMetadataHeaders,
  resourceProps,
  writeLog,
} from '@cfnutil/runtime';
import { properties, text, optional, array } from '@fmtk/validation';
import { openZip } from 'unzip-iterable';
import { lookup as mime } from 'mime-types';

export interface UnpackAssetProps {
  DestinationBucket: string;
  DestinationPrefix?: string;
  Metadata?: MetadataGlob[];
  Source: S3ObjectRef;
}

export const validateUnpackAssetProps = properties<UnpackAssetProps>({
  DestinationBucket: text(),
  DestinationPrefix: optional(text()),
  Metadata: optional(array(validateMetadataGlob)),
  Source: validateS3ObjectRef,
});

export const handler = makeHandler(
  async (event): Promise<ResourceResponse> => {
    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      const props = resourceProps(
        validateUnpackAssetProps,
        event.ResourceProperties,
      );

      await unpack(props);
    }

    return { Status: 'SUCCESS' };
  },
);

async function unpack(props: UnpackAssetProps): Promise<void> {
  writeLog(`unpack`, props);

  const s3 = new S3();
  const metadata = props.Metadata || [];

  const filePath = '/tmp/source.zip';
  const file = fs.createWriteStream(filePath);

  writeLog(`downloading asset`);

  const objStream = s3
    .getObject({
      Bucket: props.Source.S3Bucket,
      Key: props.Source.S3Key,
      VersionId: props.Source.S3ObjectVersion,
    })
    .createReadStream();

  const done = new Promise((resolve) => file.once('finish', resolve));
  objStream.pipe(file);
  await done;

  writeLog(`asset downloaded to ${filePath}`);
  const zip = openZip(filePath);

  for await (const entry of zip) {
    if (entry.info.fileName.endsWith('/')) {
      continue;
    }
    const [headers, meta] = splitMetadataHeaders(
      matchMetadata(metadata, entry.info.fileName),
    );

    const destPath = path.join(
      props.DestinationPrefix || '',
      entry.info.fileName,
    );

    const objectInfo = {
      Bucket: props.DestinationBucket,
      Key: destPath,
      ...headers,
      Metadata: meta,
      ContentType:
        headers.ContentType ||
        mime(entry.info.fileName) ||
        'application/octet-stream',
    };

    writeLog(`uploading ${objectInfo.Key}`, objectInfo);

    await s3
      .upload({
        Body: await entry.open(),
        ...objectInfo,
      })
      .promise();
  }
}
