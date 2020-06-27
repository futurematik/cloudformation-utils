export interface CancellationToken {
  isCancelled: boolean;
  waitForCancel(reject: boolean): PromiseLike<void>;
}

export class OperationCancelledError extends Error {
  public static readonly Name = 'OperationCancelledError';

  public static is(err: unknown): err is OperationCancelledError {
    return (
      err instanceof OperationCancelledError ||
      (typeof err === 'object' &&
        err !== null &&
        err.hasOwnProperty('name') &&
        (err as any).name === OperationCancelledError.Name)
    );
  }

  public readonly code = OperationCancelledError.Name;

  constructor() {
    super(`an operation was cancelled`);
    this.name = OperationCancelledError.Name;
  }
}

export function makeCancellationToken(): [CancellationToken, () => void] {
  let cancelled = false;
  let cancel: () => void;

  const promise = new Promise((resolve) => {
    cancel = resolve;
  });

  return [
    {
      get isCancelled(): boolean {
        return cancelled;
      },

      async waitForCancel(reject: boolean): Promise<void> {
        await promise;

        if (reject) {
          throw new OperationCancelledError();
        }
      },
    },
    () => {
      cancelled = true;
      cancel();
    },
  ];
}

export function makeNeverCancellationToken(): CancellationToken {
  return {
    get isCancelled(): boolean {
      return false;
    },

    async waitForCancel(): Promise<void> {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return new Promise(() => {});
    },
  };
}

export async function withCancellation<T>(
  result: PromiseLike<T>,
  cancellation: CancellationToken,
): Promise<T> {
  return Promise.race([result, cancellation.waitForCancel(true)]) as Promise<T>;
}
