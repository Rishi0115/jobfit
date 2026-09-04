"use server";

/**
 * Server Actions — Applications
 * Secure, session-authenticated operations for student job application tracking.
 */

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { applicationsDAL } from "@/dal/applications";
import { matchingService } from "@/services/matching/matching-service";
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  updateApplicationNotesSchema,
  deleteApplicationSchema,
  CreateApplicationInput,
  UpdateApplicationStatusInput,
  UpdateApplicationNotesInput,
  DeleteApplicationInput,
} from "@/lib/validators/applications";
import type { ApplicationStatus } from "@prisma/client";
import type {
  ApplicationWithJob,
  ApplicationStats,
} from "@/types/application";

/**
 * Helper to ensure the request is from an authenticated user.
 */
async function getAuthenticatedUser() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    throw new Error("Unauthorized: Please sign in to access your applications.");
  }

  return user;
}

/**
 * Create a new application / track a job.
 */
export async function createApplicationAction(
  rawInput: CreateApplicationInput
): Promise<{ success: boolean; data?: ApplicationWithJob; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const parsed = createApplicationSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid application data.",
      };
    }

    const application = await applicationsDAL.createApplication({
      userId: user.id as string,
      jobId: parsed.data.jobId,
      status: parsed.data.status,
      notes: parsed.data.notes,
      appliedAt: parsed.data.appliedAt,
      interviewDate: parsed.data.interviewDate,
    });

    revalidatePath("/student/applications");
    revalidatePath(`/student/jobs/${parsed.data.jobId}`);

    return { success: true, data: application };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create application.",
    };
  }
}

/**
 * Quick-action to track a job from the job details page.
 */
export async function trackJobAction(
  jobId: string,
  status: ApplicationStatus = "SAVED"
): Promise<{ success: boolean; data?: ApplicationWithJob; error?: string; alreadyTracked?: boolean }> {
  try {
    const user = await getAuthenticatedUser();

    if (!jobId || typeof jobId !== "string") {
      return { success: false, error: "Valid job ID is required." };
    }

    // Check if already tracked
    const existing = await applicationsDAL.getApplicationByJobId(user.id as string, jobId);
    if (existing) {
      return {
        success: true,
        data: existing,
        alreadyTracked: true,
      };
    }

    const application = await applicationsDAL.createApplication({
      userId: user.id as string,
      jobId,
      status,
    });

    revalidatePath("/student/applications");
    revalidatePath(`/student/jobs/${jobId}`);

    return { success: true, data: application, alreadyTracked: false };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to track job.",
    };
  }
}

/**
 * Get all applications for the authenticated student, enriched with matching scores if available.
 */
export async function getUserApplicationsAction(options?: {
  status?: ApplicationStatus;
  search?: string;
}): Promise<{ success: boolean; data?: ApplicationWithJob[]; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const applications = await applicationsDAL.getUserApplications(
      user.id as string,
      options
    );

    // Reuse existing matching engine if student has an active resume
    try {
      for (const app of applications) {
        if (app.job) {
          const matchResult = await matchingService.getJobMatch(
            user.id as string,
            app.jobId
          );
          if (matchResult) {
            app.matchScore = matchResult.overallScore;
          }
        }
      }
    } catch {
      // Matching enrichment failure should not block application list
    }

    return { success: true, data: applications };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load applications.",
    };
  }
}

/**
 * Get a single application by ID with ownership verification.
 */
export async function getApplicationAction(
  applicationId: string
): Promise<{ success: boolean; data?: ApplicationWithJob; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!applicationId) {
      return { success: false, error: "Application ID is required." };
    }

    const application = await applicationsDAL.getApplicationById(
      applicationId,
      user.id as string
    );

    if (!application) {
      return { success: false, error: "Application not found." };
    }

    return { success: true, data: application };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get application.",
    };
  }
}

/**
 * Update application status (enforces ownership and appends to statusHistory).
 */
export async function updateApplicationStatusAction(
  rawInput: UpdateApplicationStatusInput
): Promise<{ success: boolean; data?: ApplicationWithJob; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const parsed = updateApplicationStatusSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid update data.",
      };
    }

    const updated = await applicationsDAL.updateApplicationStatus(
      parsed.data.applicationId,
      user.id as string,
      parsed.data.status,
      parsed.data.notes,
      parsed.data.interviewDate
    );

    revalidatePath("/student/applications");
    revalidatePath(`/student/jobs/${updated.jobId}`);

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update application status.",
    };
  }
}

/**
 * Update application notes.
 */
export async function updateApplicationNotesAction(
  rawInput: UpdateApplicationNotesInput
): Promise<{ success: boolean; data?: ApplicationWithJob; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const parsed = updateApplicationNotesSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid notes data.",
      };
    }

    const updated = await applicationsDAL.updateApplicationNotes(
      parsed.data.applicationId,
      user.id as string,
      parsed.data.notes
    );

    revalidatePath("/student/applications");

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notes.",
    };
  }
}

/**
 * Delete / remove an application.
 */
export async function deleteApplicationAction(
  rawInput: DeleteApplicationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const parsed = deleteApplicationSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid delete request.",
      };
    }

    await applicationsDAL.deleteApplication(
      parsed.data.applicationId,
      user.id as string
    );

    revalidatePath("/student/applications");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete application.",
    };
  }
}

/**
 * Get aggregated application statistics for the authenticated user.
 */
export async function getApplicationStatsAction(): Promise<{
  success: boolean;
  data?: ApplicationStats;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    const stats = await applicationsDAL.getApplicationStats(user.id as string);
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load application statistics.",
    };
  }
}
