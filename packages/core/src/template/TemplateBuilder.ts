import { TemplateItem } from './TemplateItem';

export interface TemplateBuilder {
  build(): TemplateItem[];
}

export function isTemplateBuilder(x: unknown): x is TemplateBuilder {
  return (
    typeof x === 'object' &&
    x !== null &&
    'build' in x &&
    typeof (x as any).build === 'function'
  );
}

export type ItemOrBuilder = TemplateItem | TemplateBuilder | ItemOrBuilder[];

export function makeTemplateBuilder(items: ItemOrBuilder[]): TemplateBuilder {
  return {
    build() {
      const working = [...items];
      const flattened: TemplateItem[] = [];
      let item: ItemOrBuilder | undefined;

      while ((item = working.pop())) {
        if (Array.isArray(item)) {
          working.push(...item);
        } else if (isTemplateBuilder(item)) {
          flattened.push(...item.build());
        } else {
          flattened.push(item);
        }
      }

      return flattened;
    },
  };
}
