import { Principal } from './Principal';

export enum PolicyEffect {
  Allow = 'Allow',
  Deny = 'Deny',
}

export interface PolicyStatement {
  Action: string | string[];
  Condition?: any;
  Effect?: PolicyEffect;
  NotAction?: string | string[];
  NotPrincipal?: Principal | string;
  NotResource?: string | string[];
  Principal?: Principal | string;
  Resource?: string | string[];
  Sid?: string;
}

export function makePolicyStatement<T extends PolicyStatement>(
  statement: T,
): T {
  return statement;
}
