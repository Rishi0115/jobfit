import mammoth from "mammoth";

export interface ExtractedTextResult {
  text: string;
  wordCount: number;
  pageCount?: number;
  extractedAt: Date;
}

/**
 * Extract raw text from PDF or DOCX file buffer.
 */
export async function extractResumeText(
  buffer: Buffer,
  extension: string
): Promise<ExtractedTextResult> {
  const ext = extension.toLowerCase();

  let rawText = "";
  let pageCount: number | undefined;

  if (ext === ".pdf") {
    // Dynamic import to avoid loading CJS modules during static route analysis
    const pdfParse = (await import("pdf-parse")).default || (await import("pdf-parse"));
    const data = await pdfParse(buffer);
    rawText = data.text || "";
    pageCount = data.numpages;
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
