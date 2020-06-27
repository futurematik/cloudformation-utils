import { Resource } from '../resources/Resource';
import { Parameter } from './Parameter';

export interface Template {
  AWSTemplateFormatVersion: '2010-09-09';
  Resources: { [key: string]: Resource };
  Parameters: { [key: string]: Parameter };
}
