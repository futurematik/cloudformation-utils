import path from 'path';
import { addBundleInfoToPackageJson } from '../util/addBundleInfoToPackageJson';
import { readDotIgnoreForFolder } from '../util/readDotIgnoreForFolder';
import { writeStreamToFile } from '../util/writeStreamToFile';
import { makeRollupPackageStream } from './makeRollupPackageStream';

export interface RollupPackageDirOptions {
  bundleName?: string;
  entrypoint?: string;
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
  const outputPath =
    opts?.outputPath || `dist/${opts?.bundleName || 'bundle'}.zip`;
  const fullOutputPath = path.resolve(outputPath);
  const installPackages = opts?.installPackages || [];

  const ignorePaths = opts?.ignorePaths || [];
  ignorePaths.push(...(await readDotIgnoreForFolder(dirname)));

  const rollupConfigPath = opts?.rollupConfigPath || 'rollup.config.js';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let rollupConfig = require(path.resolve(dirname, rollupConfigPath));
  const externals = rollupConfig?.external;

  if (rollupConfig?.__esModule) {
    rollupConfig = rollupConfig.default;
  }

  if (opts?.entrypoint) {
    rollupConfig.input = opts.entrypoint;
  }

  if (
    Array.isArray(externals) &&
    externals.every((x: unknown) => typeof x === 'string')
  ) {
    installPackages.push(...externals);
  }

  const output = await makeRollupPackageStream({
    ignore: ignorePaths,
    inputOptions: rollupConfig,
    installPackages,
    packageInstallImage: opts?.packageInstallImage,
    resolveRoot: opts?.resolveRoot || dirname,
  });

  await writeStreamToFile(fullOutputPath, output, true);

  await addBundleInfoToPackageJson(dirname, {
    name: opts?.bundleName,
    path: outputPath,
  });
}
