import { createChangeSet } from '@cfnutil/core';
import { properties, text, optional, dictionary, bool } from '@fmtk/validation';
import { Command } from '../util/Command';
import { DefaultStackName } from './common';
import { executeCommand } from './execute';

export interface ChangesetOptions {
  bucketName: string;
  execute?: boolean;
  manifestKey?: string;
  stackName?: string;
  stackVersion: string;
  params?: Record<string, string>;
}

export const validateChangesetOptions = properties<ChangesetOptions>({
  bucketName: text(),
  execute: optional(bool()),
  manifestKey: optional(text()),
  stackName: optional(text()),
  stackVersion: text(),
  params: optional(dictionary(text())),
});

export const changesetCommand: Command<ChangesetOptions> = {
  name: 'changeset',
  description: 'create a cloudformation changeset',

  async execute(options: ChangesetOptions): Promise<number | void> {
    const stackName = options.stackName || DefaultStackName;

    const changeSet = await createChangeSet({
      bucketName: options.bucketName,
      manifestKey:
        options.manifestKey ||
        `${stackName}.${options.stackVersion}.manifest.json`,
      stackName,
      version: options.stackVersion,
      parameters: options.params,
    });
    console.log(`Created changeset ${changeSet.Id}\n`);

    if (options.execute) {
      return await executeCommand.execute({
        changeSetId: changeSet.Id as string,
        stackName: changeSet.StackId as string,
      });
    }
  },

  usage(): string {
    return `Options: 

    --bucketName        REQUIRED. The name of the bucket containing the deploy assets.
    --execute           Also execute the changeset.
    --manifestKey       The object key of the manifest file.
    --stackName         Name of the stack
    --stackVersion      REQUIRED. The version of the stack.
    --params.*          Parameters to pass to the stack.
`;
  },

  validate: validateChangesetOptions,
};
