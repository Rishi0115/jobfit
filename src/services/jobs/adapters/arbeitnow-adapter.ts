/**
 * Arbeitnow Job Board Adapter
 *
 * Consumes the official, public, open REST API provided by Arbeitnow:
 * https://www.arbeitnow.com/api/job-board-api
 *
 * 100% compliant with developer terms: zero scraping, native fetch, safe timeouts.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { RawJob, FetchOptions, AdapterResult } from "./types";
import { sanitizeApplicationUrl } from "./url-sanitizer";
import type { NormalizedEmploymentType, NormalizedWorkMode } from "@/types/job";

const ARBEITNOW_API_BASE = "https://www.arbeitnow.com/api/job-board-api";
const DEFAULT_TIMEOUT_MS = 10000;

export class ArbeitnowAdapter extends BaseJobAdapter {
  readonly sourceName = "arbeitnow";
  readonly displayName = "Arbeitnow Job Board";
  readonly sourceType = "api";

  override getBaseUrl(): string {
    return "https://www.arbeitnow.com";
  }

  override async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Fetch tech jobs from Arbeitnow public API.
   */
  async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
    const url = new URL(ARBEITNOW_API_BASE);

    if (options?.query) {
      url.searchParams.set("search", options.query.trim());
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
          `[ArbeitnowAdapter] Non-2xx response: ${response.status} ${response.statusText}`
        );
        return {
          jobs: [],
          metadata: {
            statusCode: response.status,
            error: `Arbeitnow API error: ${response.statusText}`,
          },
        };
      }

      let payload: any;
      try {
        payload = await response.json();
      } catch (jsonErr) {
        console.warn("[ArbeitnowAdapter] Failed to parse JSON response:", jsonErr);
        return {
          jobs: [],
          metadata: { error: "Malformed JSON response from Arbeitnow" },
        };
      }

      if (!payload || !Array.isArray(payload.data)) {
        console.warn("[ArbeitnowAdapter] Unexpected payload structure (missing data array)");
        return {
          jobs: [],
          metadata: { error: "Unexpected payload structure" },
        };
      }

      const rawJobs: RawJob[] = [];

      for (const item of payload.data) {
        if (!item || typeof item !== "object") continue;

        const externalId = item.slug
          ? String(item.slug).trim()
          : item.id
          ? String(item.id).trim()
          : "";
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

        const workMode: NormalizedWorkMode | undefined = item.remote
          ? "REMOTE"
          : item.location
          ? "ONSITE"
          : undefined;

        const employmentType = this.mapEmploymentType(item.job_types);

        let postedAt: Date | undefined;
        if (typeof item.created_at === "number") {
          postedAt = new Date(item.created_at * 1000);
        } else if (item.created_at) {
          postedAt = new Date(item.created_at);
        }

        rawJobs.push({
          externalId,
          title,
          company,
          description: item.description ? String(item.description) : title,
          location: item.location || (item.remote ? "Remote" : undefined),
          workMode,
          employmentType,
          requiredSkills: tags,
          preferredSkills: [],
          applicationUrl,
          sourceUrl: applicationUrl,
          postedAt: isNaN(postedAt?.getTime() ?? NaN) ? undefined : postedAt,
          metadata: {
            slug: item.slug,
            remote: Boolean(item.remote),
            tags: item.tags || [],
            jobTypes: item.job_types || [],
          },
        });
      }

      return {
        jobs: rawJobs,
        totalAvailable: payload.meta?.total ?? rawJobs.length,
        hasMore: Boolean(payload.links?.next),
      };
    } catch (err) {
      console.error("[ArbeitnowAdapter] Network or unexpected failure:", err);
      return {
        jobs: [],
        metadata: {
          error: err instanceof Error ? err.message : "Unknown Arbeitnow fetch error",
        },
      };
    }
  }

  private mapEmploymentType(
    jobTypes?: unknown
  ): NormalizedEmploymentType | undefined {
    if (!Array.isArray(jobTypes)) return undefined;

    const lower = jobTypes.map((t) =>
      String(t).toLowerCase().replace(/[-_]/g, "")
    );

    if (lower.some((t) => t.includes("fulltime"))) return "FULL_TIME";
    if (lower.some((t) => t.includes("parttime"))) return "PART_TIME";
    if (lower.some((t) => t.includes("contract") || t.includes("freelance")))
      return "CONTRACT";
    if (lower.some((t) => t.includes("intern"))) return "INTERNSHIP";

    return undefined;
  }
}
