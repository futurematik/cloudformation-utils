import { TemplateBuilder } from '../template/TemplateBuilder';
import { Command } from 'commander';
import { makeBuildCommand } from './build';
import { makeChangesetCommand } from './changeset';
import { makeDeployCommand } from './deploy';
import { makeExecuteCommand } from './execute';
import { makeUploadCommand } from './upload';

export interface CliOptions {
  builder: (name: string) => TemplateBuilder;
  defaultStackName?: string;
}

export function makeCli(opts: CliOptions, program = makeCommand()): Command {
  const build = makeBuildCommand(opts);
  const changeset = makeChangesetCommand(opts);
  const deploy = makeDeployCommand(opts);
  const execute = makeExecuteCommand(opts);
  const upload = makeUploadCommand();

  build(program);
  changeset(program);
  deploy(program);
  execute(program);
  upload(program);

  return program;
}

function makeCommand(): Command {
  return new Command()
    .storeOptionsAsProperties(false)
    .passCommandToAction(false) as Command;
}
