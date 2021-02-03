import { ChangeSetParameterMap, TemplateBuilder } from '@cfnutil/core';
import { Command } from 'commander';
import { runBuildCommand } from './build';
import { runChangesetCommand } from './changeset';
import { setParam } from './setParam';

export interface DeployCommandOptions {
  builder: (name: string) => TemplateBuilder;
  defaultStackName?: string;
}

export interface DeployOptions {
  bucket: string;
  builder: (name: string) => TemplateBuilder;
  execute?: boolean;
  outdir?: string;
  name: string;
  stackVersion: string;
  params?: ChangeSetParameterMap;
}

export async function runDeployCommand(opts: DeployOptions): Promise<void> {
  await runBuildCommand(opts);
  return runChangesetCommand(opts);
}

export function makeDeployCommand(
  cmdOpts: DeployCommandOptions,
): (program: Command) => Command {
  return function (program: Command): Command {
    return program
      .command('deploy')
      .option('-b, --bucket <bucket>', 'S3 bucket to upload assets to')
      .option('--execute', 'also execute the changeset')
      .option('-o, --outdir <path>', 'directory to output build to')
      .requiredOption(
        '-n, --name <name>',
        'name of the stack',
        cmdOpts.defaultStackName,
      )
      .option(
        '-s, --set <key=value>',
        'Set a parameter',
        setParam,
        {} as Record<string, string>,
      )
      .requiredOption('-v, --stack-version <version>', 'the stack version')
      .action((x) =>
        runDeployCommand({ ...x, params: x.set, builder: cmdOpts.builder }),
      ) as Command;
  };
}
