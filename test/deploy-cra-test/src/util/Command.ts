import minimist from 'minimist';
import chalk from 'chalk';
import { ValueValidator, ValidationMode } from '@fmtk/validation';

export interface Command<T = any> {
  aliases?: { [key: string]: string | string[] };
  description: string;
  execute(options: T): PromiseLike<number | void> | number | void;
  name: string;
  usage(): string;
  validate: ValueValidator<T>;
}

export async function runCommand<T>(
  command: Command<T>,
  args: string[],
): Promise<number | void> {
  const { _: positionals, ...options } = minimist(args, {
    alias: command.aliases,
  });
  if (positionals.length) {
    console.error(`unexpected positional argument`);
    return 2;
  }

  const validation = command.validate({
    value: options,
    mode: ValidationMode.String,
  });
  if (!validation.ok) {
    for (const error of validation.errors) {
      console.error(`${chalk.red('ERROR:')} ${error.field}: ${error.text}`);
    }
    console.error(`\n\n` + command.usage());
    return 2;
  }

  return await command.execute(validation.value);
}

export async function runCommands(
  args: string[],
  ...commands: Command[]
): Promise<number | void> {
  const command = commands.find((x) => x.name === args[0]);
  if (!command) {
    console.error(`\n${chalk.red('ERROR:')} expected command\n`);

    const longest = commands.reduce(
      (a, x) => (x.name.length > a.length ? x.name : a),
      '',
    );

    for (const c of commands.sort((a, b) => a.name.localeCompare(b.name))) {
      console.error(
        `    ${chalk.cyan(c.name.padEnd(longest.length + 4))} ${c.description}`,
      );
    }

    console.error(`\n`);
    return 2;
  }
  return await runCommand(command, args.slice(1));
}
