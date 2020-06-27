import { run } from '@cfnutil/assets';
import { runCommands } from './util/Command';
import { buildCommand } from './commands/build';
import { uploadCommand } from './commands/upload';
import { changesetCommand } from './commands/changeset';
import { executeCommand } from './commands/execute';
import { deployCommand } from './commands/deploy';

async function main(args: string[]) {
  return await runCommands(
    args,
    buildCommand,
    changesetCommand,
    deployCommand,
    executeCommand,
    uploadCommand,
  );
}

run(main);
