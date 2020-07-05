import { isDerivedToken } from './makeDerivedToken';

export function resolveTokens(
  template: unknown,
  tokenMap: Map<symbol, unknown>,
): any {
  if (typeof template === 'symbol' && tokenMap.has(template)) {
    return resolveTokens(tokenMap.get(template), tokenMap);
  }
  if (isDerivedToken(template)) {
    return template(tokenMap);
  }
  if (Array.isArray(template)) {
    return template.map((x) => resolveTokens(x, tokenMap));
  }
  if (typeof template === 'object' && template !== null) {
    const ret: any = {};

    for (const [k, v] of Object.entries(template)) {
      ret[k] = resolveTokens(v, tokenMap);
    }

    return ret;
  }
  return template;
}
