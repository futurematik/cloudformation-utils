import fs from 'fs';
import { HashStream } from './util/HashStream';
import { ZipEntry } from './ZipEntry';
import { makeZipPackageStream } from './makeZipPackageStream';

export async function makeZipPackage(
  outputPath: string,
  entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>,
): Promise<string> {
  const outFile = fs.createWriteStream(outputPath);
  const zip = await makeZipPackageStream(entries);
  const hash = new HashStream();
  zip.pipe(hash).pipe(outFile);
  return hash.digestFinal('hex');
}
