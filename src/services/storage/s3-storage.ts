import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { StorageProvider, StorageFile, UploadResult } from "./types";

export interface S3StorageConfig {
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  forcePathStyle?: boolean;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(config?: S3StorageConfig) {
    this.bucket =
      config?.bucket || process.env.AWS_S3_BUCKET || "jobfit-resumes";
    const region = config?.region || process.env.AWS_S3_REGION || "us-east-1";
    const endpoint = config?.endpoint || process.env.AWS_S3_ENDPOINT;
    const accessKeyId =
      config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "minioadmin";
    const secretAccessKey =
      config?.secretAccessKey ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      "minioadmin";

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !!endpoint || config?.forcePathStyle !== false,
    });
  }

  async upload(file: StorageFile): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: file.key,
      Body: file.buffer,
      ContentType: file.contentType,
      Metadata: file.metadata,
    });

    await this.client.send(command);

    const url = `/${this.bucket}/${file.key}`;
    return {
      key: file.key,
      url,
      size: file.buffer.length,
      contentType: file.contentType,
    };
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`Storage object not found or empty: ${key}`);
    }

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
