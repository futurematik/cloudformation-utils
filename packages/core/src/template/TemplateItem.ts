import { Resource } from '../resources/Resource';
import { Parameter } from './Parameter';
import { Asset } from '../resources/Asset';

export enum TemplateItemType {
  Asset = 'Asset',
  Parameter = 'Parameter',
  Resource = 'Resource',
}

export interface AssetTemplateItem {
  definition: Asset;
  name: string;
  type: TemplateItemType.Asset;
}

export interface ParameterTemplateItem {
  definition: Parameter;
  name: string;
  type: TemplateItemType.Parameter;
}

export interface ResourceTemplateItem<T extends string = string, Props = any> {
  definition: Resource<T, Props>;
  name: string;
  type: TemplateItemType.Resource;
}

export type TemplateItem =
  | AssetTemplateItem
  | ResourceTemplateItem
  | ParameterTemplateItem;
