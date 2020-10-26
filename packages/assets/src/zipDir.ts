import fs from 'fs';
import path from 'path';
import { makeZipPackage } from './makeZipPackage';
import { getFolderEntries } from './getFolderEntries';
import { addBundleInfoToPackageJson } from './addBundleInfoToPackageJson';
import { readDotIgnore } from './readDotIgnore';

export interface ZipDirOptions {
  ignorePaths?: string[];
  outputPath?: string;
  packagePath?: string;
}

export async function zipDir(
  dirname: string,
  opts?: ZipDirOptions,
): Promise<void> {
  const outputPath = opts?.outputPath || 'dist/bundle.zip';
  const fullOutputPath = path.resolve(outputPath);

  const ignorePaths = opts?.ignorePaths || [];
  ignorePaths.push(...(await readDotIgnore(opts?.packagePath || dirname)));

  await fs.promises.mkdir(path.dirname(fullOutputPath), { recursive: true });

  await makeZipPackage(
    fullOutputPath,
    getFolderEntries({ source: dirname, ignore: ignorePaths }),
  );

  if (opts?.packagePath) {
    await addBundleInfoToPackageJson(opts?.packagePath, {
      path: outputPath,
    });
  }
}
