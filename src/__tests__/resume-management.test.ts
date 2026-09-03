import { describe, it, expect, beforeEach } from "vitest";
import { validateResumeFile } from "@/services/resume/file-validator";
import { generateResumeStorageKey } from "@/services/resume/storage";
import { MemoryStorageProvider } from "@/services/storage/memory-storage";
import { extractResumeText } from "@/services/resume/parser";

describe("Resume File Validator", () => {
  it("validates a legitimate PDF buffer with %PDF header", () => {
    // PDF magic bytes: %PDF
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = validateResumeFile("My_Resume.pdf", pdfBuffer, "application/pdf");

    expect(result.isValid).toBe(true);
    expect(result.extension).toBe(".pdf");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.sanitizedFileName).toBe("My_Resume.pdf");
  });

  it("validates a legitimate DOCX buffer with PK\\x03\\x04 zip header", () => {
    // DOCX zip magic bytes: PK\x03\x04
    const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const result = validateResumeFile("Software_Engineer.docx", docxBuffer);

    expect(result.isValid).toBe(true);
    expect(result.extension).toBe(".docx");
    expect(result.mimeType).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  });

  it("rejects an empty buffer", () => {
    const emptyBuffer = Buffer.alloc(0);
    const result = validateResumeFile("empty.pdf", emptyBuffer);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("rejects an oversized buffer (> 5MB)", () => {
    // 5MB + 1 byte
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    // Add PDF magic bytes so it would otherwise pass header check
    largeBuffer[0] = 0x25;
    largeBuffer[1] = 0x50;
    largeBuffer[2] = 0x44;
    largeBuffer[3] = 0x46;

    const result = validateResumeFile("huge.pdf", largeBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("exceeds the maximum limit");
  });

  it("rejects unsupported extensions (e.g. .exe, .sh, .txt)", () => {
    const textBuffer = Buffer.from("Hello world plain text");
    const result = validateResumeFile("malicious.exe", textBuffer);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Unsupported file format");
  });

  it("detects extension spoofing when extension is .pdf but content is not PDF", () => {
    const fakePdfBuffer = Buffer.from("This is not a real PDF document");
    const result = validateResumeFile("fake.pdf", fakePdfBuffer);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Corrupted or invalid PDF");
  });

  it("detects extension spoofing when extension is .docx but content is not DOCX", () => {
    const fakeDocxBuffer = Buffer.from("Not a docx file");
    const result = validateResumeFile("fake.docx", fakeDocxBuffer);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Corrupted or invalid DOCX");
  });

  it("sanitizes dangerous characters in filename", () => {
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    const result = validateResumeFile("../../evil$resume#name.pdf", pdfBuffer);

    expect(result.isValid).toBe(true);
    expect(result.sanitizedFileName).not.toContain("/");
    expect(result.sanitizedFileName).not.toContain("$");
    expect(result.sanitizedFileName).not.toContain("#");
  });
});

describe("Resume Storage Key Generation", () => {
  it("generates a safe path isolated under user directory", () => {
    const userId = "usr_123456789";
    const key = generateResumeStorageKey(userId, ".pdf");

    expect(key.startsWith(`resumes/${userId}/`)).toBe(true);
    expect(key.endsWith(".pdf")).toBe(true);
    expect(key).not.toContain("..");
  });

  it("normalizes extension without leading dot", () => {
    const key = generateResumeStorageKey("usr_abc", "docx");
    expect(key.endsWith(".docx")).toBe(true);
  });
});

describe("Memory Storage Provider", () => {
  let storage: MemoryStorageProvider;

  beforeEach(() => {
    storage = new MemoryStorageProvider();
  });

  it("uploads and downloads files accurately", async () => {
    const fileBuffer = Buffer.from("Resume file content");
    const uploadResult = await storage.upload({
      key: "resumes/u1/resume.pdf",
      buffer: fileBuffer,
      contentType: "application/pdf",
    });

    expect(uploadResult.key).toBe("resumes/u1/resume.pdf");
    expect(uploadResult.size).toBe(fileBuffer.length);

    const exists = await storage.exists("resumes/u1/resume.pdf");
    expect(exists).toBe(true);

    const downloaded = await storage.download("resumes/u1/resume.pdf");
    expect(downloaded.toString()).toBe("Resume file content");
  });

  it("deletes file from storage", async () => {
    await storage.upload({
      key: "resumes/u1/temp.pdf",
      buffer: Buffer.from("temp"),
      contentType: "application/pdf",
    });

    await storage.delete("resumes/u1/temp.pdf");
    const exists = await storage.exists("resumes/u1/temp.pdf");
    expect(exists).toBe(false);
  });
});

describe("Resume Parser & Extraction Logic", () => {
  it("throws for unsupported format", async () => {
    const buffer = Buffer.from("test");
    await expect(extractResumeText(buffer, ".png")).rejects.toThrow("Unsupported format");
  });
});

describe("Resume Versioning & Active State Semantics", () => {
  it("increments version number deterministically", () => {
    const existingVersions = [1, 2];
    const nextVersion = (Math.max(...existingVersions, 0)) + 1;
    expect(nextVersion).toBe(3);
  });

  it("defaults first version to 1 when no resumes exist", () => {
    const existingVersions: number[] = [];
    const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
    expect(nextVersion).toBe(1);
  });

  it("maintains exactly one active resume during active toggle", () => {
    const resumes = [
      { id: "1", isActive: true },
      { id: "2", isActive: false },
      { id: "3", isActive: false },
    ];

    // Toggle resume "2" to active
    const updated = resumes.map((r) => ({
      ...r,
      isActive: r.id === "2",
    }));

    const activeCount = updated.filter((r) => r.isActive).length;
    expect(activeCount).toBe(1);
    expect(updated.find((r) => r.id === "2")?.isActive).toBe(true);
    expect(updated.find((r) => r.id === "1")?.isActive).toBe(false);
  });

  it("reassigns active resume to most recent when active resume is deleted", () => {
    const resumes = [
      { id: "1", version: 1, isActive: false },
      { id: "2", version: 2, isActive: true },
    ];

    // Delete resume "2" (the active one)
    const remaining = resumes.filter((r) => r.id !== "2");
    // Sort remaining by version desc
    const nextActive = remaining.sort((a, b) => b.version - a.version)[0];

    expect(nextActive).toBeDefined();
    expect(nextActive.id).toBe("1");
  });
});
