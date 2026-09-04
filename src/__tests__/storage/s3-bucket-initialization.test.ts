import { describe, it, expect, vi, beforeEach } from "vitest";
import { S3StorageProvider } from "@/services/storage/s3-storage";
import {
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

describe("S3StorageProvider - Bucket Initialization & Ensuring", () => {
  let mockSend: ReturnType<typeof vi.fn>;
  let mockClient: S3Client;

  beforeEach(() => {
    mockSend = vi.fn();
    mockClient = {
      send: mockSend,
    } as unknown as S3Client;
  });

  it("does not create bucket when bucket already exists", async () => {
    // HeadBucket resolves successfully
    mockSend.mockImplementation(async (command: any) => {
      if (command instanceof HeadBucketCommand) {
        return {};
      }
      return {};
    });

    const provider = new S3StorageProvider({
      bucket: "existing-bucket",
      client: mockClient,
    });

    await provider.ensureBucket();

    // Verify HeadBucket was called once and CreateBucket was never called
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);

    // Subsequent calls should be cached/idempotent and not invoke send again
    await provider.ensureBucket();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("creates and ensures bucket when bucket is missing (NotFound / 404)", async () => {
    const notFoundError = new Error("The specified bucket does not exist");
    notFoundError.name = "NotFound";
    (notFoundError as any).$metadata = { httpStatusCode: 404 };

    mockSend.mockImplementation(async (command: any) => {
      if (command instanceof HeadBucketCommand) {
        throw notFoundError;
      }
      if (command instanceof CreateBucketCommand) {
        return { Location: "/new-bucket" };
      }
      return {};
    });

    const provider = new S3StorageProvider({
      bucket: "new-bucket",
      client: mockClient,
    });

    await provider.ensureBucket();

    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(mockSend.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
    expect((mockSend.mock.calls[1][0] as CreateBucketCommand).input.Bucket).toBe("new-bucket");

    // Idempotent: Subsequent call does not call send again
    await provider.ensureBucket();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("handles race condition where bucket is created concurrently (BucketAlreadyOwnedByYou)", async () => {
    const notFoundError = new Error("Not Found");
    notFoundError.name = "NoSuchBucket";

    const alreadyExistsError = new Error("Your previous request to create the named bucket succeeded");
    alreadyExistsError.name = "BucketAlreadyOwnedByYou";

    mockSend.mockImplementation(async (command: any) => {
      if (command instanceof HeadBucketCommand) {
        throw notFoundError;
      }
      if (command instanceof CreateBucketCommand) {
        throw alreadyExistsError;
      }
      return {};
    });

    const provider = new S3StorageProvider({
      bucket: "concurrent-bucket",
      client: mockClient,
    });

    await expect(provider.ensureBucket()).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("throws a clear error on access denial without exposing credentials", async () => {
    const forbiddenError = new Error("Forbidden access");
    forbiddenError.name = "AccessDenied";
    (forbiddenError as any).$metadata = { httpStatusCode: 403 };

    mockSend.mockImplementation(async (command: any) => {
      if (command instanceof HeadBucketCommand) {
        throw forbiddenError;
      }
      return {};
    });

    const provider = new S3StorageProvider({
      bucket: "restricted-bucket",
      client: mockClient,
      accessKeyId: "SECRET_KEY_ID_123",
      secretAccessKey: "SUPER_SECRET_ACCESS_KEY_456",
    });

    await expect(provider.ensureBucket()).rejects.toThrow(
      /Storage initialization error: Unable to access bucket "restricted-bucket"/
    );

    // Verify error message does not contain credentials
    try {
      await provider.ensureBucket();
    } catch (err: any) {
      expect(err.message).not.toContain("SECRET_KEY_ID_123");
      expect(err.message).not.toContain("SUPER_SECRET_ACCESS_KEY_456");
    }
  });

  it("throws a clear error on bucket creation failure without exposing credentials", async () => {
    const notFoundError = new Error("Not Found");
    notFoundError.name = "NotFound";

    const createFailure = new Error("Bucket name contains invalid characters");
    createFailure.name = "InvalidBucketName";

    mockSend.mockImplementation(async (command: any) => {
      if (command instanceof HeadBucketCommand) {
        throw notFoundError;
      }
      if (command instanceof CreateBucketCommand) {
        throw createFailure;
      }
      return {};
    });

    const provider = new S3StorageProvider({
      bucket: "INVALID_BUCKET",
      client: mockClient,
      accessKeyId: "SECRET_KEY_ID_123",
      secretAccessKey: "SUPER_SECRET_ACCESS_KEY_456",
    });

    await expect(provider.ensureBucket()).rejects.toThrow(
      /Storage initialization error: Unable to create bucket "INVALID_BUCKET"/
    );

    try {
      await provider.ensureBucket();
    } catch (err: any) {
      expect(err.message).not.toContain("SECRET_KEY_ID_123");
      expect(err.message).not.toContain("SUPER_SECRET_ACCESS_KEY_456");
    }
  });

  it("automatically ensures bucket before uploading an object", async () => {
    const notFoundError = new Error("Not Found");
    notFoundError.name = "NotFound";

    mockSend.mockImplementation(async (command: any) => {
      if (command instanceof HeadBucketCommand) {
        throw notFoundError;
      }
      if (command instanceof CreateBucketCommand) {
        return { Location: "/upload-bucket" };
      }
      if (command instanceof PutObjectCommand) {
        return { ETag: '"12345"' };
      }
      return {};
    });

    const provider = new S3StorageProvider({
      bucket: "upload-bucket",
      client: mockClient,
    });

    const result = await provider.upload({
      key: "resumes/u1/resume.pdf",
      buffer: Buffer.from("dummy-pdf"),
      contentType: "application/pdf",
    });

    expect(result.key).toBe("resumes/u1/resume.pdf");
    expect(result.url).toBe("/upload-bucket/resumes/u1/resume.pdf");

    // Must have sent HeadBucket, then CreateBucket, then PutObject
    expect(mockSend).toHaveBeenCalledTimes(3);
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(mockSend.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
    expect(mockSend.mock.calls[2][0]).toBeInstanceOf(PutObjectCommand);
  });
});
