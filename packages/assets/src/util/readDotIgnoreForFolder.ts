import path from 'path';
import { readDotIgnoreFile } from './readDotIgnoreFile';

export async function readDotIgnoreForFolder(
  dirname: string,
): Promise<string[]> {
  return await readDotIgnoreFile(path.resolve(dirname, '.assetignore'), true);
}
