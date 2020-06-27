export type IntrinsicValue = any;

export const Intrinsics = {
  getAtt(name: string, attribute: string): IntrinsicValue {
    return { 'Fn::GetAtt': [name, attribute] };
  },

  join(delimiter: string, parts: any[]): IntrinsicValue {
    return { 'Fn::Join': [delimiter, parts] };
  },

  ref(name: string): IntrinsicValue {
    return { Ref: name };
  },
};
