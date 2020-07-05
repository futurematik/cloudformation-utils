export interface LateBoundToken<T = unknown> {
  generate(): T | PromiseLike<T>;
  token: symbol;
}
