import { resumesDAL } from "@/dal/resumes";
import { validateResumeFile, FileValidationResult } from "./file-validator";
import { uploadResumeFile, deleteResumeFile } from "./storage";
import { storageService } from "@/services/storage";
import { extractResumeText } from "./parser";
import { Resume } from "@prisma/client";

export interface ProcessResumeResult {
  success: boolean;
  resume?: Resume;
  error?: string;
  extractedWordCount?: number;
}

export class ResumeService {
  /**
   * Process a resume upload for an authenticated user.
   */
  async processUpload(
    userId: string,
    fileName: string,
    buffer: Buffer,
    mimeType?: string
  ): Promise<ProcessResumeResult> {
    // 1. Validate file format, size, and magic bytes
    const validation: FileValidationResult = validateResumeFile(
      fileName,
      buffer,
      mimeType
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || "Invalid resume file.",
      };
    }

    let storageKey = "";

    try {
      // 2. Upload file to private storage
      const storageResult = await uploadResumeFile(
        userId,
        validation.sanitizedFileName,
        buffer,
        validation.mimeType,
        validation.extension
      );
      storageKey = storageResult.storageKey;

      // 3. Determine version number
      const nextVersion = await resumesDAL.getNextVersion(userId);

      // 4. Create database record with PROCESSING status
      const resume = await resumesDAL.createResume({
        userId,
        fileName: validation.sanitizedFileName,
        fileUrl: storageResult.storageKey,
        fileSize: validation.size,
        mimeType: validation.mimeType,
        version: nextVersion,
        isActive: true, // newly uploaded resume becomes active by default
        status: "PROCESSING",
      });

      // 5. Extract text from document
      try {
        // Retrieve uploaded file bytes from storage to ensure the extraction pipeline parses the persisted artifact
        let fileBytes = buffer;
        try {
          const downloaded = await storageService.download(storageKey);
          if (downloaded && downloaded.length > 0) {
            fileBytes = downloaded;
          }
        } catch {
          fileBytes = buffer;
        }

        const extraction = await extractResumeText(
          fileBytes,
          validation.extension
        );

        if (!extraction.text || extraction.text.length < 20) {
          throw new Error(
            "Could not extract sufficient readable text from the document. Please ensure it is not scanned or image-only."
          );
        }

        // 6. Update record with extracted text and READY status
        const updatedResume = await resumesDAL.updateResumeExtraction(
          resume.id,
          userId,
          extraction.text,
          "READY"
        );

        return {
          success: true,
          resume: updatedResume,
          extractedWordCount: extraction.wordCount,
        };
      } catch (extractionError) {
        const errorMessage =
          extractionError instanceof Error
            ? extractionError.message
            : "Text extraction failed.";

        const failedResume = await resumesDAL.updateResumeError(
          resume.id,
          userId,
          errorMessage
        );

        return {
          success: false,
          resume: failedResume,
          error: `Resume saved but text extraction failed: ${errorMessage}`,
        };
      }
    } catch (error) {
      // Clean up storage if DB record creation failed
      if (storageKey) {
        try {
          await deleteResumeFile(storageKey);
        } catch {
          // ignore cleanup error
        }
      }

      const message =
        error instanceof Error ? error.message : "Failed to upload resume.";
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Delete resume and clean up storage object safely.
   */
  async deleteResume(id: string, userId: string): Promise<boolean> {
    const { deletedResume } = await resumesDAL.deleteResume(id, userId);

    if (deletedResume.fileUrl) {
      try {
        await deleteResumeFile(deletedResume.fileUrl);
      } catch (error) {
        console.error(
          `[ResumeService] Failed to delete storage file ${deletedResume.fileUrl}:`,
          error
        );
      }
    }

    return true;
  }

  async setActiveResume(id: string, userId: string): Promise<Resume> {
    return resumesDAL.setActiveResume(id, userId);
  }

  async getUserResumes(userId: string): Promise<Resume[]> {
    return resumesDAL.findUserResumes(userId);
  }

  async getResume(id: string, userId: string): Promise<Resume | null> {
    return resumesDAL.findUserResumeById(id, userId);
  }
}

export const resumeService = new ResumeService();
