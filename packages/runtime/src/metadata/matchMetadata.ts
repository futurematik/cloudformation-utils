import minimatch from 'minimatch';
import { MetadataGlob } from './MetadataGlob';
import { Metadata } from './Metadata';

export function matchMetadata(
  metadata: MetadataGlob[],
  path: string,
): Metadata {
  for (const item of metadata) {
    if (minimatch(path, item.Glob)) {
      return item.Metadata;
    }
  }
  return {};
}
