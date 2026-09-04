/**
 * Remotive Job Adapter
 *
 * Consumes the official, public, open REST API provided by Remotive:
 * https://remotive.com/api/remote-jobs
 *
 * Sourced categories default to software development.
 * 100% compliant with developer terms: zero scraping, native fetch, safe timeouts.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { RawJob, FetchOptions, AdapterResult } from "./types";
import { sanitizeApplicationUrl } from "./url-sanitizer";
import type { NormalizedEmploymentType } from "@/types/job";

const REMOTIVE_API_BASE = "https://remotive.com/api/remote-jobs";
const DEFAULT_TIMEOUT_MS = 10000;

export class RemotiveAdapter extends BaseJobAdapter {
  readonly sourceName = "remotive";
  readonly displayName = "Remotive Remote Jobs";
  readonly sourceType = "api";

  override getBaseUrl(): string {
    return "https://remotive.com";
  }

  override async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Fetch remote software engineering jobs from Remotive public API.
   */
  async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
    const url = new URL(REMOTIVE_API_BASE);
    url.searchParams.set("category", "software-dev");

    if (options?.query) {
      url.searchParams.set("search", options.query.trim());
    }

    if (options?.limit && options.limit > 0) {
      url.searchParams.set("limit", String(options.limit));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "JobFit-Platform/1.0",
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        console.warn(
          `[RemotiveAdapter] Non-2xx response: ${response.status} ${response.statusText}`
        );
        return {
          jobs: [],
          metadata: {
            statusCode: response.status,
            error: `Remotive API error: ${response.statusText}`,
          },
        };
      }

      let payload: any;
      try {
        payload = await response.json();
      } catch (jsonErr) {
        console.warn("[RemotiveAdapter] Failed to parse JSON response:", jsonErr);
        return {
          jobs: [],
          metadata: { error: "Malformed JSON response from Remotive" },
        };
      }

      if (!payload || !Array.isArray(payload.jobs)) {
        console.warn("[RemotiveAdapter] Unexpected payload structure (missing jobs array)");
        return {
          jobs: [],
          metadata: { error: "Unexpected payload structure" },
        };
      }

      const rawJobs: RawJob[] = [];

      for (const item of payload.jobs) {
        if (!item || typeof item !== "object") continue;

        const externalId = item.id ? String(item.id).trim() : "";
        const title = item.title ? String(item.title).trim() : "";
        const company = item.company_name ? String(item.company_name).trim() : "";
        const applicationUrl = sanitizeApplicationUrl(item.url);

        // Required minimal integrity check before mapping
        if (!externalId || !title || !company || !applicationUrl) {
          continue;
        }

        const tags = Array.isArray(item.tags)
          ? item.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [];

        const employmentType = this.mapEmploymentType(item.job_type);

        const postedAt = item.publication_date
          ? new Date(item.publication_date)
          : undefined;

        rawJobs.push({
          externalId,
          title,
          company,
          description: item.description ? String(item.description) : title,
          location: item.candidate_required_location || "Worldwide (Remote)",
          workMode: "REMOTE",
          employmentType,
          requiredSkills: tags,
          preferredSkills: [],
          applicationUrl,
          sourceUrl: applicationUrl,
          postedAt: isNaN(postedAt?.getTime() ?? NaN) ? undefined : postedAt,
          metadata: {
            remotiveId: item.id,
            category: item.category,
            salary: item.salary || null,
            companyLogo: item.company_logo || null,
          },
        });
      }

      return {
        jobs: rawJobs,
        totalAvailable: payload["job-count"] ?? rawJobs.length,
        hasMore: false,
      };
    } catch (err) {
      console.error("[RemotiveAdapter] Network or unexpected failure:", err);
      return {
        jobs: [],
        metadata: {
          error: err instanceof Error ? err.message : "Unknown Remotive fetch error",
        },
      };
    }
  }

  private mapEmploymentType(
    jobType?: string
  ): NormalizedEmploymentType | undefined {
    if (!jobType || typeof jobType !== "string") return undefined;
    const lower = jobType.toLowerCase().replace(/[-_]/g, "");

    if (lower.includes("fulltime")) return "FULL_TIME";
    if (lower.includes("parttime")) return "PART_TIME";
    if (lower.includes("contract") || lower.includes("freelance"))
      return "CONTRACT";
    if (lower.includes("intern")) return "INTERNSHIP";

    return undefined;
  }
}
