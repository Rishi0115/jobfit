/**
 * Matching Service Layer
 *
 * Orchestrates loading candidate profile and jobs through the DAL,
 * maps DB entities to normalized engine inputs, and invokes the pure matching engine.
 */

import { matchingDAL } from "@/dal/matching";
import { calculateMatchScore } from "./engine";
import type { MatchResult, TopJobMatch } from "@/types/matching";
import type { JobWithRelations } from "@/types/job";

export class MatchingService {
  /**
   * Calculate match score for a specific user and job.
   */
  async getJobMatch(
    userId: string,
    jobId: string
  ): Promise<MatchResult | null> {
    if (!userId || !jobId) return null;

    const [candidate, job] = await Promise.all([
      matchingDAL.getCandidateProfile(userId),
      matchingDAL.getJobById(jobId),
    ]);

    if (!candidate || !job) return null;

    const jobInput = matchingDAL.mapJobToMatchingInput(job);
    return calculateMatchScore(candidate, jobInput);
  }

  /**
   * Retrieve the student's best matching jobs, sorted descending by match score.
   */
  async getTopMatches(
    userId: string,
    limit: number = 10
  ): Promise<TopJobMatch[]> {
    if (!userId) return [];

    const candidate = await matchingDAL.getCandidateProfile(userId);
    if (!candidate) return [];

    // If candidate has zero skills and no profile attributes, return empty
    if (
      candidate.skills.length === 0 &&
      !candidate.targetRole &&
      !candidate.experienceLevel
    ) {
      return [];
    }

    // Fetch active jobs (bounded to prevent excessive memory usage)
    const activeJobs = await matchingDAL.getActiveJobsForMatching(100);
    if (activeJobs.length === 0) return [];

    // Evaluate all active jobs against candidate
    const scoredJobs: TopJobMatch[] = [];

    for (const job of activeJobs) {
      const jobInput = matchingDAL.mapJobToMatchingInput(job);
      const match = calculateMatchScore(candidate, jobInput);
      scoredJobs.push({ job, match });
    }

    // Sort descending by overallScore. On ties, break by postedAt / createdAt descending
    scoredJobs.sort((a, b) => {
      if (b.match.overallScore !== a.match.overallScore) {
        return b.match.overallScore - a.match.overallScore;
      }
      const timeA = a.job.postedAt ? new Date(a.job.postedAt).getTime() : 0;
      const timeB = b.job.postedAt ? new Date(b.job.postedAt).getTime() : 0;
      return timeB - timeA;
    });

    return scoredJobs.slice(0, Math.max(1, limit));
  }

  /**
   * Evaluate a specific list of jobs in memory for an active student.
   * Returns a Map of jobId -> MatchResult for instant UI lookup.
   */
  async getMatchesForJobs(
    userId: string,
    jobs: JobWithRelations[]
  ): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>();
    if (!userId || jobs.length === 0) return results;

    const candidate = await matchingDAL.getCandidateProfile(userId);
    if (!candidate) return results;

    for (const job of jobs) {
      const jobInput = matchingDAL.mapJobToMatchingInput(job);
      const match = calculateMatchScore(candidate, jobInput);
      results.set(job.id, match);
    }

    return results;
  }
}

export const matchingService = new MatchingService();
