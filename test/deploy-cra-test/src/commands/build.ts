import path from 'path';
import { Command, createCommand } from 'commander';
import { properties, optional, text } from '@fmtk/validation';
import { makeParameters, makeTemplateBuilder, buildStack } from '@cfnutil/core';
import { makeStack } from '../makeStack';
import { uploadCommand } from './upload';
import { DefaultStackName } from './common';

export interface BuildOptions {
  bucketName?: string;
  outputPath?: string;
  stackName?: string;
  stackVersion: string;
}

export const validateBuildOptions = properties<BuildOptions>({
  bucketName: optional(text()),
  outputPath: optional(text()),
  stackName: optional(text()),
  stackVersion: text(),
});

export const buildCommand: Command<BuildOptions> = {
  name: 'build',
  description: 'build the stack',

  async execute(options: BuildOptions): Promise<void> {
    const stackName = options.stackName || DefaultStackName;

    const [paramsBuilder, params] = makeParameters({
      DomainName: 'String',
      HostedZoneId: 'String',
    });

    const stack = makeStack(stackName, {
      DomainName: params.DomainName.ref,
      HostedZoneId: params.HostedZoneId.ref,
    });

    const template = makeTemplateBuilder([paramsBuilder, stack]);

    const manifestPath = await buildStack(stackName, template, {
      outputDir: options.outputPath || path.resolve(process.cwd(), 'dist'),
      version: options.stackVersion,
    });

    console.log(
      `Written manifest to ${path.relative(process.cwd(), manifestPath)}`,
    );

    if (options.bucketName) {
      await uploadCommand.execute({
        manifestPath,
        bucketName: options.bucketName,
      });
    }
  },

  usage(): string {
    return `Options: 

    --bucketName        If provided, an S3 bucket to upload the output to.
    --outputPath        Directory to output build to
    --stackName         Name of the stack
    --stackVersion      REQUIRED. The version of the stack.
`;
  },

  validate: validateBuildOptions,
};

export function makeBuildCommand(program: Command) {
  createCommand();
}
