import { Intrinsics, IntrinsicValue } from './Intrinsics';

export function awsStr(
  literals: TemplateStringsArray,
  ...values: any[]
): IntrinsicValue {
  const parts: any[] = [];

  for (let i = 0; i < literals.length; ++i) {
    if (literals[i]) {
      parts.push(literals[i]);
    }
    if (i < values.length) {
      parts.push(values[i]);
    }
  }

  return Intrinsics.join('', parts);
}
