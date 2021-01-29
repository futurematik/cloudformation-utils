import { IAMRoleProps, ResourceType, IAMRoleAttributes } from '@fmtk/cfntypes';
import { makeAwsResource } from './makeAwsResource';
import { ResourceBase } from './Resource';
import { PolicyStatement } from '../policy/PolicyStatement';
import { makePolicy, Policy } from '../policy/Policy';
import { ResourceTemplateItem } from '../template/TemplateItem';
import { ResourceAttributes } from './ResourceAttributes';

export interface IamRole extends ResourceAttributes<IAMRoleAttributes> {
  addStatement(statement: PolicyStatement): void;
}

export function makeIamRole(
  name: string,
  props: IAMRoleProps,
  options?: ResourceBase,
): [ResourceTemplateItem<typeof ResourceType.IAMRole, IAMRoleProps>, IamRole] {
  let policy: Policy | undefined;

  const [resource, attribs] = makeAwsResource(
    ResourceType.IAMRole,
    name,
    props,
    options,
  );

  return [
    resource,
    {
      ...attribs,

      addStatement(statement: PolicyStatement): void {
        if (!policy) {
          policy = makePolicy(`${name}AutoPolicy`, []);

          if (resource.definition.Properties.Policies) {
            resource.definition.Properties.Policies.push(policy);
          } else {
            resource.definition.Properties.Policies = [policy];
          }
        }
        policy.PolicyDocument.Statement.push(statement);
      },
    },
  ];
}
