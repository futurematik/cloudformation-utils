import { Metadata, validateMetadata } from './Metadata';
import { properties, text } from '@fmtk/validation';

export interface MetadataGlob {
  Glob: string;
  Metadata: Metadata;
}

export const validateMetadataGlob = properties<MetadataGlob>({
  Glob: text(),
  Metadata: validateMetadata,
});
