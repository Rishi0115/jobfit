"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { resumeService } from "@/services/resume/service";
import { getResumeDownloadUrl } from "@/services/resume/storage";
import type { ApiResponse } from "@/types";
import { Resume } from "@prisma/client";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to manage resumes.");
  }
  return session.user.id;
}

/**
 * Server action to upload and process a new resume.
 */
export async function uploadResumeAction(
  formData: FormData
): Promise<ApiResponse<Resume>> {
  try {
    const userId = await getAuthenticatedUserId();

    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return { success: false, error: "No file provided for upload." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await resumeService.processUpload(
      userId,
      file.name,
      buffer,
      file.type
    );

    if (!result.success || !result.resume) {
      return {
        success: false,
        error: result.error || "Failed to process resume.",
      };
    }

    revalidatePath("/resume");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result.resume,
    };
  } catch (error) {
    console.error("[uploadResumeAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload resume.";
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch all resumes for the authenticated user.
 */
export async function getUserResumesAction(): Promise<ApiResponse<Resume[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const resumes = await resumeService.getUserResumes(userId);
    return { success: true, data: resumes };
  } catch (error) {
    console.error("[getUserResumesAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch resumes.";
    return { success: false, error: message };
  }
}

/**
 * Server action to set a resume as active.
 */
export async function setActiveResumeAction(
  resumeId: string
): Promise<ApiResponse<Resume>> {
  try {
    const userId = await getAuthenticatedUserId();
    const resume = await resumeService.setActiveResume(resumeId, userId);

    revalidatePath("/resume");
    revalidatePath("/dashboard");

    return { success: true, data: resume };
  } catch (error) {
    console.error("[setActiveResumeAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to activate resume.";
    return { success: false, error: message };
  }
}

/**
 * Server action to delete a resume.
 */
export async function deleteResumeAction(
  resumeId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const userId = await getAuthenticatedUserId();
    await resumeService.deleteResume(resumeId, userId);

    revalidatePath("/resume");
    revalidatePath("/dashboard");

    return { success: true, data: { deleted: true } };
  } catch (error) {
    console.error("[deleteResumeAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete resume.";
    return { success: false, error: message };
  }
}

/**
 * Server action to retrieve a signed download URL for the resume file.
 */
export async function getResumeDownloadUrlAction(
  resumeId: string
): Promise<ApiResponse<{ downloadUrl: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const resume = await resumeService.getResume(resumeId, userId);

    if (!resume) {
      return { success: false, error: "Resume not found or unauthorized." };
    }

    const downloadUrl = await getResumeDownloadUrl(resume.fileUrl);
    return { success: true, data: { downloadUrl } };
  } catch (error) {
    console.error("[getResumeDownloadUrlAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate download URL.";
    return { success: false, error: message };
  }
}
