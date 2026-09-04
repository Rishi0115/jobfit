/**
 * Job Expiration Service — Marks expired jobs as EXPIRED.
 *
 * Simple deterministic service that checks expiresAt timestamps.
 * No scheduled jobs — callable on-demand.
 */

import { jobsDAL } from "@/dal/jobs";

export class JobExpirationService {
  /**
   * Mark all ACTIVE jobs past their expiresAt date as EXPIRED.
   * @returns Number of jobs marked as expired.
   */
  async markExpiredJobs(): Promise<number> {
    return jobsDAL.markExpiredJobs();
  }
}
