import { InputOptions } from 'rollup';
import stream from 'stream';
import { getPackageEntries } from '../zip/getPackageEntries';
import { makeZipPackageStream } from '../zip/makeZipPackageStream';
import { ZipEntry } from '../zip/ZipEntry';
import { rollupPackageEntries } from './rollupPackageEntries';

export interface RollupPackageOptions {
  ignore?: string[];
  inputOptions: InputOptions;
  installPackages?: string[];
  packageInstallImage?: string;
  resolveRoot: string;
}

export async function makeRollupPackageStream({
  ignore,
  inputOptions,
  installPackages,
  packageInstallImage,
  resolveRoot = process.cwd(),
}: RollupPackageOptions): Promise<stream.Readable> {
  const entries: ZipEntry[] = [];

  for await (const entry of rollupPackageEntries(inputOptions)) {
    entries.push(entry);
  }
  if (installPackages?.length) {
    const packageFiles = getPackageEntries({
      ignorePaths: ignore,
      packageInstallImage,
      packageNames: installPackages,
      resolveRoot,
    });

    for await (const entry of packageFiles) {
      entries.push(entry);
    }
  }
  return makeZipPackageStream(entries);
}
