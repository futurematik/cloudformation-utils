import fs from 'fs';

export async function tryStat(path: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.stat(path);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return;
    }
    throw err;
  }
}
