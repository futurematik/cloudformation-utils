import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';

export async function writeStreamToFile(
  fileName: string,
  content: stream.Readable,
  createFolder = false,
): Promise<void> {
  if (createFolder) {
    await fs.promises.mkdir(path.resolve(path.dirname(fileName)), {
      recursive: true,
    });
  }

  const pipeline = util.promisify(stream.pipeline);
  await pipeline(content, fs.createWriteStream(fileName));
}
