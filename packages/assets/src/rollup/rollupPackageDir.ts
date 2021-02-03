import path from 'path';
import { addBundleInfoToPackageJson } from '../util/addBundleInfoToPackageJson';
import { readDotIgnoreForFolder } from '../util/readDotIgnoreForFolder';
import { writeStreamToFile } from '../util/writeStreamToFile';
import { makeRollupPackageStream } from './makeRollupPackageStream';

export interface RollupPackageDirOptions {
  ignorePaths?: string[];
  installPackages?: string[];
  outputPath?: string;
  packageInstallImage?: string;
  resolveRoot?: string;
  rollupConfigPath?: string;
}

export async function rollupPackageDir(
  dirname: string,
  opts?: RollupPackageDirOptions,
): Promise<void> {
  const outputPath = opts?.outputPath || 'dist/bundle.zip';
  const fullOutputPath = path.resolve(outputPath);
  const installPackages = opts?.installPackages || [];

  const ignorePaths = opts?.ignorePaths || [];
  ignorePaths.push(...(await readDotIgnoreForFolder(dirname)));

  const rollupConfigPath = opts?.rollupConfigPath || 'rollup.config.js';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rollupConfig = require(path.resolve(dirname, rollupConfigPath));

  if (
    Array.isArray(rollupConfig.external) &&
    rollupConfig.external.every((x: unknown) => typeof x === 'string')
  ) {
    installPackages.push(...rollupConfig.external);
  }

  const output = await makeRollupPackageStream({
    ignore: ignorePaths,
    inputOptions: rollupConfig.default,
    installPackages,
    packageInstallImage: opts?.packageInstallImage,
    resolveRoot: opts?.resolveRoot || dirname,
  });

  await writeStreamToFile(fullOutputPath, output, true);

  await addBundleInfoToPackageJson(dirname, {
    path: outputPath,
  });
}
