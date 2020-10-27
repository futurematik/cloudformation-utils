import fs from 'fs';
import path from 'path';
import { TemplateBuilder } from '../template/TemplateBuilder';
import { TemplateItemType, TokenTemplateItem } from '../template/TemplateItem';
import { Template } from '../template/Template';
import { Asset } from '../resources/Asset';
import { hash } from '@cfnutil/runtime';
import { HashStream } from '@cfnutil/assets';
import { AssetManifest } from './AssetManifest';
import { resolveTokens } from '../util/resolveTokens';

export interface BuildStackReporterItem {
  asset?: {
    path: string;
    size: number;
  };
  current?: string;
  done?: boolean;
  total?: number;
}

export interface BuildStackReporter {
  (item: BuildStackReporterItem): void;
}

export interface BuildStackOptions {
  name: string;
  builder: TemplateBuilder;
  outputDir: string;
  reporter?: BuildStackReporter;
  version?: string;
}

export async function buildStack({
  name,
  builder,
  outputDir,
  reporter,
  version,
}: BuildStackOptions): Promise<string> {
  await fs.promises.mkdir(outputDir, { recursive: true });
  const allItems = builder.build();

  const tokens = allItems.filter(
    (x) => x.type === TemplateItemType.Token,
  ) as TokenTemplateItem[];

  const tokenMap = new Map<symbol, unknown>();

  for (const token of tokens) {
    tokenMap.set(token.definition.token, await token.definition.generate());
  }

  const templateItems = allItems.filter(
    (x) => x.type !== TemplateItemType.Token,
  );

  const templateName = [name, version, 'template.json']
    .filter(Boolean)
    .join('.');

  const manifestName = [name, version, 'manifest.json']
    .filter(Boolean)
    .join('.');

  const template: Required<Template> = {
    AWSTemplateFormatVersion: '2010-09-09',
    Conditions: {},
    Parameters: {},
    Resources: {},
  };

  const manifest: AssetManifest = {
    assets: {},
    parameters: {},
    template: templateName,
  };

  if (reporter) {
    reporter({ total: templateItems.length + 2 });
  }

  for (const item of templateItems) {
    if (reporter) {
      reporter({ current: item.name });
    }
    switch (item.type) {
      case TemplateItemType.Asset:
        try {
          manifest.parameters[item.name] = {
            bucket: item.definition.bucketParameterName,
            object: item.definition.objectParameterName,
          };
          const assetPath = await stageAsset(
            item.name,
            item.definition,
            outputDir,
          );
          manifest.assets[item.name] = assetPath;

          if (reporter) {
            const assetFullPath = path.join(outputDir, assetPath);

            reporter({
              current: item.name,
              asset: {
                path: path.relative(process.cwd(), assetFullPath),
                size: (await fs.promises.stat(assetFullPath)).size,
              },
            });
          }
        } catch (err) {
          console.error(`asset ${item.name}:`, err);
          throw err;
        }
        break;

      case TemplateItemType.Condition:
        template.Conditions[resolveTokens(item.name, tokenMap)] = resolveTokens(
          item.definition,
          tokenMap,
        );
        break;

      case TemplateItemType.Parameter:
        template.Parameters[resolveTokens(item.name, tokenMap)] = resolveTokens(
          item.definition,
          tokenMap,
        );
        break;

      case TemplateItemType.Resource:
        template.Resources[resolveTokens(item.name, tokenMap)] = resolveTokens(
          item.definition,
          tokenMap,
        );
        break;

      default:
        throw new Error(`unknown item type ${(item as any).type}`);
    }
  }

  const templatePath = path.join(outputDir, templateName);
  await fs.promises.writeFile(templatePath, JSON.stringify(template, null, 2));

  if (reporter) {
    reporter({
      current: templateName,
      asset: {
        path: path.relative(process.cwd(), templatePath),
        size: (await fs.promises.stat(templatePath)).size,
      },
    });
  }

  const manifestPath = path.join(outputDir, manifestName);
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  if (reporter) {
    reporter({
      current: manifestName,
      asset: {
        path: path.relative(process.cwd(), manifestPath),
        size: (await fs.promises.stat(manifestPath)).size,
      },
    });
    reporter({ done: true });
  }
  return manifestPath;
}

async function stageAsset(name: string, asset: Asset, outputDir: string) {
  const assetOutput = await asset.generate();

  const outPath = path.join(
    outputDir,
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
