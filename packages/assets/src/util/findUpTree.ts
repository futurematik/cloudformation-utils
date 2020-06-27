import path from 'path';
import fs from 'fs';

export async function findUpTree(
  childPath: string,
  from = process.cwd(),
): Promise<string | undefined> {
  for (let dir = from; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const search = path.join(dir, childPath);

    try {
      const stat = await fs.promises.stat(search);
      if ((childPath.endsWith('/') && stat.isDirectory()) || stat.isFile()) {
        return search;
      }
    } catch (err) {}
  }
}
