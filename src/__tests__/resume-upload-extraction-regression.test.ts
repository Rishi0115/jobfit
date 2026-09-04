import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { extractResumeText } from "@/services/resume/parser";
import { ResumeService } from "@/services/resume/service";
import { resumesDAL } from "@/dal/resumes";
import { storageService } from "@/services/storage";

/**
 * Generate a standalone, fully valid PDF Buffer in-memory without external test fixtures.
 */
function createValidPdfBuffer(text: string): Buffer {
  const content = `BT /F1 12 Tf 100 700 Td (${text}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \r\n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \r\n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

describe("Resume Upload & Text Extraction Regression Test", () => {
  let resumeService: ResumeService;

  beforeEach(() => {
    vi.restoreAllMocks();
    resumeService = new ResumeService();
  });

  it("extracts text directly from a real PDF buffer (Rishi.pdf) with unpdf and zero fixture access", async () => {
    const rishiPdf = createValidPdfBuffer(
      "Rishi Jaiswal Senior Full Stack Engineer Experience React Next.js TypeScript Node.js PostgreSQL"
    );

    // Spy on fs.readFileSync to ensure no call attempts to open './test/data/05-versions-space.pdf'
    // or any path relative to process.cwd()
    const fsReadFileSyncSpy = vi.spyOn(fs, "readFileSync");

    const result = await extractResumeText(rishiPdf, ".pdf");

    // Verify extraction succeeded from the buffer
    expect(result.text).toContain("Rishi Jaiswal");
    expect(result.text).toContain("Full Stack Engineer");
    expect(result.wordCount).toBeGreaterThan(5);
    expect(result.pageCount).toBe(1);

    // Verify fs.readFileSync was NEVER called with './test/data/05-versions-space.pdf'
    for (const call of fsReadFileSyncSpy.mock.calls) {
      const calledPath = String(call[0]);
      expect(calledPath).not.toContain("test/data");
      expect(calledPath).not.toContain("05-versions-space.pdf");
    }
  });

  it("completes full ResumeService.processUpload with Rishi.pdf and extracts text via StorageProvider", async () => {
    const rishiPdf = createValidPdfBuffer(
      "Rishi Jaiswal Full Stack Engineer Skills TypeScript Next.js React Node.js PostgreSQL Docker AWS"
    );

    // Mock resumesDAL methods
    const mockResumeRecord = {
      id: "resume-rishi-123",
      userId: "user-rishi-456",
      fileName: "Rishi.pdf",
      fileUrl: "resumes/user-rishi-456/sample.pdf",
      fileSize: rishiPdf.length,
      mimeType: "application/pdf",
      version: 1,
      isActive: true,
      status: "PROCESSING" as const,
      rawText: null,
      parsedData: null,
      processingError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(resumesDAL, "getNextVersion").mockResolvedValue(1);
    vi.spyOn(resumesDAL, "createResume").mockResolvedValue(mockResumeRecord);
    vi.spyOn(resumesDAL, "updateResumeExtraction").mockImplementation(
      async (id, userId, text, status) => ({
        ...mockResumeRecord,
        status: status as any,
        rawText: text,
      })
    );

    // Spy on storageService download to verify it is invoked during the extraction pipeline
    const downloadSpy = vi.spyOn(storageService, "download");

    const processResult = await resumeService.processUpload(
      "user-rishi-456",
      "Rishi.pdf",
      rishiPdf,
      "application/pdf"
    );

    expect(processResult.success).toBe(true);
    expect(processResult.resume?.status).toBe("READY");
    expect(processResult.resume?.rawText).toContain("Rishi Jaiswal");
    expect(processResult.extractedWordCount).toBeGreaterThan(5);

    // Confirm that the storage provider was used to download the stored artifact
    expect(downloadSpy).toHaveBeenCalled();
  });

  it("extracts text from a DOCX file buffer without errors", async () => {
    // Dynamically mock mammoth.extractRawText for testing docx parsing
    const mammoth = await import("mammoth");
    vi.spyOn(mammoth.default || mammoth, "extractRawText").mockResolvedValue({
      value: "Rishi Jaiswal Senior Full Stack Engineer\nSkills: TypeScript, Next.js, Node.js, PostgreSQL",
      messages: [],
    });

    const docxResult = await extractResumeText(Buffer.from("dummy-docx-buffer"), ".docx");
    expect(docxResult.text).toContain("Rishi Jaiswal");
    expect(docxResult.wordCount).toBeGreaterThan(5);
  });

  it("throws for unsupported file format", async () => {
    await expect(extractResumeText(Buffer.from("dummy"), ".invalid")).rejects.toThrow(
      "Unsupported format for text extraction"
    );
  });
});
