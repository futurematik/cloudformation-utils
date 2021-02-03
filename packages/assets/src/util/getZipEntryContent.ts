import { EntryContent, ZipEntry } from '../zip/ZipEntry';

export async function getZipEntryContent({
  content,
}: ZipEntry): Promise<EntryContent> {
  if (typeof content !== 'function') {
    return content;
  }
  return await content();
}
