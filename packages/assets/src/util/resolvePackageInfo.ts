import fs from 'fs';
import path from 'path';
import { findUpTree } from './findUpTree';
import { tryStat } from './tryStat';

export interface PackageInfo {
  name: string;
  native: boolean;
  path: string;
  version: string;
}

export async function resolvePackageInfo(
  resolveRoot: string,
  packages?: string[],
  recursive = false,
): Promise<PackageInfo[]> {
  if (!packages) {
    try {
      const pkg = JSON.parse(
        await fs.promises.readFile(
          path.join(resolveRoot, 'package.json'),
          'utf8',
        ),
      );
      packages = Object.keys(pkg.dependencies || {});
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`can't find package.json in "${resolveRoot}"`);
      }
      throw err;
    }
  }

  const info: PackageInfo[] = [];
  const working: [string, string][] = packages.map((x) => [x, resolveRoot]);

  while (working.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [pkgName, root] = working.pop()!;

    const pkgFile = await findUpTree(
      path.join('node_modules', pkgName, 'package.json'),
      root,
    );
    if (!pkgFile) {
      throw new Error(
        `unable to resolve "${pkgName}" from ${path.resolve(root)}`,
      );
    }

    const pkgDir = path.dirname(pkgFile);
    const pkg = JSON.parse(await fs.promises.readFile(pkgFile, 'utf8'));

    info.push({
      name: pkgName,
      native: !!(await tryStat(path.join(pkgDir, 'binding.gyp'))),
      path: pkgDir,
      version: pkg.version,
    });

    if (recursive && pkg.dependencies) {
      working.push(
        ...Object.keys(pkg.dependencies).map((x): [string, string] => [
          x,
          pkgDir,
        ]),
      );
    }
  }

  return info;
}
