export function setParam(
  assign: string,
  params: Record<string, string>,
): Record<string, string> {
  const eqIndex = assign.indexOf('=');
  if (eqIndex < 1) {
    throw new Error(`expected key=value format for --set`);
  }

  const key = assign.slice(0, eqIndex);
  const value = assign.slice(eqIndex + 1);

  return {
    ...params,
    [key]: value,
  };
}
