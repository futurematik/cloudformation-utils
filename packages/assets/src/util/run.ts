export interface Main {
  (args: string[], entry: string, runtime: string): PromiseLike<number | void>;
}

export interface RunOptions {
  continueOnUnhandledRejection?: boolean;
}

export function run(main: Main, opts?: RunOptions): void {
  process.on('beforeExit', () => {
    // if we get here, we didn't manage to get all the way back to the final
    // continuation below, so it's probably an error.
    console.error('ERROR: ran out of async continuations!');
    process.exit(99);
  });

  if (!opts?.continueOnUnhandledRejection) {
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION:', err);
      process.exit(1);
    });
  }

  const [runtime, entry, ...args] = process.argv;

  main(args, entry, runtime)
    .then((result) => {
      // assuming everything behaved nicely, we will always get here after main
      // completes
      process.exit(result || 0);
    })
    .then(undefined, (err) => {
      console.error(err);
      process.exit(1);
    });
}
