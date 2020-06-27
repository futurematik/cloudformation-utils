import {
  TemplateBuilder,
  makeTemplateBuilder,
} from '../template/TemplateBuilder';
import { S3ObjectRef } from './S3ObjectRef';
import { makeParameter } from './makeParameter';
import { AssetTemplateItem, TemplateItemType } from '../template/TemplateItem';
import { AssetGenerator } from './Asset';

export interface AssetAttributes {
  ref: S3ObjectRef;
}

export function makeAsset(
  name: string,
  generate: AssetGenerator,
): [TemplateBuilder, AssetAttributes] {
  const [bucketParamBuilder, bucketParam] = makeParameter(`${name}BucketName`, {
    Type: 'String',
  });
  const [objectParamBuilder, objectParam] = makeParameter(`${name}ObjectKey`, {
    Type: 'String',
  });
  const asset: AssetTemplateItem = {
    definition: {
      bucketParameterName: bucketParam.name,
      generate,
      objectParameterName: objectParam.name,
    },
    name,
    type: TemplateItemType.Asset,
  };

  return [
    makeTemplateBuilder([bucketParamBuilder, objectParamBuilder, asset]),
    {
      get ref(): S3ObjectRef {
        return {
          S3Bucket: bucketParam.ref,
          S3Key: objectParam.ref,
        };
      },
    },
  ];
}
