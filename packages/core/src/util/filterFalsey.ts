export function filterFalsey<T>(
  items: (T | false | null | undefined | 0 | '')[],
): T[] {
  return items.filter(Boolean) as T[];
}
