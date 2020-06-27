import stream from 'stream';

export interface AssetOutput {
  content: stream.Readable;
  fileName: string;
}

export interface AssetGenerator {
  (): PromiseLike<AssetOutput> | AssetOutput;
}

export interface Asset {
  bucketParameterName: string;
  generate: AssetGenerator;
  objectParameterName: string;
}
