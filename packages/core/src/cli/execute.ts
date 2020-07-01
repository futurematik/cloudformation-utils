import { Command } from 'commander';
import { executeChangeSet } from '../deploy/executeChangeSet';
import { makeChangeSetReporter } from '../display/makeChangeSetReporter';

export interface ExecuteCommandOptions {
  defaultStackName?: string;
}

export interface ExecuteOptions {
  id: string;
  name: string;
}

export async function runExecuteCommand(
  options: ExecuteOptions,
): Promise<void> {
  const success = await executeChangeSet(
    options.name,
    options.id,
    makeChangeSetReporter(),
  );
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
      .action(runExecuteCommand) as Command;
  };
}
