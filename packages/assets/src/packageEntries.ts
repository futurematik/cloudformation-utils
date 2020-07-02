import path from 'path';
import fs from 'fs';
import childProc from 'child_process';
import tempy from 'tempy';
import { ZipEntry } from './makeZipPackage';
import { getFolderEntries } from './getFolderEntries';
import { findUpTree } from './util/findUpTree';

export interface PackageEntriesOptions {
  archivePath?: string;
  ignorePaths?: string[];
  packageInstallImage?: string;
  packageNames: string[];
  resolveRoot?: string;
}

export async function* packageEntries({
  archivePath = 'node_modules',
  ignorePaths,
  packageInstallImage = 'node:lts-slim',
  packageNames,
  resolveRoot = process.cwd(),
}: PackageEntriesOptions): AsyncIterableIterator<ZipEntry> {
  const lockPath = await findUpTree('yarn.lock', resolveRoot);
  if (!lockPath) {
    throw new Error(`can't find yarn.lock from ${resolveRoot}`);
  }

  const pkgFilePath = path.join(resolveRoot, 'package.json');
  const pkg = JSON.parse(await fs.promises.readFile(pkgFilePath, 'utf-8'));

  const newPackageJson = {
    name: 'build',
    private: true,
    dependencies: {} as Record<string, string>,
  };

  for (const dep of packageNames) {
    const version =
      (pkg.dependencies && pkg.dependencies[dep]) ||
      (pkg.devDependencies && pkg.devDependencies[dep]);

    if (!version) {
      throw new Error(`cannot find dependency ${dep} in ${pkgFilePath}`);
    }

    newPackageJson.dependencies[dep] = version;
  }

  const outDir = tempy.directory();

  await fs.promises.writeFile(
    path.join(outDir, 'package.json'),
    JSON.stringify(newPackageJson),
  );

  await fs.promises.copyFile(lockPath, path.join(outDir, 'yarn.lock'));

  let exec = ['yarn', '--frozen-lockfile'];

  if (process.platform !== 'linux') {
    console.log(
      `current platform is ${process.platform} so installing on ${packageInstallImage}`,
    );
    exec = [
      'docker',
      'run',
      '--rm',
      '-v',
      `${outDir}:/app`,
      '-w',
      '/app',
      packageInstallImage,
      ...exec,
    ];
  }

  const [cmd, ...args] = exec;
  const proc = childProc.spawn(cmd, args, {
    cwd: outDir,
    stdio: 'inherit',
  });

  await new Promise((resolve, reject) => {
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm exited with non-zero error code ${code}`));
      }
    });
  });

  return getFolderEntries({
    source: outDir,
    archivePath,
    ignore: ignorePaths,
  });
}
