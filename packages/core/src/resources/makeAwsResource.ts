import * as cfn from '@fmtk/cfntypes';
import { ResourceBase } from './Resource';
import { ResourceAttributes } from './ResourceAttributes';
import { ResourceTemplateItem } from '../template/TemplateItem';
import { makeResource } from './makeResource';

export function makeAwsResource<T extends cfn.ResourceType>(
  type: T,
  name: string,
  props: cfn.ResourceTypes[T],
  options?: ResourceBase,
): [
  ResourceTemplateItem<T, cfn.ResourceTypes[T]>,
  ResourceAttributes<cfn.AttributeTypeFor<T>>,
] {
  return makeResource(
    type,
    name,
    props,
    options,
    cfn.ResourceAttributes[type] as string[],
  ) as [
    ResourceTemplateItem<T, cfn.ResourceTypes[T]>,
    ResourceAttributes<cfn.AttributeTypeFor<T>>,
  ];
}
