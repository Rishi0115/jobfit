"use server";

/**
 * Server Actions — Job Matching
 *
 * All matching actions enforce strict session derivation.
 * No user-supplied IDs are trusted for candidate data access.
 */

import { auth } from "@/lib/auth";
import { matchingService } from "@/services/matching/matching-service";
import type { ApiResponse } from "@/types";
import type { MatchResult, TopJobMatch } from "@/types/matching";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to access job matches.");
  }
  return session.user.id;
}

/**
 * Get deterministic match result for a single job against the authenticated candidate.
 */
export async function getJobMatchAction(
  jobId: string
): Promise<ApiResponse<MatchResult | null>> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!jobId || typeof jobId !== "string" || jobId.trim().length === 0) {
      return { success: false, error: "Invalid Job ID provided." };
    }

    const match = await matchingService.getJobMatch(userId, jobId.trim());
    return { success: true, data: match };
  } catch (error) {
    console.error("[getJobMatchAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to calculate job match.";
    return { success: false, error: message };
  }
}

/**
 * Get top matching jobs for the authenticated candidate.
 */
export async function getTopMatchesAction(
  limit: number = 10
): Promise<ApiResponse<TopJobMatch[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));

    const topMatches = await matchingService.getTopMatches(userId, safeLimit);
    return { success: true, data: topMatches };
  } catch (error) {
    console.error("[getTopMatchesAction] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to retrieve top job matches.";
    return { success: false, error: message };
  }
}
