import { InputOptions } from 'rollup';
import { makeZipPackage, ZipEntry } from './makeZipPackage';
import { rollupPackageEntries } from './rollupPackageEntries';
import { packageEntries } from './packageEntries';

export interface RollupPackageOptions {
  ignore?: string[];
  inputOptions: InputOptions;
  installPackages?: string[];
  outputPath: string;
  packageInstallImage?: string;
  resolveRoot: string;
}

export async function rollupPackage({
  ignore,
  inputOptions,
  installPackages,
  outputPath,
  packageInstallImage,
  resolveRoot = process.cwd(),
}: RollupPackageOptions): Promise<string> {
  const entries: ZipEntry[] = [];

  for await (const entry of rollupPackageEntries(inputOptions)) {
    entries.push(entry);
  }
  if (installPackages?.length) {
    const packageFiles = packageEntries({
      ignorePaths: ignore,
      packageInstallImage,
      packageNames: installPackages,
      resolveRoot,
    });

    for await (const entry of packageFiles) {
      entries.push(entry);
    }
  }
  return makeZipPackage(outputPath, entries);
}
