/**
 * Lever Job Postings Adapter
 *
 * Consumes the official public Lever Postings API:
 * https://github.com/lever/postings-api
 *
 * Endpoint: https://api.lever.co/v0/postings/{companySlug}?mode=json
 *
 * No authentication required — these are public posting endpoints.
 * Zero scraping, native fetch, safe timeouts.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { RawJob, FetchOptions, AdapterResult } from "./types";
import { sanitizeApplicationUrl } from "./url-sanitizer";
import type { LeverBoardConfig } from "./ats-board-config";
import type {
  NormalizedWorkMode,
  NormalizedEmploymentType,
} from "@/types/job";

const LEVER_API_BASE = "https://api.lever.co/v0/postings";
const DEFAULT_TIMEOUT_MS = 10000;

export class LeverAdapter extends BaseJobAdapter {
  readonly sourceType = "ats";
  private readonly config: LeverBoardConfig;

  constructor(config: LeverBoardConfig) {
    super();
    this.config = config;
  }

  get sourceName(): string {
    return `lever:${this.config.companySlug}`;
  }

  get displayName(): string {
    return `${this.config.companyName} (Lever)`;
  }

  override getBaseUrl(): string {
    return `https://jobs.lever.co/${this.config.companySlug}`;
  }

  override async isAvailable(): Promise<boolean> {
    return Boolean(this.config.companySlug);
  }

  /**
   * Fetch public job postings from a Lever company page.
   */
  async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
    if (!this.config.companySlug) {
      return {
        jobs: [],
        metadata: { error: "Missing Lever company slug" },
      };
    }

    const url = new URL(
      `${LEVER_API_BASE}/${encodeURIComponent(this.config.companySlug)}`
    );
    url.searchParams.set("mode", "json");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        DEFAULT_TIMEOUT_MS
      );

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
          `[LeverAdapter:${this.config.companySlug}] Non-2xx response: ${response.status} ${response.statusText}`
        );
        return {
          jobs: [],
          metadata: {
            statusCode: response.status,
            error: `Lever API returned HTTP ${response.status}`,
          },
        };
      }

      let payload: any;
      try {
        payload = await response.json();
      } catch (jsonErr) {
        console.warn(
          `[LeverAdapter:${this.config.companySlug}] Failed to parse JSON:`,
          jsonErr
        );
        return {
          jobs: [],
          metadata: { error: "Malformed JSON response from Lever" },
        };
      }

      // Lever returns a flat array of postings
      if (!Array.isArray(payload)) {
        console.warn(
          `[LeverAdapter:${this.config.companySlug}] Unexpected payload structure (not an array)`
        );
        return {
          jobs: [],
          metadata: { error: "Unexpected payload structure from Lever" },
        };
      }

      const rawJobs: RawJob[] = [];
      const limit = options?.limit && options.limit > 0 ? options.limit : 100;

      for (const item of payload) {
        if (rawJobs.length >= limit) break;
        if (!item || typeof item !== "object") continue;

        const externalId = item.id ? String(item.id).trim() : "";
        const title = item.text ? String(item.text).trim() : "";

        // Lever provides hostedUrl as the canonical posting page with apply form
        const hostedUrl = item.hostedUrl
          ? String(item.hostedUrl).trim()
          : "";
        const applyUrl = item.applyUrl
          ? String(item.applyUrl).trim()
          : "";
        const applicationUrl =
          sanitizeApplicationUrl(hostedUrl) ||
          sanitizeApplicationUrl(applyUrl);

        if (!externalId || !title || !applicationUrl) {
          continue;
        }

        // Location handling — Lever provides location as a string
        const location = item.categories?.location
          ? String(item.categories.location).trim()
          : undefined;
        const workMode = this.resolveWorkMode(title, location, item);
        const employmentType = this.mapCommitment(item.categories?.commitment);

        // Description: Lever provides descriptionPlain and lists
        const description = this.buildDescription(item);

        const postedAt = item.createdAt
          ? new Date(item.createdAt)
          : undefined;

        rawJobs.push({
          externalId,
          title,
          company: this.config.companyName,
          companyWebsite: this.config.companyWebsite,
          description,
          location,
          workMode,
          employmentType,
          requiredSkills: [],
          preferredSkills: [],
          applicationUrl,
          sourceUrl: applicationUrl,
          postedAt: isNaN(postedAt?.getTime() ?? NaN) ? undefined : postedAt,
          metadata: {
            leverId: item.id,
            companySlug: this.config.companySlug,
            team: item.categories?.team || null,
            department: item.categories?.department || null,
            commitment: item.categories?.commitment || null,
            allLocations: item.categories?.allLocations || null,
          },
        });
      }

      return {
        jobs: rawJobs,
        totalAvailable: payload.length,
        hasMore: false,
      };
    } catch (err) {
      console.error(
        `[LeverAdapter:${this.config.companySlug}] Network or unexpected failure:`,
        err
      );
      return {
        jobs: [],
        metadata: {
          error:
            err instanceof Error
              ? err.message
              : "Unknown Lever fetch error",
        },
      };
    }
  }

  private buildDescription(item: any): string {
    const parts: string[] = [];

    if (item.descriptionPlain) {
      parts.push(String(item.descriptionPlain));
    }

    if (Array.isArray(item.lists)) {
      for (const list of item.lists) {
        if (list.text) parts.push(String(list.text));
        if (list.content) parts.push(String(list.content));
      }
    }

    if (item.additionalPlain) {
      parts.push(String(item.additionalPlain));
    }

    return parts.join("\n\n") || item.text || "";
  }

  private resolveWorkMode(
    title: string,
    location?: string,
    item?: any
  ): NormalizedWorkMode | undefined {
    const text =
      `${title} ${location || ""} ${item?.categories?.commitment || ""}`.toLowerCase();

    if (text.includes("remote")) return "REMOTE";
    if (text.includes("hybrid")) return "HYBRID";

    // Check allLocations for remote
    if (Array.isArray(item?.categories?.allLocations)) {
      const all = item.categories.allLocations
        .map((l: unknown) => String(l).toLowerCase())
        .join(" ");
      if (all.includes("remote")) return "REMOTE";
    }

    if (location && location.trim().length > 0) return "ONSITE";

    return undefined;
  }

  private mapCommitment(
    commitment?: string
  ): NormalizedEmploymentType | undefined {
    if (!commitment || typeof commitment !== "string") return undefined;
    const lower = commitment.toLowerCase().replace(/[-_\s]/g, "");

    if (lower.includes("fulltime")) return "FULL_TIME";
    if (lower.includes("parttime")) return "PART_TIME";
    if (lower.includes("contract") || lower.includes("freelance"))
      return "CONTRACT";
    if (lower.includes("intern")) return "INTERNSHIP";

    return undefined;
  }
}
