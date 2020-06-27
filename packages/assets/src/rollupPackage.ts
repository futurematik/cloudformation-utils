import { rollup, InputOptions } from 'rollup';
import { makeZipPackage, ZipEntry } from './makeZipPackage';

// prevent build tooling recognizing the string (rollup source seems to do this)
const SourceMapUrl = 'source_Mapping_URL'.replace(/_/g, '');

export async function rollupPackage(
  outputPath: string,
  inputOptions: InputOptions,
): Promise<string> {
  const bundle = await rollup(inputOptions);

  const output = await bundle.generate({
    file: 'index.js',
    format: 'cjs',
    sourcemap: true,
  });

  const entries: ZipEntry[] = [];

  for (const chunkOrAsset of output.output) {
    let content: Buffer;

    if (chunkOrAsset.type === 'asset') {
      content = Buffer.from(chunkOrAsset.source);
    } else if (chunkOrAsset.type === 'chunk') {
      let code = chunkOrAsset.code;

      if (chunkOrAsset.map) {
        const url = `${chunkOrAsset.fileName}.map`;

        entries.push({
          archivePath: url,
          content: chunkOrAsset.map.toString(),
        });
        code += `//# ${SourceMapUrl}=${url}\n`;
      }

      content = Buffer.from(code);
    } else {
      continue;
    }

    entries.push({ archivePath: chunkOrAsset.fileName, content });
  }

  return makeZipPackage(outputPath, entries);
}
