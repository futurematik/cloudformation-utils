import path from 'path';
import fs from 'fs';

const PackageJsonName = 'package.json';

export interface BundleInfo {
  path: string;
}

export async function addBundleInfoToPackageJson(
  packagePath: string,
  info: BundleInfo,
): Promise<void> {
  const packageFilePath =
    path.basename(packagePath) !== PackageJsonName
      ? path.resolve(packagePath, PackageJsonName)
      : packagePath;

  const pkg = JSON.parse(await fs.promises.readFile(packageFilePath, 'utf8'));

  if (pkg.bundle && pkg.bundle.path === info.path) {
    // don't touch the file if it isn't going to change.
    return;
  }

  if (!pkg.bundle || typeof pkg.bundle !== 'object' || pkg.bundle === null) {
    pkg.bundle = {};
  }
  pkg.bundle.path = info.path;

  await fs.promises.writeFile(
    packageFilePath,
    JSON.stringify(pkg, null, 2) + '\n',
  );
}
