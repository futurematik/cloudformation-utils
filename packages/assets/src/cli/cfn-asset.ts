import path from 'path';
import minimist from 'minimist';
import { rollupPackageDir } from '../rollupPackageDir';
import { zipDir } from '../zipDir';
import { tryStat } from '../util/tryStat';

export async function main(args: string[]): Promise<number | void> {
  const opts = minimist(args, {
    alias: {
      source: 's',
    },
  });

  if (opts._.length !== 1) {
    usage();
    return 2;
  }

  const source = opts.source || process.cwd();

  switch (opts._[0]) {
    case 'content':
      await zipDir(source, { packagePath: await getPackagePath(source) });
      break;

    case 'rollup':
      await rollupPackageDir(source);
      break;

    default:
      usage();
      return 2;
  }
}

async function getPackagePath(search: string): Promise<string | undefined> {
  if (await tryStat(path.resolve(search, 'package.json'))) {
    return search;
  }
  if (await tryStat(path.resolve(process.cwd(), 'package.json'))) {
    return process.cwd();
  }
}

function usage(): void {
  console.log(`
USAGE: cfn-asset <options>

Options:

    --source, -s          The source directory. Defaults to the current working 
                          directory.

Commands:

    content               Package the given directory into a zip
    rollup                Bundle the given directory with Rollup.
`);
}
