import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';

const pipeline = util.promisify(stream.pipeline);

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

  await pipeline(content, fs.createWriteStream(fileName));
}
