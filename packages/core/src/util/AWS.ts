import { Intrinsics, IntrinsicValue } from './Intrinsics';

export const AWS = {
  get AccountId(): IntrinsicValue {
    return Intrinsics.ref('AWS::AccountId');
  },

  get Partition(): IntrinsicValue {
    return Intrinsics.ref('AWS::Partition');
  },

  get Region(): IntrinsicValue {
    return Intrinsics.ref('AWS::Region');
  },
};
