import { executeChangeSet, makeChangeSetReporter } from '@cfnutil/core';
import { Command } from 'commander';

export interface ExecuteCommandOptions {
  defaultStackName?: string;
}

export interface ExecuteOptions {
  id: string;
  name: string;
  region?: string;
}

export async function runExecuteCommand(
  options: ExecuteOptions,
): Promise<void> {
  const success = await executeChangeSet({
    stackName: options.name,
    changeSetId: options.id,
    reporter: makeChangeSetReporter(),
    region: options.region,
  });
  if (!success) {
    process.exit(1);
  }
}

export function makeExecuteCommand(
  cmdOpts: ExecuteCommandOptions,
): (program: Command) => Command {
  return function (program: Command): Command {
    return program
      .command('execute')
      .requiredOption('--id <id>', 'id of the changeset')
      .requiredOption(
        '-n, --name <name>',
        'name of the stack',
        cmdOpts.defaultStackName,
      )
      .option('--region <region>', 'AWS region')
      .action(runExecuteCommand) as Command;
  };
}
