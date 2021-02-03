import path from 'path';
import { addBundleInfoToPackageJson } from '../util/addBundleInfoToPackageJson';
import { readDotIgnoreForFolder } from '../util/readDotIgnoreForFolder';
import { writeStreamToFile } from '../util/writeStreamToFile';
import { getFolderEntries } from './getFolderEntries';
import { makeZipPackageStream } from './makeZipPackageStream';

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
  ignorePaths.push(
    ...(await readDotIgnoreForFolder(opts?.packagePath || dirname)),
  );

  const zip = await makeZipPackageStream(
    getFolderEntries({ source: dirname, ignore: ignorePaths }),
  );

  await writeStreamToFile(fullOutputPath, zip, true);

  if (opts?.packagePath) {
    await addBundleInfoToPackageJson(opts?.packagePath, {
      path: outputPath,
    });
  }
}
