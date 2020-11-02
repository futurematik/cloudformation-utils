import {
  ConditionTemplateItem,
  TemplateItemType,
} from '../template/TemplateItem';
import { IntrinsicValue } from '../util/Intrinsics';

export interface ConditionAttributes {
  name: string;
}

export function makeCondition(
  name: string,
  definition: IntrinsicValue,
): [ConditionTemplateItem, ConditionAttributes] {
  return [
    {
      definition,
      name,
      type: TemplateItemType.Condition,
    },
    {
      get name(): string {
        return name;
      },
    },
  ];
}
