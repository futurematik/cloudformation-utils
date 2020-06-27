import { properties, text, optional, bool, dictionary } from '@fmtk/validation';
import { Command } from '../util/Command';
import { buildCommand } from './build';
import { changesetCommand } from './changeset';

export interface DeployOptions {
  bucketName: string;
  execute?: boolean;
  outputPath?: string;
  stackName?: string;
  stackVersion: string;
  params?: Record<string, string>;
}

export const validateDeployOptions = properties<DeployOptions>({
  bucketName: text(),
  execute: optional(bool()),
  outputPath: optional(text()),
  stackName: optional(text()),
  stackVersion: text(),
  params: optional(dictionary(text())),
});

export const deployCommand: Command<DeployOptions> = {
  name: 'deploy',
  description: 'deploy a stack',

  async execute(options: DeployOptions): Promise<number | void> {
    const result = await buildCommand.execute({
      bucketName: options.bucketName,
      outputPath: options.outputPath,
      stackName: options.stackName,
      stackVersion: options.stackVersion,
    });
    if (typeof result === 'number' && result > 0) {
      return result;
    }
    return await changesetCommand.execute({
      bucketName: options.bucketName,
      execute: options.execute,
      params: options.params,
      stackName: options.stackName,
      stackVersion: options.stackVersion,
    });
  },

  usage(): string {
    return `Options: 

    --bucketName        The S3 bucket to upload the output to.
    --outputPath        Directory to output build to
    --stackName         Name of the stack
    --stackVersion      REQUIRED. The version of the stack.
    --stackVersion      REQUIRED. The version of the stack.
    --params.*          Parameters to pass to the stack.
`;
  },

  validate: validateDeployOptions,
};
