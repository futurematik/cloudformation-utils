import { InputOptions } from 'rollup';
import { makeZipPackage, ZipEntry } from './makeZipPackage';
import { rollupPackageEntries } from './rollupPackageEntries';
import { packageEntries } from './packageEntries';

export async function rollupPackage(
  outputPath: string,
  inputOptions: InputOptions,
  installPackages?: string[],
  resolveRoot = process.cwd(),
  ignore?: string[],
): Promise<string> {
  const entries: ZipEntry[] = [];

  for await (const entry of rollupPackageEntries(inputOptions)) {
    entries.push(entry);
  }
  if (installPackages?.length) {
    const packageFiles = packageEntries({
      ignorePaths: ignore,
      packageNames: installPackages,
      resolveRoot,
    });

    for await (const entry of packageFiles) {
      entries.push(entry);
    }
  }
  return makeZipPackage(outputPath, entries);
}
