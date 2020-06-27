import { Route53RecordSetAliasTarget, ResourceType } from '@fmtk/cfntypes';
import {
  TemplateBuilder,
  makeTemplateBuilder,
  ItemOrBuilder,
} from '../template/TemplateBuilder';
import { makeAwsResource } from './makeAwsResource';

export interface DomainAliasProps {
  HostedZoneName?: string;
  HostedZoneId?: string;
  EnableIpv6?: boolean;
  Name: string;
  Target: Route53RecordSetAliasTarget;
}

export function makeDomainAlias(
  name: string,
  props: DomainAliasProps,
): [TemplateBuilder] {
  const resources: ItemOrBuilder[] = [];

  const [a] = makeAwsResource(ResourceType.Route53RecordSet, name, {
    AliasTarget: props.Target,
    HostedZoneName: props.HostedZoneName,
    HostedZoneId: props.HostedZoneId,
    Name: props.Name,
    Type: 'A',
  });
  resources.push(a);

  if (props.EnableIpv6) {
    const [aaaa] = makeAwsResource(
      ResourceType.Route53RecordSet,
      `${name}AAAA`,
      {
        AliasTarget: props.Target,
        HostedZoneName: props.HostedZoneName,
        HostedZoneId: props.HostedZoneId,
        Name: props.Name,
        Type: 'AAAA',
      },
    );
    resources.push(aaaa);
  }

  return [makeTemplateBuilder(resources)];
}
