import { run } from '@fmtk/async-main';
import { Command } from 'commander';
import { addAssetCommand } from './commands/asset';

export async function main(args: string[]): Promise<void> {
  const program = new Command() as Command;
  program.storeOptionsAsProperties(false).passCommandToAction(false);

  addAssetCommand(program);

  await program.parseAsync(args, { from: 'user' });
}

run(main);
