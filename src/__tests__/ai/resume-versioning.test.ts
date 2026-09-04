import { describe, it, expect, vi, beforeEach } from "vitest";
import { resumesDAL } from "@/dal/resumes";
import { db } from "@/lib/db";

describe("Resume Versioning & Selective Acceptance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sourceResume = {
    id: "res-v1",
    userId: "user-123",
    fileName: "My_Resume.pdf",
    fileUrl: "s3://bucket/res-v1.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    version: 1,
    isActive: true,
    status: "READY" as const,
    rawText: "Bullet 1: Built UI in React.\nBullet 2: Handled basic bugs.",
    processingError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should create a new version atomically without modifying or overwriting original resume", async () => {
    const mockTx = {
      resume: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.id === "res-v1") return Promise.resolve(sourceResume);
          return Promise.resolve(sourceResume); // latest version is 1
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...data,
            id: "res-v2",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
      },
    };

    vi.spyOn(db, "$transaction").mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    const updatedText =
      "Bullet 1: Architected responsive UI in React [Add metric].\nBullet 2: Handled basic bugs.";

    const newVersion = await resumesDAL.createResumeVersion({
      userId: "user-123",
      sourceResumeId: "res-v1",
      rawText: updatedText,
    });

    // Verify new version number incremented
    expect(newVersion.version).toBe(2);
    expect(newVersion.isActive).toBe(true);
    expect(newVersion.rawText).toBe(updatedText);

    // Verify previous active resume was deactivated, NOT deleted or overwritten
    expect(mockTx.resume.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-123", isActive: true },
      data: { isActive: false },
    });

    // Original resume fileUrl is preserved
    expect(newVersion.fileUrl).toBe(sourceResume.fileUrl);
  });

  it("should rollback cleanly if a database failure occurs during version creation", async () => {
    vi.spyOn(db, "$transaction").mockRejectedValue(
      new Error("Database connection dropped during write")
    );

    await expect(
      resumesDAL.createResumeVersion({
        userId: "user-123",
        sourceResumeId: "res-v1",
        rawText: "Some text",
      })
    ).rejects.toThrow("Database connection dropped during write");
  });
});
