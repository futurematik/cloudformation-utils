import S3 from 'aws-sdk/clients/s3';
import { makeHandler, ResourceResponse, resourceProps } from '@cfnutil/runtime';
import { properties, text, optional, bool } from '@fmtk/validation';

export interface EmptyBucketProps {
  Bucket: string;
  EmptyOnCreate?: boolean;
  EmptyOnDelete?: boolean;
  EmptyOnUpdate?: boolean;
  Prefix?: string;
}

export const validateEmptyBucketProps = properties<EmptyBucketProps>({
  Bucket: text(),
  EmptyOnCreate: optional(bool()),
  EmptyOnDelete: optional(bool()),
  EmptyOnUpdate: optional(bool()),
  Prefix: optional(text()),
});

export const handler = makeHandler(
  async (event): Promise<ResourceResponse> => {
    const params = resourceProps(
      validateEmptyBucketProps,
      event.ResourceProperties,
    );

    switch (event.RequestType) {
      case 'Create':
        if (params.EmptyOnCreate) {
          await empty(params.Bucket, params.Prefix);
        }
        break;

      case 'Delete':
        if (params.EmptyOnDelete) {
          await empty(params.Bucket, params.Prefix);
        }
        break;

      case 'Update':
        if (params.EmptyOnUpdate) {
          await empty(params.Bucket, params.Prefix);
        }
        break;
    }

    return {
      Status: 'SUCCESS',
    };
  },
);

async function empty(bucket: string, prefix?: string): Promise<void> {
  const s3 = new S3();
  console.log(`empyting bucket ${bucket} (prefix='${prefix || ''}')`);

  for (;;) {
    const objects = await s3
      .listObjectsV2({ Bucket: bucket, Prefix: prefix })
      .promise();

    if (!objects.Contents || !objects.Contents.length) {
      console.log(`nothing more to delete`);
      break;
    }

    const ids = objects.Contents.reduce(
      (a, { Key }) => (Key ? [...a, { Key }] : a),
      [] as S3.ObjectIdentifier[],
    );

    console.log(`deleting ids`, ids);

    await s3
      .deleteObjects({
        Bucket: bucket,
        Delete: {
          Objects: objects.Contents.reduce(
            (a, { Key }) => (Key ? [...a, { Key }] : a),
            [] as S3.ObjectIdentifier[],
          ),
        },
      })
      .promise();
  }
}
