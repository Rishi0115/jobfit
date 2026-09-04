import mammoth from "mammoth";
import { extractText } from "unpdf";

export interface ExtractedTextResult {
  text: string;
  wordCount: number;
  pageCount?: number;
  extractedAt: Date;
}

/**
 * Extract raw text from PDF or DOCX file buffer.
 *
 * Uses `unpdf` for robust, modern PDF text extraction across all JavaScript runtimes
 * (Next.js, Node.js, Turbopack) without brittle CommonJS test-fixture side-effects.
 */
export async function extractResumeText(
  buffer: Buffer,
  extension: string
): Promise<ExtractedTextResult> {
  const ext = extension.toLowerCase();

  let rawText = "";
  let pageCount: number | undefined;

  if (ext === ".pdf") {
    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    rawText = result.text;
    pageCount = result.totalPages;
  } else if (ext === ".docx" || ext === ".doc") {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value || "";
  } else {
    throw new Error(`Unsupported format for text extraction: ${extension}`);
  }

  // Normalize whitespace
  const normalizedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  const words = normalizedText.split(/\s+/).filter(Boolean);

  return {
    text: normalizedText,
    wordCount: words.length,
    pageCount,
    extractedAt: new Date(),
  };
}
