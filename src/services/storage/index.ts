import { StorageProvider } from "./types";
import { S3StorageProvider } from "./s3-storage";
import { MemoryStorageProvider } from "./memory-storage";

export * from "./types";
export * from "./s3-storage";
export * from "./memory-storage";

function createStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === "memory" || process.env.NODE_ENV === "test") {
    return new MemoryStorageProvider();
  }
  return new S3StorageProvider();
}

export const storageService = createStorageProvider();
export default storageService;
