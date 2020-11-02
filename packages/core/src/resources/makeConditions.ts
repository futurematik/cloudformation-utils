import { makeCondition } from './makeCondition';
import {
  TemplateBuilder,
  makeTemplateBuilder,
} from '../template/TemplateBuilder';
import { IntrinsicValue } from '../util/Intrinsics';

export type ConditionSpec<P extends string> = {
  [K in P]: IntrinsicValue;
};

export type ConditionsOutput<P extends string> = {
  [K in P]: string;
};

export function makeConditions<P extends string>(
  spec: ConditionSpec<P>,
): [TemplateBuilder, ConditionsOutput<P>] {
  return [
    makeTemplateBuilder(
      Object.entries(spec).map(([name, def]) => makeCondition(name, def)[0]),
    ),
    Object.fromEntries(
      Object.keys(spec).map((x) => [x, x]),
    ) as ConditionsOutput<P>,
  ];
}
