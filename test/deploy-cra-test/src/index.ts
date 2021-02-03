import { run } from '@fmtk/async-main';
import { makeCli } from './cli/makeCli';
import { makeStack } from './makeStack';

async function main(args: string[]) {
  const program = makeCli({
    defaultStackName: 'CfnUtilCRATestStack',
    builder: makeStack,
  });
  await program.parseAsync(args, { from: 'user' });
}

run(main);
