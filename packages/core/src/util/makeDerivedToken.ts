import { resolveTokens } from './resolveTokens';

export const DerivedTokenSymbol = Symbol('DerivedToken');

export interface TokenDeriver<T = unknown> {
  (tokens: Map<symbol, unknown>): T | PromiseLike<T>;
}

export interface DerivedToken extends TokenDeriver {
  [DerivedTokenSymbol]: typeof DerivedTokenSymbol;
}

export function makeDerivedToken<T = unknown>(
  generate: (tokens: Map<symbol, unknown>) => T,
): DerivedToken {
  const derived = function (tokens: Map<symbol, unknown>): T {
    return generate(tokens);
  } as DerivedToken;
  derived[DerivedTokenSymbol] = DerivedTokenSymbol;
  return derived;
}

export function isDerivedToken(value: unknown): value is DerivedToken {
  return (
    typeof value === 'function' &&
    Object.prototype.hasOwnProperty.call(value, DerivedTokenSymbol) &&
    (value as any)[DerivedTokenSymbol] === DerivedTokenSymbol
  );
}

export function tokenStr(strs: TemplateStringsArray, ...parts: any[]): any {
  return makeDerivedToken((tokens) => {
    const resolved = resolveTokens(parts, tokens);
    let ret = '';

    for (let i = 0; i < strs.length; ++i) {
      ret += strs[i];

      if (i < resolved.length) {
        ret += resolved[i];
      }
    }

    return ret;
  });
}
