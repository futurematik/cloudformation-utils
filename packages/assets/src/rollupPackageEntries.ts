import { rollup, InputOptions } from 'rollup';
import { ZipEntry } from './ZipEntry';

// prevent build tooling recognizing the string (rollup source seems to do this)
const SourceMapUrl = 'source_Mapping_URL'.replace(/_/g, '');

export async function* rollupPackageEntries(
  inputOptions: InputOptions,
): AsyncIterableIterator<ZipEntry> {
  const bundle = await rollup(inputOptions);

  const output = await bundle.generate({
    file: 'index.js',
    format: 'cjs',
    sourcemap: true,
  });

  for (const chunkOrAsset of output.output) {
    let content: Buffer;

    if (chunkOrAsset.type === 'asset') {
      content = Buffer.from(chunkOrAsset.source);
    } else if (chunkOrAsset.type === 'chunk') {
      let code = chunkOrAsset.code;

      if (chunkOrAsset.map) {
        const url = `${chunkOrAsset.fileName}.map`;

        yield {
          archivePath: url,
          content: chunkOrAsset.map.toString(),
        };
        code += `//# ${SourceMapUrl}=${url}\n`;
      }

      content = Buffer.from(code);
    } else {
      continue;
    }

    yield { archivePath: chunkOrAsset.fileName, content };
  }
}
