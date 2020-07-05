import { hash } from './hash';

export function makeResourceName(
  name: string,
  maxLength = 64,
  hashLength = 12,
): string {
  if (maxLength < 0) {
    throw new Error(`can't have maxLength < 0`);
  }

  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
  if (name === sanitizedName && name.length <= maxLength) {
    return name;
  }

  const hashtag = hash([name]).slice(0, hashLength).toUpperCase();

  const taglessLength = maxLength - hashtag.length;
  if (taglessLength <= 0) {
    return hashtag.slice(0, maxLength);
  }
  return sanitizedName.slice(0, taglessLength) + hashtag;
}
