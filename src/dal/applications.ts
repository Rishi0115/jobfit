/**
 * Data Access Layer — Applications
 * Centralized, secure database access for student job applications.
 * All operations enforce session-derived userId ownership.
 */

import { db } from "@/lib/db";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import type {
  ApplicationWithJob,
  ApplicationStats,
  StatusHistoryEntry,
} from "@/types/application";

const applicationWithJobInclude = {
  job: {
    select: {
      id: true,
      title: true,
      companyName: true,
      location: true,
      workMode: true,
      employmentType: true,
      experienceLevel: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      applicationUrl: true,
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          website: true,
        },
      },
    },
  },
} satisfies Prisma.ApplicationInclude;

export interface CreateApplicationParams {
  userId: string;
  jobId: string;
  status?: ApplicationStatus;
  notes?: string | null;
  appliedAt?: Date | null;
  interviewDate?: Date | null;
}

export interface GetApplicationsOptions {
  status?: ApplicationStatus;
  search?: string;
}

export const applicationsDAL = {
  /**
   * Find an application by user and job (prevent duplicates).
   */
  async getApplicationByJobId(
    userId: string,
    jobId: string
  ): Promise<ApplicationWithJob | null> {
    const app = await db.application.findUnique({
      where: {
        userId_jobId: { userId, jobId },
      },
      include: applicationWithJobInclude,
    });
    return (app as unknown as ApplicationWithJob) ?? null;
  },

  /**
   * Create a new application record.
   * Enforces @@unique([userId, jobId]) and initializes statusHistory.
   */
  async createApplication(
    params: CreateApplicationParams
  ): Promise<ApplicationWithJob> {
    const { userId, jobId, notes, interviewDate } = params;
    const status: ApplicationStatus = params.status || "SAVED";

    // Check for existing application
    const existing = await db.application.findUnique({
      where: {
        userId_jobId: { userId, jobId },
      },
    });

    if (existing) {
      throw new Error("You have already added this job to your applications.");
    }

    const initialHistory: StatusHistoryEntry[] = [
      {
        status,
        timestamp: new Date().toISOString(),
        notes: notes ?? undefined,
      },
    ];

    const appliedAt =
      params.appliedAt || (status === "APPLIED" ? new Date() : null);

    const created = await db.application.create({
      data: {
        userId,
        jobId,
        status,
        notes: notes || null,
        appliedAt,
        interviewDate: interviewDate || null,
        statusHistory: initialHistory as unknown as Prisma.InputJsonValue,
      },
      include: applicationWithJobInclude,
    });

    return created as unknown as ApplicationWithJob;
  },

  /**
   * Get all applications for an authenticated user with optional filtering.
   */
  async getUserApplications(
    userId: string,
    options?: GetApplicationsOptions
  ): Promise<ApplicationWithJob[]> {
    const where: Prisma.ApplicationWhereInput = {
      userId,
    };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      where.OR = [
        {
          job: {
            title: { contains: term, mode: "insensitive" },
          },
        },
        {
          job: {
            companyName: { contains: term, mode: "insensitive" },
          },
        },
      ];
    }

    const applications = await db.application.findMany({
      where,
      include: applicationWithJobInclude,
      orderBy: { updatedAt: "desc" },
    });

    return applications as unknown as ApplicationWithJob[];
  },

  /**
   * Get an application by ID, strictly scoped to the requesting user.
   */
  async getApplicationById(
    applicationId: string,
    userId: string
  ): Promise<ApplicationWithJob | null> {
    const application = await db.application.findFirst({
      where: {
        id: applicationId,
        userId,
      },
      include: applicationWithJobInclude,
    });

    return (application as unknown as ApplicationWithJob) ?? null;
  },

  /**
   * Update application status and append to statusHistory.
   */
  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    newStatus: ApplicationStatus,
    notes?: string | null,
    interviewDate?: Date | null
  ): Promise<ApplicationWithJob> {
    const existing = await db.application.findFirst({
      where: {
        id: applicationId,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Application not found or you do not have permission to modify it.");
    }

    // Parse existing statusHistory
    let history: StatusHistoryEntry[] = [];
    if (Array.isArray(existing.statusHistory)) {
      history = existing.statusHistory as unknown as StatusHistoryEntry[];
    }

    // Append new entry
    history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      notes: notes ?? undefined,
    });

    const data: Prisma.ApplicationUpdateInput = {
      status: newStatus,
      statusHistory: history as unknown as Prisma.InputJsonValue,
    };

    if (notes !== undefined) {
      data.notes = notes;
    }

    if (interviewDate !== undefined) {
      data.interviewDate = interviewDate;
    }

    if (newStatus === "APPLIED" && !existing.appliedAt) {
      data.appliedAt = new Date();
    }

    const updated = await db.application.update({
      where: { id: applicationId },
      data,
      include: applicationWithJobInclude,
    });

    return updated as unknown as ApplicationWithJob;
  },

  /**
   * Update application notes without changing status.
   */
  async updateApplicationNotes(
    applicationId: string,
    userId: string,
    notes: string | null
  ): Promise<ApplicationWithJob> {
    const existing = await db.application.findFirst({
      where: {
        id: applicationId,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Application not found or you do not have permission to modify it.");
    }

    const updated = await db.application.update({
      where: { id: applicationId },
      data: { notes },
      include: applicationWithJobInclude,
    });

    return updated as unknown as ApplicationWithJob;
  },

  /**
   * Delete an application (only owner can delete).
   */
  async deleteApplication(
    applicationId: string,
    userId: string
  ): Promise<{ success: true }> {
    const existing = await db.application.findFirst({
      where: {
        id: applicationId,
        userId,
      },
    });

    if (!existing) {
      throw new Error("Application not found or you do not have permission to delete it.");
    }

    await db.application.delete({
      where: { id: applicationId },
    });

    return { success: true };
  },

  /**
   * Compute aggregated statistics from live database records.
   */
  async getApplicationStats(userId: string): Promise<ApplicationStats> {
    const counts = await db.application.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    });

    const stats: ApplicationStats = {
      total: 0,
      saved: 0,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const group of counts) {
      const count = group._count.id;
      stats.total += count;

      switch (group.status) {
        case "SAVED":
          stats.saved = count;
          break;
        case "APPLIED":
          stats.applied = count;
          break;
        case "SHORTLISTED":
          stats.shortlisted = count;
          break;
        case "INTERVIEW":
          stats.interview = count;
          break;
        case "OFFER":
          stats.offer = count;
          break;
        case "REJECTED":
          stats.rejected = count;
          break;
      }
    }

    return stats;
  },
};
