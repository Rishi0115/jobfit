/**
 * Adzuna Job Adapter (India Market)
 *
 * Consumes the official Adzuna REST API for India (`in` country code):
 * https://api.adzuna.com/v1/api/jobs/in/search/{page}
 *
 * Server-only credentials:
 * - ADZUNA_APP_ID
 * - ADZUNA_APP_KEY
 *
 * 100% compliant with developer terms: zero scraping, native fetch, safe timeouts.
 * Never leaks API credentials in logs, errors, or metadata.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { RawJob, FetchOptions, AdapterResult } from "./types";
import { sanitizeApplicationUrl } from "./url-sanitizer";
import type {
  NormalizedEmploymentType,
  NormalizedWorkMode,
} from "@/types/job";

const ADZUNA_API_BASE = "https://api.adzuna.com/v1/api/jobs/in/search/1";
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_SEARCH_TERM = "software engineer";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export class AdzunaAdapter extends BaseJobAdapter {
  readonly sourceName = "adzuna-in";
  readonly displayName = "Adzuna India";
  readonly sourceType = "api";

  private getCredentials(): { appId: string; appKey: string } | null {
    const appId = process.env.ADZUNA_APP_ID?.trim();
    const appKey = process.env.ADZUNA_APP_KEY?.trim();

    if (!appId || !appKey) {
      return null;
    }

    return { appId, appKey };
  }

  override getBaseUrl(): string {
    return "https://www.adzuna.in";
  }

  override async isAvailable(): Promise<boolean> {
    return this.getCredentials() !== null;
  }

  /**
   * Fetch software engineering and developer jobs from Adzuna India.
   */
  async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
    const credentials = this.getCredentials();
    if (!credentials) {
      return {
        jobs: [],
        metadata: {
          error: "Missing Adzuna credentials (ADZUNA_APP_ID or ADZUNA_APP_KEY)",
        },
      };
    }

    const searchTerm = options?.query?.trim() || DEFAULT_SEARCH_TERM;
    const limit = Math.max(
      1,
      Math.min(MAX_PAGE_SIZE, options?.limit || DEFAULT_PAGE_SIZE)
    );

    const url = new URL(ADZUNA_API_BASE);
    url.searchParams.set("app_id", credentials.appId);
    url.searchParams.set("app_key", credentials.appKey);
    url.searchParams.set("what", searchTerm);
    url.searchParams.set("results_per_page", String(limit));
    url.searchParams.set("content-type", "application/json");

    if (options?.location?.trim()) {
      url.searchParams.set("where", options.location.trim());
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
          `[AdzunaAdapter] Non-2xx HTTP response: ${response.status} ${response.statusText}`
        );
        return {
          jobs: [],
          metadata: {
            statusCode: response.status,
            error: `Adzuna API returned HTTP ${response.status}`,
          },
        };
      }

      let payload: any;
      try {
        payload = await response.json();
      } catch (jsonErr) {
        console.warn("[AdzunaAdapter] Failed to parse JSON response:", jsonErr);
        return {
          jobs: [],
          metadata: { error: "Malformed JSON response from Adzuna" },
        };
      }

      if (!payload || !Array.isArray(payload.results)) {
        console.warn(
          "[AdzunaAdapter] Unexpected payload structure (missing results array)"
        );
        return {
          jobs: [],
          metadata: { error: "Unexpected payload structure from Adzuna" },
        };
      }

      const rawJobs: RawJob[] = [];

      for (const item of payload.results) {
        if (!item || typeof item !== "object") continue;

        const externalId = item.id ? String(item.id).trim() : "";
        const title = item.title ? String(item.title).trim() : "";
        const company =
          item.company && typeof item.company === "object"
            ? String(item.company.display_name || "").trim()
            : "";
        const applicationUrl = sanitizeApplicationUrl(item.redirect_url);

        // Required minimal integrity check before mapping
        if (!externalId || !title || !company || !applicationUrl) {
          continue;
        }

        const location =
          item.location && typeof item.location === "object"
            ? item.location.display_name || "India"
            : "India";

        const workMode = this.resolveWorkMode(title, location, item.description);
        const employmentType = this.mapEmploymentType(
          item.contract_time,
          item.contract_type
        );

        const salaryMin =
          typeof item.salary_min === "number" && item.salary_min > 0
            ? Math.round(item.salary_min)
            : undefined;
        const salaryMax =
          typeof item.salary_max === "number" && item.salary_max > 0
            ? Math.round(item.salary_max)
            : undefined;
        const salaryCurrency =
          salaryMin !== undefined || salaryMax !== undefined ? "INR" : undefined;

        const postedAt = item.created ? new Date(item.created) : undefined;

        rawJobs.push({
          externalId,
          title,
          company,
          description: item.description ? String(item.description) : title,
          location,
          workMode,
          employmentType,
          salaryMin,
          salaryMax,
          salaryCurrency,
          requiredSkills: [],
          preferredSkills: [],
          applicationUrl,
          sourceUrl: applicationUrl,
          postedAt: isNaN(postedAt?.getTime() ?? NaN) ? undefined : postedAt,
          metadata: {
            adzunaId: item.id,
            category: item.category?.label || null,
            contractType: item.contract_type || null,
            contractTime: item.contract_time || null,
            area: Array.isArray(item.location?.area) ? item.location.area : [],
            salaryPredicted: item.salary_is_predicted === 1,
          },
        });
      }

      return {
        jobs: rawJobs,
        totalAvailable: payload.count ?? rawJobs.length,
        hasMore: false,
      };
    } catch (err) {
      console.error("[AdzunaAdapter] Network or unexpected failure:", err);
      return {
        jobs: [],
        metadata: {
          error:
            err instanceof Error ? err.message : "Unknown Adzuna fetch error",
        },
      };
    }
  }

  private resolveWorkMode(
    title: string,
    location?: string,
    description?: string
  ): NormalizedWorkMode | undefined {
    const text = `${title} ${location || ""} ${description || ""}`.toLowerCase();

    if (text.includes("remote") || text.includes("work from home")) {
      return "REMOTE";
    }
    if (text.includes("hybrid")) {
      return "HYBRID";
    }
    if (location && location.trim().length > 0) {
      return "ONSITE";
    }

    return undefined;
  }

  private mapEmploymentType(
    contractTime?: string,
    contractType?: string
  ): NormalizedEmploymentType | undefined {
    const time = contractTime?.toLowerCase() || "";
    const type = contractType?.toLowerCase() || "";

    if (time.includes("full") || type.includes("permanent")) {
      return "FULL_TIME";
    }
    if (time.includes("part")) {
      return "PART_TIME";
    }
    if (type.includes("contract")) {
      return "CONTRACT";
    }
    if (type.includes("intern") || time.includes("intern")) {
      return "INTERNSHIP";
    }

    return undefined;
  }
}
