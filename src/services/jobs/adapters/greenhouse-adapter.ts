/**
 * Greenhouse Job Board Adapter
 *
 * Consumes the official public Greenhouse Job Board API:
 * https://developers.greenhouse.io/job-board.html
 *
 * Endpoint: https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs?content=true
 *
 * No authentication required — these are public job board endpoints.
 * Zero scraping, native fetch, safe timeouts.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { RawJob, FetchOptions, AdapterResult } from "./types";
import { sanitizeApplicationUrl } from "./url-sanitizer";
import type { GreenhouseBoardConfig } from "./ats-board-config";
import type { NormalizedWorkMode } from "@/types/job";

const GREENHOUSE_API_BASE = "https://boards-api.greenhouse.io/v1/boards";
const DEFAULT_TIMEOUT_MS = 10000;

export class GreenhouseAdapter extends BaseJobAdapter {
  readonly sourceType = "ats";
  private readonly config: GreenhouseBoardConfig;

  constructor(config: GreenhouseBoardConfig) {
    super();
    this.config = config;
  }

  get sourceName(): string {
    return `greenhouse:${this.config.boardToken}`;
  }

  get displayName(): string {
    return `${this.config.companyName} (Greenhouse)`;
  }

  override getBaseUrl(): string {
    return `https://boards.greenhouse.io/${this.config.boardToken}`;
  }

  override async isAvailable(): Promise<boolean> {
    return Boolean(this.config.boardToken);
  }

  /**
   * Fetch public job listings from a Greenhouse job board.
   */
  async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
    if (!this.config.boardToken) {
      return {
        jobs: [],
        metadata: { error: "Missing Greenhouse board token" },
      };
    }

    const url = new URL(
      `${GREENHOUSE_API_BASE}/${encodeURIComponent(this.config.boardToken)}/jobs`
    );
    url.searchParams.set("content", "true");

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
          `[GreenhouseAdapter:${this.config.boardToken}] Non-2xx response: ${response.status} ${response.statusText}`
        );
        return {
          jobs: [],
          metadata: {
            statusCode: response.status,
            error: `Greenhouse API returned HTTP ${response.status}`,
          },
        };
      }

      let payload: any;
      try {
        payload = await response.json();
      } catch (jsonErr) {
        console.warn(
          `[GreenhouseAdapter:${this.config.boardToken}] Failed to parse JSON:`,
          jsonErr
        );
        return {
          jobs: [],
          metadata: { error: "Malformed JSON response from Greenhouse" },
        };
      }

      if (!payload || !Array.isArray(payload.jobs)) {
        console.warn(
          `[GreenhouseAdapter:${this.config.boardToken}] Unexpected payload structure`
        );
        return {
          jobs: [],
          metadata: { error: "Unexpected payload structure from Greenhouse" },
        };
      }

      const rawJobs: RawJob[] = [];
      const limit = options?.limit && options.limit > 0 ? options.limit : 100;

      for (const item of payload.jobs) {
        if (rawJobs.length >= limit) break;
        if (!item || typeof item !== "object") continue;

        const externalId = item.id ? String(item.id).trim() : "";
        const title = item.title ? String(item.title).trim() : "";

        // Greenhouse public API embeds the absolute_url as the canonical job page
        const absoluteUrl = item.absolute_url
          ? String(item.absolute_url).trim()
          : "";
        const applicationUrl = sanitizeApplicationUrl(absoluteUrl);

        if (!externalId || !title || !applicationUrl) {
          continue;
        }

        // Location handling — Greenhouse provides location object
        const location = this.extractLocation(item.location);
        const workMode = this.resolveWorkMode(title, location, item);

        // Description: Greenhouse returns HTML content
        const description = item.content
          ? String(item.content)
          : title;

        const postedAt = item.updated_at
          ? new Date(item.updated_at)
          : undefined;

        // Greenhouse provides departments and offices as metadata
        const departments = Array.isArray(item.departments)
          ? item.departments
              .map((d: any) => d?.name)
              .filter(Boolean)
          : [];

        rawJobs.push({
          externalId,
          title,
          company: this.config.companyName,
          companyWebsite: this.config.companyWebsite,
          description,
          location,
          workMode,
          requiredSkills: [],
          preferredSkills: [],
          applicationUrl,
          sourceUrl: applicationUrl,
          postedAt: isNaN(postedAt?.getTime() ?? NaN) ? undefined : postedAt,
          metadata: {
            greenhouseId: item.id,
            boardToken: this.config.boardToken,
            departments,
            offices: Array.isArray(item.offices)
              ? item.offices.map((o: any) => o?.name).filter(Boolean)
              : [],
            internal_job_id: item.internal_job_id || null,
          },
        });
      }

      return {
        jobs: rawJobs,
        totalAvailable: payload.jobs?.length ?? rawJobs.length,
        hasMore: false,
      };
    } catch (err) {
      console.error(
        `[GreenhouseAdapter:${this.config.boardToken}] Network or unexpected failure:`,
        err
      );
      return {
        jobs: [],
        metadata: {
          error:
            err instanceof Error
              ? err.message
              : "Unknown Greenhouse fetch error",
        },
      };
    }
  }

  private extractLocation(loc: any): string | undefined {
    if (!loc || typeof loc !== "object") return undefined;
    return loc.name ? String(loc.name).trim() : undefined;
  }

  private resolveWorkMode(
    title: string,
    location?: string,
    item?: any
  ): NormalizedWorkMode | undefined {
    const text = `${title} ${location || ""}`.toLowerCase();

    if (text.includes("remote")) return "REMOTE";
    if (text.includes("hybrid")) return "HYBRID";

    // Check offices metadata for remote indicator
    if (Array.isArray(item?.offices)) {
      const officeNames = item.offices
        .map((o: any) => String(o?.name || "").toLowerCase())
        .join(" ");
      if (officeNames.includes("remote")) return "REMOTE";
    }

    if (location && location.trim().length > 0) return "ONSITE";

    return undefined;
  }
}
