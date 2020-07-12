import path from 'path';
import program from 'commander';
import { rollupPackageDir } from '../rollupPackageDir';
import { zipDir } from '../zipDir';
import { tryStat } from '../util/tryStat';

program.storeOptionsAsProperties(false).passCommandToAction(false);

program
  .command('content')
  .description('package the given directory into a zip')
  .requiredOption(
    '-s, --source <path>',
    'the source directory (defaults to CWD)',
    process.cwd(),
  )
  .option(
    '-x, --ignore <glob>',
    'a glob to avoid bundling (can be specified multiple times)',
    (value: string, prev: string[]): string[] => prev.concat(value),
    [],
  )
  .option('-o, --output-dir <path>', 'the output directory')
  .action(
    async (options): Promise<void> => {
      await zipDir(options.source, {
        packagePath: await getPackagePath(options.source),
        outputPath: options.outputPath,
        ignorePaths: options.ignore,
      });
    },
  );

program
  .command('rollup')
  .description('bundle the given directory with Rollup')
  .option(
    '-i, --install <pkg>',
    'a package to install (can be specified multiple times)',
    (value: string, prev: string[]): string[] => prev.concat(value),
    [],
  )
  .option(
    '-x, --ignore <glob>',
    'a glob to avoid bundling (can be specified multiple times)',
    (value: string, prev: string[]): string[] => prev.concat(value),
    [],
  )
  .option(
    '--package-install-image <name>',
    'a docker image to use to install images on non-linux platforms',
  )
  .option(
    '-r, --resolve-root <path>',
    'the directory to resolve packages from (defaults to CWD)',
    process.cwd(),
  )
  .option(
    '--smoke-test',
    'execute the bundle output to check for unresolved imports or bad syntax',
  )
  .requiredOption(
    '-s, --source <path>',
    'the source directory (defaults to CWD)',
    process.cwd(),
  )
  .option('-o, --output-dir <path>', 'the output directory')
  .action(
    async (options): Promise<void> => {
      await rollupPackageDir(options.source, {
        ignorePaths: options.ignore,
        installPackages: options.install,
        outputPath: options.outputPath,
        packageInstallImage: options.packageInstallImage,
        resolveRoot: options.resolveRoot,
        smokeTest: options.smokeTest,
      });
    },
  );

export async function main(args: string[]): Promise<void> {
  await program.parseAsync(args, { from: 'user' });
}

async function getPackagePath(search: string): Promise<string | undefined> {
  if (await tryStat(path.resolve(search, 'package.json'))) {
    return search;
  }
  if (await tryStat(path.resolve(process.cwd(), 'package.json'))) {
    return process.cwd();
  }
}
