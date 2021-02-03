export interface Deferred<T> {
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<T>;
}

export function deferred<T>(): Deferred<T> {
  let _resolve: (value?: T | PromiseLike<T>) => void;
  let _reject: (reason?: any) => void;

  return Object.freeze({
    get resolve() {
      return _resolve;
    },

    get reject() {
      return _reject;
    },

    promise: new Promise<T>((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    }),
  });
}
