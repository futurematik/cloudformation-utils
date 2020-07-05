import { TokenTemplateItem, TemplateItemType } from '../template/TemplateItem';

export type TokenPlaceholder<T> = T;

export interface LateBoundTokenValue<T> {
  value: T;
}

export function makeLateBoundToken<T>(
  name: string,
): [TokenTemplateItem, TokenPlaceholder<T>, LateBoundTokenValue<T>];
export function makeLateBoundToken<T>(
  name: string,
  generate: () => T | PromiseLike<T>,
): [TokenTemplateItem, TokenPlaceholder<T>];
export function makeLateBoundToken<T>(
  name: string,
  generate?: () => T | PromiseLike<T>,
): any[] {
  const token = Symbol(`Token:${name}`);

  if (generate) {
    return [
      {
        name,
        definition: {
          generate,
          token,
        },
        type: TemplateItemType.Token,
      },
      token,
    ];
  } else {
    let hasValue = false;
    let storedValue: any;

    return [
      {
        name,
        definition: {
          generate: () => {
            if (!hasValue) {
              throw new Error(`token ${name} has never been provided a value`);
            }
            return storedValue;
          },
          token,
        },
        type: TemplateItemType.Token,
      },
      token,
      {
        get value(): T {
          return storedValue;
        },

        set value(value: T) {
          storedValue = value;
          hasValue = true;
        },
      },
    ];
  }
}
