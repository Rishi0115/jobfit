import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
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
  client?: S3Client;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;
  private bucketEnsured: boolean = false;
  private ensurePromise: Promise<void> | null = null;

  constructor(config?: S3StorageConfig) {
    this.bucket =
      config?.bucket || process.env.AWS_S3_BUCKET || "jobfit-resumes";
    this.region = config?.region || process.env.AWS_S3_REGION || "us-east-1";
    this.endpoint = config?.endpoint || process.env.AWS_S3_ENDPOINT;
    const accessKeyId =
      config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "minioadmin";
    const secretAccessKey =
      config?.secretAccessKey ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      "minioadmin";

    this.client =
      config?.client ||
      new S3Client({
        region: this.region,
        endpoint: this.endpoint || undefined,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: !!this.endpoint || config?.forcePathStyle !== false,
      });
  }

  /**
   * Idempotently ensure that the target S3/MinIO bucket exists before object operations.
   * Safe for local MinIO and production AWS S3. Never exposes credentials in error messages.
   */
  async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) {
      return;
    }

    if (this.ensurePromise) {
      return this.ensurePromise;
    }

    this.ensurePromise = (async () => {
      try {
        const headCommand = new HeadBucketCommand({
          Bucket: this.bucket,
        });
        await this.client.send(headCommand);
        this.bucketEnsured = true;
      } catch (err: unknown) {
        const error = err as {
          name?: string;
          $metadata?: { httpStatusCode?: number };
          message?: string;
        };

        const isNotFound =
          error?.name === "NotFound" ||
          error?.name === "NoSuchBucket" ||
          error?.$metadata?.httpStatusCode === 404 ||
          (typeof error?.message === "string" &&
            error.message.toLowerCase().includes("not found"));

        if (isNotFound) {
          try {
            const createParams: {
              Bucket: string;
              CreateBucketConfiguration?: {
                LocationConstraint?: any;
              };
            } = {
              Bucket: this.bucket,
            };

            // In AWS S3, LocationConstraint is required for regions other than us-east-1,
            // but not for us-east-1 or when using custom S3-compatible endpoints like MinIO without constraint requirements.
            if (this.region && this.region !== "us-east-1" && !this.endpoint) {
              createParams.CreateBucketConfiguration = {
                LocationConstraint: this.region,
              };
            }

            const createCommand = new CreateBucketCommand(createParams);
            await this.client.send(createCommand);
            this.bucketEnsured = true;
          } catch (createErr: unknown) {
            const cErr = createErr as { name?: string; message?: string };
            // Idempotent: If another concurrent process or node already created it, treat as success
            if (
              cErr?.name === "BucketAlreadyOwnedByYou" ||
              cErr?.name === "BucketAlreadyExists"
            ) {
              this.bucketEnsured = true;
              return;
            }

            this.ensurePromise = null;
            const safeMsg =
              cErr?.message || cErr?.name || "Failed to create bucket";
            throw new Error(
              `Storage initialization error: Unable to create bucket "${this.bucket}". Details: ${safeMsg}`
            );
          }
        } else {
          this.ensurePromise = null;
          const safeMsg =
            error?.message || error?.name || "Access denied or network failure";
          throw new Error(
            `Storage initialization error: Unable to access bucket "${this.bucket}". Details: ${safeMsg}`
          );
        }
      }
    })();

    return this.ensurePromise;
  }

  async upload(file: StorageFile): Promise<UploadResult> {
    await this.ensureBucket();

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
