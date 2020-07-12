import fs from 'fs';
import path from 'path';

export async function readDotIgnore(dirname: string): Promise<string[]> {
  const ignoreFilePath = path.resolve(dirname, '.assetignore');
  try {
    return (await fs.promises.readFile(ignoreFilePath, 'utf8')).split('\n');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return [];
  }
}
