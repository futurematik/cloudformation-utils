import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import { ZipEntry } from './makeZipPackage';

export async function* getFolderEntries(
  folder: string,
  ignorePaths?: string[],
): AsyncIterableIterator<ZipEntry> {
  const work = [path.resolve(folder)];
  const ig = ignore().add(ignorePaths || []);

  while (work.length) {
    const curr = work.pop() as string;

    const entries = await fs.promises.readdir(curr, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(curr, entry.name);

      let archivePath = path.relative(folder, entryPath);
      if (entry.isDirectory()) {
        archivePath += '/';
      }
      if (ig.ignores(archivePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        work.push(entryPath);
      } else if (entry.isFile()) {
        yield {
          archivePath,
          content: () => fs.createReadStream(entryPath),
        };
      }
    }
  }
}
