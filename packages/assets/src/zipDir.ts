import fs from 'fs';
import path from 'path';
import { makeZipPackage } from './makeZipPackage';
import { getFolderEntries } from './getFolderEntries';
import { addBundleInfoToPackageJson } from './addBundleInfoToPackageJson';

export interface ZipDirOptions {
  outputPath?: string;
  packagePath?: string;
}

export async function zipDir(
  dirname: string,
  opts?: ZipDirOptions,
): Promise<void> {
  const outputPath = opts?.outputPath || 'dist/bundle.zip';
  const fullOutputPath = path.resolve(outputPath);

  await fs.promises.mkdir(path.dirname(fullOutputPath), { recursive: true });

  const hash = await makeZipPackage(
    fullOutputPath,
    getFolderEntries({ source: dirname }),
  );

  if (opts?.packagePath) {
    await addBundleInfoToPackageJson(opts?.packagePath, {
      path: outputPath,
      hash,
    });
  }
}
