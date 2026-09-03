import { randomUUID } from "crypto";
import { storageService } from "@/services/storage";

export interface ResumeStorageResult {
  storageKey: string;
  url: string;
  size: number;
}

export function generateResumeStorageKey(
  userId: string,
  extension: string
): string {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  const timestamp = Date.now();
  const uuid = randomUUID();
  // Safe path without user-controlled characters
  return `resumes/${userId}/${timestamp}-${uuid}${ext}`;
}

export async function uploadResumeFile(
  userId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string,
  extension: string
): Promise<ResumeStorageResult> {
  const key = generateResumeStorageKey(userId, extension);

  const result = await storageService.upload({
    key,
    buffer,
    contentType: mimeType,
    metadata: {
      userId,
      originalName: encodeURIComponent(fileName),
      uploadedAt: new Date().toISOString(),
    },
  });

  return {
    storageKey: result.key,
    url: result.url,
    size: result.size,
  };
}

export async function deleteResumeFile(storageKey: string): Promise<void> {
  await storageService.delete(storageKey);
}

export async function getResumeDownloadUrl(
  storageKey: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  return storageService.getSignedDownloadUrl(storageKey, expiresInSeconds);
}
