import { ResourceBase } from './Resource';
import {
  ResourceTemplateItem,
  TemplateItemType,
} from '../template/TemplateItem';
import {
  ResourceAttributes,
  makeResourceAttributes,
} from './ResourceAttributes';
import { IntrinsicValue } from '../util/Intrinsics';

export function makeResource<T extends string, Props, Attribs extends string>(
  type: T,
  name: string,
  props: Props,
  options?: ResourceBase,
  attributes: Attribs[] = [],
): [
  ResourceTemplateItem<T, Props>,
  ResourceAttributes<Record<Attribs, IntrinsicValue>>,
] {
  return [
    {
      definition: {
        ...options,
        Type: type,
        Properties: props,
      },
      name,
      type: TemplateItemType.Resource,
    },
    makeResourceAttributes(name, attributes || []),
  ];
}
