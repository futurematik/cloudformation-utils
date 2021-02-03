import { rollupPackageDir, zipDir } from '@cfnutil/assets';
import { Command } from 'commander';
import path from 'path';
import { tryStat } from '../internal/tryStat';

export function addAssetCommand(program: Command): void {
  const command = program.command('asset');

  command
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

  command
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
        });
      },
    );
}

async function getPackagePath(search: string): Promise<string | undefined> {
  if (await tryStat(path.resolve(search, 'package.json'))) {
    return search;
  }
  if (await tryStat(path.resolve(process.cwd(), 'package.json'))) {
    return process.cwd();
  }
}
