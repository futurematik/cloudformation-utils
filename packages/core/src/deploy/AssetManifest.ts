import { properties, text, dictionary } from '@fmtk/validation';

export interface AssetManifestParameter {
  bucket: string;
  object: string;
}

export interface AssetManifest {
  assets: { [key: string]: string };
  parameters: { [key: string]: AssetManifestParameter };
  template: string;
}

export const validateAssetManifestParameter = properties<
  AssetManifestParameter
>({
  bucket: text(),
  object: text(),
});

export const validateAssetManifest = properties<AssetManifest>({
  assets: dictionary(text()),
  parameters: dictionary(validateAssetManifestParameter),
  template: text(),
});
