import { makeUploadReporter, uploadStack } from '@cfnutil/core';
import { Command } from 'commander';

export interface UploadOptions {
  bucket: string;
  manifest: string;
  region?: string;
}

export async function runUploadCommand(options: UploadOptions): Promise<void> {
  await uploadStack({
    manifestPath: options.manifest,
    bucket: options.bucket,
    report: makeUploadReporter(),
    region: options.region,
  });
}

export function makeUploadCommand(): (program: Command) => Command {
  return function (program: Command): Command {
    return program
      .command('upload')
      .requiredOption('-b, --bucket <bucket>', 'S3 bucket to upload to')
      .requiredOption('--manifest <path>', 'path to the manifest file')
      .option('--region <region>', 'AWS region')
      .action(runUploadCommand) as Command;
  };
}
