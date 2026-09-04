import { db } from "@/lib/db";
import { Resume, ResumeStatus } from "@prisma/client";

export interface CreateResumeParams {
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isActive: boolean;
  status: ResumeStatus;
  rawText?: string;
  processingError?: string;
}

export const resumesDAL = {
  async findUserResumes(userId: string): Promise<Resume[]> {
    return db.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findUserResumeById(
    id: string,
    userId: string
  ): Promise<Resume | null> {
    return db.resume.findFirst({
      where: { id, userId },
      include: { analysis: true },
    });
  },

  async findActiveResume(userId: string): Promise<Resume | null> {
    return db.resume.findFirst({
      where: { userId, isActive: true },
      include: { analysis: true },
    });
  },

  async getNextVersion(userId: string): Promise<number> {
    const latest = await db.resume.findFirst({
      where: { userId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  },

  async createResume(params: CreateResumeParams): Promise<Resume> {
    // If this new resume is marked active, deactivate existing active resumes
    return db.$transaction(async (tx) => {
      if (params.isActive) {
        await tx.resume.updateMany({
          where: { userId: params.userId, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.resume.create({
        data: {
          userId: params.userId,
          fileName: params.fileName,
          fileUrl: params.fileUrl,
          fileSize: params.fileSize,
          mimeType: params.mimeType,
          version: params.version,
          isActive: params.isActive,
          status: params.status,
          rawText: params.rawText,
          processingError: params.processingError,
        },
      });
    });
  },

  async updateResumeExtraction(
    id: string,
    userId: string,
    rawText: string,
    status: ResumeStatus = "READY"
  ): Promise<Resume> {
    return db.resume.update({
      where: { id },
      data: {
        rawText,
        status,
        processingError: null,
      },
    });
  },

  async updateResumeError(
    id: string,
    userId: string,
    errorMessage: string
  ): Promise<Resume> {
    return db.resume.update({
      where: { id },
      data: {
        status: "FAILED",
        processingError: errorMessage,
      },
    });
  },

  async setActiveResume(id: string, userId: string): Promise<Resume> {
    return db.$transaction(async (tx) => {
      // First verify resume belongs to user
      const target = await tx.resume.findFirst({
        where: { id, userId },
      });

      if (!target) {
        throw new Error("Resume not found or unauthorized");
      }

      // Deactivate all user's resumes
      await tx.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      // Activate selected resume
      return tx.resume.update({
        where: { id },
        data: { isActive: true },
      });
    });
  },

  async deleteResume(
    id: string,
    userId: string
  ): Promise<{ deletedResume: Resume; newlyActiveResume: Resume | null }> {
    return db.$transaction(async (tx) => {
      const resumeToDelete = await tx.resume.findFirst({
        where: { id, userId },
      });

      if (!resumeToDelete) {
        throw new Error("Resume not found or unauthorized");
      }

      const wasActive = resumeToDelete.isActive;

      // Delete record
      await tx.resume.delete({
        where: { id },
      });

      let newlyActiveResume: Resume | null = null;

      // If deleted resume was active, find the most recently created remaining resume and activate it
      if (wasActive) {
        const remaining = await tx.resume.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (remaining) {
          newlyActiveResume = await tx.resume.update({
            where: { id: remaining.id },
            data: { isActive: true },
          });
        }
      }

      return { deletedResume: resumeToDelete, newlyActiveResume };
    });
  },

  async createResumeVersion(params: {
    userId: string;
    sourceResumeId: string;
    rawText: string;
    fileName?: string;
  }): Promise<Resume> {
    return db.$transaction(async (tx) => {
      // 1. Verify source resume belongs to user
      const source = await tx.resume.findFirst({
        where: { id: params.sourceResumeId, userId: params.userId },
      });

      if (!source) {
        throw new Error("Source resume not found or unauthorized");
      }

      // 2. Determine next version number
      const latest = await tx.resume.findFirst({
        where: { userId: params.userId },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const nextVersion = (latest?.version ?? source.version) + 1;

      // 3. Deactivate all existing resumes for this user
      await tx.resume.updateMany({
        where: { userId: params.userId, isActive: true },
        data: { isActive: false },
      });

      // 4. Create new version record preserving original fileUrl while saving updated text
      const baseName = source.fileName.replace(/\.[^/.]+$/, "");
      const ext = source.fileName.split(".").pop() || "txt";
      const newFileName =
        params.fileName || `${baseName}_v${nextVersion}.${ext}`;

      return tx.resume.create({
        data: {
          userId: params.userId,
          fileName: newFileName,
          fileUrl: source.fileUrl,
          fileSize: Buffer.byteLength(params.rawText, "utf8"),
          mimeType: source.mimeType,
          version: nextVersion,
          isActive: true,
          status: "READY",
          rawText: params.rawText,
        },
      });
    });
  },
};
