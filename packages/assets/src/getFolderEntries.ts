import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import { ZipEntry } from './makeZipPackage';

export interface FolderEntriesOptions {
  archivePath?: string;
  source: string;
  ignore?: string[];
}

export async function* getFolderEntries({
  archivePath: archiveBasePath = '/',
  source,
  ignore: ignorePaths,
}: FolderEntriesOptions): AsyncIterableIterator<ZipEntry> {
  const work = [path.resolve(source)];
  const ig = ignore().add(ignorePaths || []);

  while (work.length) {
    const curr = work.pop() as string;

    const entries = await fs.promises.readdir(curr, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(curr, entry.name);

      let archivePath = path.relative(source, entryPath);
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
          archivePath: path.join(archiveBasePath, archivePath),
          content: () => fs.createReadStream(entryPath),
        };
      }
    }
  }
}
