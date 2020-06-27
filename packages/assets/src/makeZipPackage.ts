import fs from 'fs';
import stream from 'stream';
import archiver from 'archiver';
import { HashStream } from './util/HashStream';

export type EntryContent = stream.Readable | string | Buffer;

export interface ZipEntry {
  archivePath: string;
  content:
    | EntryContent
    | (() => EntryContent)
    | (() => PromiseLike<EntryContent>);
}

export async function makeZipPackage(
  outputPath: string,
  entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>,
): Promise<string> {
  const zip = archiver('zip', { zlib: { level: 9 } });
  const outFile = fs.createWriteStream(outputPath);
  let error: any;

  zip.on('warning', (err) => {
    console.error(`rollupPackage: WARN: `, err);
  });

  zip.on('error', (err) => {
    error = err || new Error(`unknown error occurred`);
  });

  const hash = new HashStream();
  zip.pipe(hash).pipe(outFile);

  for await (const entry of entries) {
    if (error) {
      throw error;
    }

    const content =
      typeof entry.content === 'function'
        ? await entry.content()
        : entry.content;

    zip.append(content, { name: entry.archivePath });
  }

  await zip.finalize();
  return hash.digestFinal('hex');
}
