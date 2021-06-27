import { makeZipPackageStream } from './makeZipPackageStream';
import { writeStreamToFile } from './util/writeStreamToFile';
import { ZipEntry } from './ZipEntry';

export async function makeZipPackage(
  outputPath: string,
  entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>,
): Promise<void> {
  const zip = await makeZipPackageStream(entries);
  await writeStreamToFile(outputPath, zip);
}
