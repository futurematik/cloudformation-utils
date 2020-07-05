import { ZipEntry, EntryContent } from '../ZipEntry';

export async function getZipEntryContent({
  content,
}: ZipEntry): Promise<EntryContent> {
  if (typeof content !== 'function') {
    return content;
  }
  return await content();
}
