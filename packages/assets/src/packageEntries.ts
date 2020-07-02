import path from 'path';
import { ZipEntry } from './makeZipPackage';
import { resolvePackageInfo, PackageInfo } from './util/resolvePackageInfo';
import { getFolderEntries } from './getFolderEntries';

export interface PackageEntriesOptions {
  archiveBasePath?: string;
  ignorePaths?: string[];
  packageNames: string[];
  resolveRoot?: string;
}

export async function* packageEntries({
  archiveBasePath = 'node_modules',
  ignorePaths,
  packageNames,
  resolveRoot = process.cwd(),
}: PackageEntriesOptions): AsyncIterableIterator<ZipEntry> {
  const packages = await resolvePackageInfo(resolveRoot, packageNames, true);
  const byName = new Map<string, PackageInfo[]>();

  if (!ignorePaths) {
    ignorePaths = ['node_modules/'];
  } else {
    ignorePaths = ['node_modules/', ...ignorePaths];
  }

  for (const pkg of packages) {
    const versions = byName.get(pkg.name) || [];
    if (!versions.find((x) => x.version === pkg.version)) {
      versions.push(pkg);
    }
    byName.set(pkg.name, versions);
  }

  let error = false;

  for (const [pkg, versions] of byName) {
    if (versions.length > 1) {
      error = true;

      console.error(
        `package ${pkg} has multiple versions: ${versions
          .map((x) => x.version)
          .join(', ')}`,
      );
    }
    if (process.platform !== 'linux' && versions.find((x) => x.native)) {
      error = true;

      console.error(
        `package ${pkg} is native and current platform is ${process.platform}`,
      );
    }
  }

  if (error) {
    throw new Error(`problems with packages found (see error output)`);
  }

  for (const [pkgName, [info]] of byName) {
    for await (const entry of getFolderEntries(info.path, ignorePaths)) {
      const archivePath = path.join(
        archiveBasePath,
        pkgName,
        entry.archivePath,
      );

      yield {
        archivePath,
        content: entry.content,
      };
    }
  }
}
