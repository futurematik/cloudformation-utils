import { Metadata } from './Metadata';

const headerMap = {
  CacheControl: 'cache-control',
  ContentDisposition: 'content-disposition',
  ContentEncoding: 'content-encoding',
  ContentLanguage: 'content-language',
  ContentType: 'content-type',
};

export interface Headers extends Partial<typeof headerMap> {}

export function splitMetadataHeaders(metadata: Metadata): [Headers, Metadata] {
  const headers: Headers = {};
  const meta: Metadata = {};

  for (const key in metadata) {
    const header = getHeaderName(key);
    if (header) {
      headers[header] = metadata[key];
    } else {
      meta[key] = metadata[key];
    }
  }

  return [headers, meta];
}

function getHeaderName(key: string): keyof Headers | undefined {
  for (const header in headerMap) {
    if (key.toLowerCase() === headerMap[header as keyof Headers]) {
      return header as keyof Headers;
    }
  }
}
