import fs from 'fs';
import path from 'path';
import { TemplateBuilder } from '../template/TemplateBuilder';
import { AssetAttributes, makeAsset } from './makeAsset';
import { findUpTree } from '@cfnutil/assets';

export function makeAssetFromPackage(
  name: string,
  packageName: string,
  resolveRoot?: string,
): [TemplateBuilder, AssetAttributes] {
  return makeAsset(name, async () => {
    const packagePath = await findUpTree(
      path.join('node_modules', packageName, 'package.json'),
      resolveRoot,
    );
    if (!packagePath) {
      throw new Error(
        `can't find package file for ${packageName} from ${resolveRoot}`,
      );
    }

    const pkg = JSON.parse(await fs.promises.readFile(packagePath, 'utf8'));
    if (!pkg.bundle?.path) {
      throw new Error(`expected package.json to have a bundle element`);
    }

    return {
      content: fs.createReadStream(
        path.join(path.dirname(packagePath), pkg.bundle.path),
      ),
      fileName: path.basename(pkg.bundle.path),
    };
  });
}
