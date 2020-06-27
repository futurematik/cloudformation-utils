import { executeChangeSet, makeChangeSetReporter } from '@cfnutil/core';
import { properties, text, optional } from '@fmtk/validation';
import { Command } from '../util/Command';
import { DefaultStackName } from './common';

export interface ExecuteOptions {
  changeSetId: string;
  stackName?: string;
}

export const validateExecuteOptions = properties<ExecuteOptions>({
  changeSetId: text(),
  stackName: optional(text()),
});

export const executeCommand: Command<ExecuteOptions> = {
  name: 'execute',
  description: 'execute a changeset',

  async execute(options: ExecuteOptions): Promise<number> {
    const success = await executeChangeSet(
      options.stackName || DefaultStackName,
      options.changeSetId,
      makeChangeSetReporter(),
    );
    return success ? 0 : 1;
  },

  usage(): string {
    return `Options: 

    --changeSetId       REQUIRED. The id of the changeset
    --stackName         Name of the stack
`;
  },

  validate: validateExecuteOptions,
};
