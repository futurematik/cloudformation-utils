import {
  ConditionTemplateItem,
  TemplateItemType,
} from '../template/TemplateItem';
import { IntrinsicValue } from '../util/Intrinsics';

export function makeCondition(
  name: string,
  definition: IntrinsicValue,
): ConditionTemplateItem {
  return {
    definition,
    name,
    type: TemplateItemType.Condition,
  };
}
