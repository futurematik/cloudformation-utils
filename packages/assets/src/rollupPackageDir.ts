import fs from 'fs';
import path from 'path';
import { rollupPackage } from './rollupPackage';

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
  const ignorePaths = opts?.ignorePaths || [];
  const installPackages = opts?.installPackages || [];

  const ignoreFilePath = path.resolve(dirname, '.assetignore');
  try {
    const ignoreRules = (
      await fs.promises.readFile(ignoreFilePath, 'utf8')
    ).split('\n');

    ignorePaths.push(...ignoreRules);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

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
  const hash = await rollupPackage({
    inputOptions: rollupConfig.default,
    outputPath: fullOutputPath,
    resolveRoot: opts?.resolveRoot || dirname,
    ignore: ignorePaths,
    installPackages,
    packageInstallImage: opts?.packageInstallImage,
  });

  const pkgPath = path.resolve(dirname, 'package.json');
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));

  pkg.bundle = {
    path: outputPath,
    hash,
  };

  await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}
