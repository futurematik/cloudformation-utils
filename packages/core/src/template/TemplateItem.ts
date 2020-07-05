import { Resource } from '../resources/Resource';
import { Parameter } from './Parameter';
import { Asset } from '../resources/Asset';
import { LateBoundToken } from '../resources/LateBoundToken';

export enum TemplateItemType {
  Asset = 'Asset',
  Parameter = 'Parameter',
  Resource = 'Resource',
  Token = 'Token',
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

export interface TokenTemplateItem<T = any> {
  definition: LateBoundToken<T>;
  name: string;
  type: TemplateItemType.Token;
}

export type TemplateItem =
  | AssetTemplateItem
  | ResourceTemplateItem
  | ParameterTemplateItem
  | TokenTemplateItem;
