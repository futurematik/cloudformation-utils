import { Intrinsics, IntrinsicValue } from './Intrinsics';

export const AWS = {
  get AccountId(): IntrinsicValue {
    return Intrinsics.ref('AWS::AccountId');
  },

  get NotificationARNs(): IntrinsicValue {
    return Intrinsics.ref('AWS::NotificationARNs');
  },

  get NoValue(): IntrinsicValue {
    return Intrinsics.ref('AWS::NoValue');
  },

  get Partition(): IntrinsicValue {
    return Intrinsics.ref('AWS::Partition');
  },

  get Region(): IntrinsicValue {
    return Intrinsics.ref('AWS::Region');
  },

  get StackId(): IntrinsicValue {
    return Intrinsics.ref('AWS::StackId');
  },

  get StackName(): IntrinsicValue {
    return Intrinsics.ref('AWS::StackName');
  },

  get URLSuffix(): IntrinsicValue {
    return Intrinsics.ref('AWS::URLSuffix');
  },
};
