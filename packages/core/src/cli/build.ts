import path from 'path';
import { Command } from 'commander';
import { buildStack } from '../deploy/buildStack';
import { makeBuildReporter } from '../display/makeBuildReporter';
import { TemplateBuilder } from '../template/TemplateBuilder';
import { runUploadCommand } from './upload';

export interface BuildCommandOptions {
  builder?: (name: string) => TemplateBuilder;
  defaultStackName?: string;
}

export interface BuildOptions {
  bucket?: string;
  builder: (name: string) => TemplateBuilder;
  outdir?: string;
  name: string;
  stackVersion: string;
}

export async function runBuildCommand(options: BuildOptions): Promise<void> {
  const manifestPath = await buildStack(
    options.name,
    options.builder(options.name),
    {
      outputDir: options.outdir || path.resolve(process.cwd(), 'dist'),
      version: options.stackVersion,
    },
    makeBuildReporter(),
  );

  if (options.bucket) {
    await runUploadCommand({
      manifest: manifestPath,
      bucket: options.bucket,
    });
  }
}

export function makeBuildCommand(
  cmdOpts: BuildCommandOptions,
): (program: Command) => Command {
  return function (program: Command): Command {
    return program
      .command('build')
      .option('-b, --bucket <bucket>', 'S3 bucket to upload the output to.')
      .option('-o, --outdir <path>', 'firectory to output build to')
      .requiredOption(
        '-n, --name <name>',
        'name of the stack',
        cmdOpts.defaultStackName,
      )
      .requiredOption('-v, --stack-version <version>', 'version of the stack')
      .action((opts) =>
        runBuildCommand({ ...opts, builder: cmdOpts.builder }),
      ) as Command;
  };
}