import fs from 'fs';
import path from 'path';
import { rollupPackage } from './rollupPackage';
import { addBundleInfoToPackageJson } from './addBundleInfoToPackageJson';
import { readDotIgnore } from './readDotIgnore';

export interface RollupPackageDirOptions {
  ignorePaths?: string[];
  installPackages?: string[];
  outputPath?: string;
  packageInstallImage?: string;
  resolveRoot?: string;
  rollupConfigPath?: string;
  smokeTest?: boolean;
}

export async function rollupPackageDir(
  dirname: string,
  opts?: RollupPackageDirOptions,
): Promise<void> {
  const outputPath = opts?.outputPath || 'dist/bundle.zip';
  const fullOutputPath = path.resolve(outputPath);
  const installPackages = opts?.installPackages || [];

  const ignorePaths = opts?.ignorePaths || [];
  ignorePaths.push(...(await readDotIgnore(dirname)));

  const rollupConfigPath = opts?.rollupConfigPath || 'rollup.config.js';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rollupConfig = require(path.resolve(dirname, rollupConfigPath));

  if (
    Array.isArray(rollupConfig.external) &&
    rollupConfig.external.every((x: unknown) => typeof x === 'string')
  ) {
    installPackages.push(...rollupConfig.external);
  }

  await fs.promises.mkdir(path.dirname(fullOutputPath), { recursive: true });

  await rollupPackage({
    ignore: ignorePaths,
    inputOptions: rollupConfig.default,
    installPackages,
    outputPath: fullOutputPath,
    packageInstallImage: opts?.packageInstallImage,
    resolveRoot: opts?.resolveRoot || dirname,
    smokeTest: opts?.smokeTest,
  });

  await addBundleInfoToPackageJson(dirname, {
    path: outputPath,
  });
}
