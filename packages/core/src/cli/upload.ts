import { Command } from 'commander';
import { uploadStack } from '../deploy/uploadStack';
import { makeUploadReporter } from '../display/makeUploadReporter';

export interface UploadOptions {
  bucket: string;
  manifest: string;
}

export async function runUploadCommand(options: UploadOptions): Promise<void> {
  await uploadStack(options.manifest, options.bucket, makeUploadReporter());
}

export function makeUploadCommand(): (program: Command) => Command {
  return function (program: Command): Command {
    return program
      .command('upload')
      .requiredOption('-b, --bucket <bucket>', 'S3 bucket to upload to')
      .requiredOption('--manifest <path>', 'path to the manifest file')
      .action(runUploadCommand) as Command;
  };
}
