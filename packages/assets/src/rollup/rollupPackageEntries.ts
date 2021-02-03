import { InputOptions, rollup } from 'rollup';
import { ZipEntry } from '../zip/ZipEntry';

const SourceMapUrl = 'sourceMappingURL';

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
