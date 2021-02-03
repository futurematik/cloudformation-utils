import fs from 'fs';

export async function readDotIgnoreFile(
  filename: string,
  ignoreMissing = false,
): Promise<string[]> {
  try {
    return (await fs.promises.readFile(filename, 'utf8')).split('\n');
  } catch (err) {
    if (!ignoreMissing || err.code !== 'ENOENT') {
      throw err;
    }
    return [];
  }
}
