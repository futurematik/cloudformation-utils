import {
  ChangeSetParameterMap,
  ChangeSetParameter,
} from '../deploy/ChangeSetParameterMap';

export function setParam(
  assign: string,
  params: ChangeSetParameterMap,
): ChangeSetParameterMap {
  let key: string;
  let value: string | ChangeSetParameter;

  const eqIndex = assign.indexOf('=');
  if (eqIndex < 1) {
    key = assign;
    value = { UserPreviousValue: true };
  } else {
    key = assign.slice(0, eqIndex);
    value = assign.slice(eqIndex + 1);
  }

  return {
    ...params,
    [key]: value,
  };
}
