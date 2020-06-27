import fs from 'fs';
import path from 'path';
import { rollupPackage } from './rollupPackage';

export interface RollupPackageDirOptions {
  outputPath?: string;
  rollupConfigPath?: string;
}

export async function rollupPackageDir(
  dirname: string,
  opts?: RollupPackageDirOptions,
): Promise<void> {
  const outputPath = opts?.outputPath || 'dist/bundle.zip';
  const fullOutputPath = path.resolve(outputPath);

  const rollupConfigPath = opts?.rollupConfigPath || 'rollup.config.js';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rollupConfig = require(path.resolve(dirname, rollupConfigPath)).default;

  await fs.promises.mkdir(path.dirname(fullOutputPath), { recursive: true });
  const hash = await rollupPackage(fullOutputPath, rollupConfig);

  const pkgPath = path.resolve(dirname, 'package.json');
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));

  pkg.bundle = {
    path: outputPath,
    hash,
  };

  await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}
