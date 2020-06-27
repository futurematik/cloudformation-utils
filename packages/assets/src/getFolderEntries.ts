import fs from 'fs';
import path from 'path';
import { ZipEntry } from './makeZipPackage';

export async function* getFolderEntries(
  folder: string,
): AsyncIterableIterator<ZipEntry> {
  const work = [path.resolve(folder)];

  while (work.length) {
    const curr = work.pop() as string;

    const entries = await fs.promises.readdir(curr, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(curr, entry.name);

      if (entry.isDirectory()) {
        work.push(entryPath);
      } else if (entry.isFile()) {
        yield {
          archivePath: path.relative(folder, entryPath),
          content: () => fs.createReadStream(entryPath),
        };
      }
    }
  }
}
