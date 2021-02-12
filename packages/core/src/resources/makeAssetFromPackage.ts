import { findUpTree } from '@cfnutil/assets';
import fs from 'fs';
import path from 'path';
import { TemplateBuilder } from '../template/TemplateBuilder';
import { AssetAttributes, makeAsset } from './makeAsset';

export function makeAssetFromPackage(
  name: string,
  packageName: string,
  resolveRootOrOptions?:
    | string
    | {
        name?: string;
        resolveRoot?: string;
      },
): [TemplateBuilder, AssetAttributes] {
  const resolveRoot =
    typeof resolveRootOrOptions === 'string'
      ? resolveRootOrOptions
      : resolveRootOrOptions?.resolveRoot;

  const options =
    typeof resolveRootOrOptions === 'object' ? resolveRootOrOptions : {};

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
    let pkgPath: string;

    if (options.name) {
      if (!pkg.bundles || !pkg.bundles[options.name]?.path) {
        throw new Error(
          `expected package.json to have a bundles entry for '${options.name}'`,
        );
      }
      pkgPath = pkg.bundles[options.name].path;
    } else {
      if (!pkg.bundle?.path) {
        throw new Error(`expected package.json to have a bundle element`);
      }
      pkgPath = pkg.bundle.path;
    }

    return {
      content: fs.createReadStream(
        path.join(path.dirname(packagePath), pkgPath),
      ),
      fileName: path.basename(pkgPath),
    };
  });
}
