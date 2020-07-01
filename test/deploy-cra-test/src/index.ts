import { run } from '@cfnutil/assets';
import { makeCli } from '@cfnutil/core';
import { makeStack } from './makeStack';

async function main(args: string[]) {
  const program = makeCli({
    defaultStackName: 'CfnUtilCRATestStack',
    builder: makeStack,
  });
  await program.parseAsync(args, { from: 'user' });
}

run(main);
