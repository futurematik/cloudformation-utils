import fs from 'fs';
import path from 'path';
import proc from 'child_process';
import { InputOptions } from 'rollup';
import chalk from 'chalk';
import { makeZipPackage } from './makeZipPackage';
import { rollupPackageEntries } from './rollupPackageEntries';
import { packageEntries } from './packageEntries';
import { getZipEntryContent } from './util/getZipEntryContent';
import { ZipEntry } from './ZipEntry';

export interface RollupPackageOptions {
  ignore?: string[];
  inputOptions: InputOptions;
  installPackages?: string[];
  outputPath: string;
  packageInstallImage?: string;
  resolveRoot: string;
  smokeTest?: boolean;
}

export async function rollupPackage({
  ignore,
  inputOptions,
  installPackages,
  outputPath,
  packageInstallImage,
  resolveRoot = process.cwd(),
  smokeTest,
}: RollupPackageOptions): Promise<void> {
  const entries: ZipEntry[] = [];

  for await (const entry of rollupPackageEntries(inputOptions)) {
    if (smokeTest && entry.archivePath.endsWith('.js')) {
      await runSmokeTest(entry, path.dirname(outputPath));
    }
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
  await makeZipPackage(outputPath, entries);
}

async function runSmokeTest(
  entry: ZipEntry,
  outputPath: string,
): Promise<void> {
  console.log(chalk.cyan(`\nRunning smoke test on ${entry.archivePath}...\n`));
  const outputName = path.join(outputPath, entry.archivePath);
  const content = await getZipEntryContent(entry);

  if (typeof content === 'string' || Buffer.isBuffer(content)) {
    await fs.promises.writeFile(outputName, content);
  } else {
    const output = fs.createWriteStream(outputName);
    const done = new Promise((resolve, reject) => {
      output.on('error', reject);
      output.on('finish', resolve);
    });
    content.pipe(output);
    await done;
  }

  const result = proc.spawn(process.argv0, [outputName], {
    stdio: 'inherit',
  });

  await new Promise<void>((resolve, reject) => {
    result.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`smoke test failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
    result.on('error', reject);
  });
}
