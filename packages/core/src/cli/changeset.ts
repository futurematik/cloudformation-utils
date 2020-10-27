import { Command } from 'commander';
import { createChangeSet } from '../deploy/createChangeSet';
import { setParam } from './setParam';
import { runExecuteCommand } from './execute';
import { ChangeSetParameterMap } from '../deploy/ChangeSetParameterMap';

export interface ChangesetCommandOptions {
  defaultStackName?: string;
}

export interface ChangesetOptions {
  bucket: string;
  execute?: boolean;
  manifestKey?: string;
  name: string;
  region?: string;
  stackVersion: string;
  params?: ChangeSetParameterMap;
}

export async function runChangesetCommand(
  options: ChangesetOptions,
): Promise<void> {
  const changeSet = await createChangeSet({
    bucketName: options.bucket,
    manifestKey:
      options.manifestKey ||
      `${options.name}.${options.stackVersion}.manifest.json`,
    stackName: options.name,
    version: options.stackVersion,
    parameters: options.params,
    region: options.region,
  });
  console.log(`Created changeset ${changeSet.Id}\n`);

  if (options.execute) {
    return await runExecuteCommand({
      id: changeSet.Id as string,
      name: changeSet.StackId as string,
      region: options.region,
    });
  }
}

export function makeChangesetCommand(
  cmdOpts: ChangesetCommandOptions,
): (program: Command) => Command {
  return function (program: Command): Command {
    return program
      .command('changeset')
      .requiredOption('-b, --bucket <bucket>', 'S3 bucket to deploy from')
      .option('--execute', 'also execute the changeset')
      .option('--manifest-key <key>', 'object key of the manifest file')
      .requiredOption(
        '-n, --name <name>',
        'name of the stack',
        cmdOpts.defaultStackName,
      )
      .option('--region <region>', 'AWS region')
      .option(
        '-s, --set <key=value>',
        'Set a parameter',
        setParam,
        {} as Record<string, string>,
      )
      .requiredOption('-v, --stack-version <version>', 'version of the stack')
      .action((x) => runChangesetCommand({ ...x, params: x.set })) as Command;
  };
}
