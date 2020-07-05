import stream from 'stream';
import archiver from 'archiver';
import { ZipEntry } from './ZipEntry';

export async function makeZipPackageStream(
  entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>,
): Promise<stream.Readable> {
  const zip = archiver('zip', { zlib: { level: 9 } });
  let error: any;

  zip.on('warning', (err) => {
    console.error(`rollupPackage: WARN: `, err);
  });

  zip.on('error', (err) => {
    error = err || new Error(`unknown error occurred`);
  });

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
  return zip;
}
