import fs from 'fs';
import path from 'path';
import { TemplateBuilder } from '../template/TemplateBuilder';
import { TemplateItemType } from '../template/TemplateItem';
import { Template } from '../template/Template';
import { Asset } from '../resources/Asset';
import { hash } from '@cfnutil/runtime';
import { HashStream } from '@cfnutil/assets';
import { AssetManifest } from './AssetManifest';

export interface StagingOptions {
  outputDir: string;
  version?: string;
}

export async function buildStack(
  name: string,
  builder: TemplateBuilder,
  options: StagingOptions,
): Promise<string> {
  await fs.promises.mkdir(options.outputDir, { recursive: true });
  const templateItems = builder.build();

  const templateName = [name, options.version, 'template.json']
    .filter(Boolean)
    .join('.');

  const manifestName = [name, options.version, 'manifest.json']
    .filter(Boolean)
    .join('.');

  const template: Template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {},
    Resources: {},
  };

  const manifest: AssetManifest = {
    assets: {},
    parameters: {},
    template: templateName,
  };

  for (const item of templateItems) {
    switch (item.type) {
      case TemplateItemType.Asset:
        try {
          manifest.parameters[item.name] = {
            bucket: item.definition.bucketParameterName,
            object: item.definition.objectParameterName,
          };
          manifest.assets[item.name] = await stageAsset(
            item.name,
            item.definition,
            options,
          );
        } catch (err) {
          console.error(`asset ${item.name}:`, err);
          throw err;
        }
        break;

      case TemplateItemType.Parameter:
        template.Parameters[item.name] = item.definition;
        break;

      case TemplateItemType.Resource:
        template.Resources[item.name] = item.definition;
        break;

      default:
        throw new Error(`unknown item type ${(item as any).type}`);
    }
  }

  await fs.promises.writeFile(
    path.join(options.outputDir, templateName),
    JSON.stringify(template, null, 2),
  );

  const manifestPath = path.join(options.outputDir, manifestName);

  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}

async function stageAsset(name: string, asset: Asset, options: StagingOptions) {
  const assetOutput = await asset.generate();

  const outPath = path.join(
    options.outputDir,
    sanitizeFilename(name + path.extname(assetOutput.fileName)),
  );

  const outStream = fs.createWriteStream(outPath);

  const hashStream = new HashStream();
  assetOutput.content.pipe(hashStream).pipe(outStream);
  const sha = await hashStream.digestFinal('hex');

  const finalPath = changeExt(outPath, `.${sha}${path.extname(outPath)}`);
  await fs.promises.rename(outPath, finalPath);
  return path.basename(finalPath);
}

function sanitizeFilename(name: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9._-]/g, '');
  if (sanitized !== name) {
    return sanitized + hash(name).slice(0, 5);
  }
  return name;
}

function changeExt(p: string, ext: string): string {
  return path.join(path.dirname(p), path.basename(p, path.extname(p)) + ext);
}
