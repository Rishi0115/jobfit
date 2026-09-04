import { StorageProvider, StorageFile, UploadResult } from "./types";

export class MemoryStorageProvider implements StorageProvider {
  private store = new Map<string, { buffer: Buffer; contentType: string }>();

  async upload(file: StorageFile): Promise<UploadResult> {
    this.store.set(file.key, {
      buffer: file.buffer,
      contentType: file.contentType,
    });
    return {
      key: file.key,
      url: `/mock-storage/${file.key}`,
      size: file.buffer.length,
      contentType: file.contentType,
    };
  }

  async download(key: string): Promise<Buffer> {
    const item = this.store.get(key);
    if (!item) throw new Error(`Storage object not found: ${key}`);
    return item.buffer;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    return `/api/storage/download?key=${encodeURIComponent(key)}`;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async ensureBucket(): Promise<void> {
    // In-memory storage does not require an external bucket
  }

  clear(): void {
    this.store.clear();
  }
}
