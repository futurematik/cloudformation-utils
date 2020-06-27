import {
  ParameterTemplateItem,
  TemplateItemType,
} from '../template/TemplateItem';
import { Parameter } from '../template/Parameter';
import { Intrinsics, IntrinsicValue } from '../util/Intrinsics';

export interface ParameterAttributes {
  name: string;
  ref: IntrinsicValue;
}

export function makeParameter(
  name: string,
  spec: Parameter,
): [ParameterTemplateItem, ParameterAttributes] {
  return [
    {
      definition: spec,
      name,
      type: TemplateItemType.Parameter,
    },
    {
      get name() {
        return name;
      },

      get ref() {
        return Intrinsics.ref(name);
      },
    },
  ];
}
