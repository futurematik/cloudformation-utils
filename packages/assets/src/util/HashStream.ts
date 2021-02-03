import crypto from 'crypto';
import stream from 'stream';
import { deferred } from '../internal/deferred';

export class HashStream extends stream.Transform {
  private readonly hash: crypto.Hash;
  private readonly flushed = deferred<void>();

  constructor(
    algorithm?: string | crypto.Hash,
    options?: stream.TransformOptions,
  ) {
    super(options);

    if (!algorithm) {
      algorithm = 'sha1';
    }
    this.hash =
      typeof algorithm === 'string' ? crypto.createHash(algorithm) : algorithm;
  }

  public digest(): Buffer;
  public digest(encoding: crypto.HexBase64Latin1Encoding): string;
  public digest(encoding?: crypto.HexBase64Latin1Encoding): Buffer | string {
    return encoding ? this.hash.digest(encoding) : this.hash.digest();
  }

  public async digestFinal(): Promise<Buffer>;
  public async digestFinal(
    encoding: crypto.HexBase64Latin1Encoding,
  ): Promise<string>;
  public async digestFinal(
    encoding?: crypto.HexBase64Latin1Encoding,
  ): Promise<Buffer | string> {
    await this.flushed.promise;
    return encoding ? this.digest(encoding) : this.digest();
  }

  public _transform(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    chunk: any,
    encoding: BufferEncoding,
    callback: stream.TransformCallback,
  ): void {
    try {
      this.hash.update(chunk);
      callback(null, chunk);
    } catch (err) {
      callback(err);
    }
  }

  public _flush(callback: stream.TransformCallback): void {
    this.flushed.resolve();
    callback(null);
  }
}
