import { Resource } from '../resources/Resource';
import { IntrinsicValue } from '../util/Intrinsics';
import { Parameter } from './Parameter';

export interface Template {
  AWSTemplateFormatVersion: '2010-09-09';
  Conditions?: { [key: string]: IntrinsicValue };
  Resources: { [key: string]: Resource };
  Parameters?: { [key: string]: Parameter };
}
