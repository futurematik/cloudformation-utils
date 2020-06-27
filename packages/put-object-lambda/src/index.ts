import S3 from 'aws-sdk/clients/s3';
import {
  makeHandler,
  ResourceResponse,
  S3ObjectRef,
  Metadata,
  validateS3ObjectRef,
  validateMetadata,
  splitMetadataHeaders,
  resourceProps,
} from '@cfnutil/runtime';
import { properties, text, optional, bool, array, any } from '@fmtk/validation';
import { lookup as mime } from 'mime-types';

export interface TextReplacement {
  Regex?: boolean;
  Replace: string;
  Search: string;
}

export interface PutObjectProps {
  Target: S3ObjectRef;
  Contents?: unknown;
  Metadata?: Metadata;
  Replacements?: TextReplacement[];
  Source?: S3ObjectRef;
}

export const validateTextReplacement = properties<TextReplacement>({
  Regex: optional(bool()),
  Replace: text(),
  Search: text(),
});

export const validatePutObjectProps = properties<PutObjectProps>({
  Target: validateS3ObjectRef,
  Contents: optional(any()),
  Metadata: optional(validateMetadata),
  Replacements: optional(array(validateTextReplacement)),
  Source: optional(validateS3ObjectRef),
});

export const handler = makeHandler(
  async (event): Promise<ResourceResponse> => {
    const params = resourceProps(
      validatePutObjectProps,
      event.ResourceProperties,
    );

    switch (event.RequestType) {
      case 'Create':
      case 'Update':
        return put(params);
    }

    return {
      Status: 'SUCCESS',
    };
  },
);

async function put(props: PutObjectProps): Promise<ResourceResponse> {
  let data: string | Buffer;
  const [headers, metadata] = splitMetadataHeaders(props.Metadata || {});

  console.log(`put`, props);
  const s3 = new S3();

  if (props.Source) {
    const objStream = s3
      .getObject({
        Bucket: props.Source.S3Bucket,
        Key: props.Source.S3Key,
        VersionId: props.Source.S3ObjectVersion,
      })
      .createReadStream();

    const chunks: Buffer[] = [];

    for await (const chunk of objStream) {
      chunks.push(chunk);
    }

    data = Buffer.concat(chunks);

    if (!headers.ContentType) {
      headers.ContentType =
        mime(props.Target.S3Key) || 'application/octet-stream';
    }
  } else {
    let contentType: string;

    if (!props.Contents) {
      data = '';
      contentType = 'application/octet-stream';
    } else if (typeof props.Contents === 'string') {
      data = props.Contents;
      contentType = 'text/plain';
    } else if (Buffer.isBuffer(props.Contents)) {
      data = props.Contents;
      contentType = 'application/octet-stream';
    } else {
      data = JSON.stringify(props.Contents);
      contentType = 'application/json';
    }

    if (!headers.ContentType) {
      headers.ContentType = mime(props.Target.S3Key) || contentType;
    }
  }

  if (props.Replacements) {
    let dataStr = data.toString();

    for (const r of props.Replacements) {
      const search = new RegExp(
        r.Regex ? r.Search : escapeRegExp(r.Search),
        'g',
      );
      dataStr = dataStr.replace(search, r.Replace);
    }

    data = dataStr;
  }

  const s3Request = {
    Body: data,
    Bucket: props.Target.S3Bucket,
    Key: props.Target.S3Key,
    Metadata: metadata,
    ...headers,
  };

  console.log(`S3 Request`, s3Request);

  await s3.putObject(s3Request).promise();

  return {
    Status: 'SUCCESS',
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}
