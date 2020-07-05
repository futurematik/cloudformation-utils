import stream from 'stream';

export type EntryContent = stream.Readable | string | Buffer;

export interface ZipEntry {
  archivePath: string;
  content:
    | EntryContent
    | (() => EntryContent)
    | (() => PromiseLike<EntryContent>);
}
