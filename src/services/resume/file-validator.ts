import { RESUME_LIMITS } from "@/lib/constants";

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFileName: string;
  extension: string;
  mimeType: string;
  size: number;
}

export function validateResumeFile(
  fileName: string,
  buffer: Buffer,
  clientMimeType?: string
): FileValidationResult {
  // 1. Check file size
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: "The uploaded file is empty.",
      sanitizedFileName: "",
      extension: "",
      mimeType: "",
      size: 0,
    };
  }

  if (buffer.length > RESUME_LIMITS.MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (RESUME_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File size exceeds the maximum limit of ${sizeInMB}MB.`,
      sanitizedFileName: "",
      extension: "",
      mimeType: "",
      size: buffer.length,
    };
  }

  // 2. Extract and validate extension
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const lastDotIndex = cleanName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return {
      isValid: false,
      error: "File must have a valid extension (.pdf or .docx).",
      sanitizedFileName: cleanName,
      extension: "",
      mimeType: "",
      size: buffer.length,
    };
  }

  const extension = cleanName.substring(lastDotIndex).toLowerCase();
  if (![".pdf", ".docx", ".doc"].includes(extension)) {
    return {
      isValid: false,
      error: `Unsupported file format (${extension}). Please upload a PDF or DOCX file.`,
      sanitizedFileName: cleanName,
      extension,
      mimeType: "",
      size: buffer.length,
    };
  }

  // 3. Verify magic bytes / file signature to prevent extension spoofing
  let detectedMime = clientMimeType || "application/octet-stream";

  if (extension === ".pdf") {
    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    const isPdf =
      buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    if (!isPdf) {
      return {
        isValid: false,
        error: "Corrupted or invalid PDF file header.",
        sanitizedFileName: cleanName,
        extension,
        mimeType: detectedMime,
        size: buffer.length,
      };
    }
    detectedMime = "application/pdf";
  } else if (extension === ".docx") {
    // DOCX is a zipped XML archive: PK\x03\x04 (0x50 0x4B 0x03 0x04)
    const isDocx =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (!isDocx) {
      return {
        isValid: false,
        error: "Corrupted or invalid DOCX document header.",
        sanitizedFileName: cleanName,
        extension,
        mimeType: detectedMime,
        size: buffer.length,
      };
    }
    detectedMime =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return {
    isValid: true,
    sanitizedFileName: cleanName,
    extension,
    mimeType: detectedMime,
    size: buffer.length,
  };
}
