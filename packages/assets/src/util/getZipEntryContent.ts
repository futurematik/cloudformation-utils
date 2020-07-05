import { ZipEntry, EntryContent } from '../makeZipPackage';

export async function getZipEntryContent({
  content,
}: ZipEntry): Promise<EntryContent> {
  if (typeof content !== 'function') {
    return content;
  }
  return await content();
}
