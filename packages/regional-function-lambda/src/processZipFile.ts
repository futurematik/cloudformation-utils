import yazl from 'yazl';

const zipMagic = 'UEsDBA';

export async function processZipFile(
  zipFile: string,
): Promise<string | Buffer> {
  if (zipFile.startsWith(zipMagic)) {
    return zipFile;
  }

  const zip = new yazl.ZipFile();

  zip.addBuffer(Buffer.from(zipFile), 'index.js');
  zip.end();

  const chunks: Buffer[] = [];

  for await (const chunk of zip.outputStream) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}
