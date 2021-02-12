import { run } from '@fmtk/async-main';
import { Command } from 'commander';
import { addAssetCommand } from './commands/asset';

export async function main(args: string[]): Promise<void> {
  const program = new Command() as Command;
  program.storeOptionsAsProperties(false).passCommandToAction(false);

  addAssetCommand(program);

  if (!args.length) {
    console.error('no commands specified, try help');
    process.exit(2);
  }

  while (args.length) {
    const i = args.indexOf('--');

    if (i === 0) {
      args.splice(1);
    } else if (i < 0) {
      await program.parseAsync(args, { from: 'user' });
      break;
    } else {
      await program.parseAsync(args.splice(0, i + 1).slice(0, -1), {
        from: 'user',
      });
    }
  }
}

run(main);
