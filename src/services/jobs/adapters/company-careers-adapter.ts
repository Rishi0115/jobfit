/**
 * Company Careers Adapter — Abstract base for company career/ATS integrations.
 *
 * Provides the extension point structure for integrating with official ATS APIs
 * (Greenhouse, Lever, Workable, etc.) where public API access is available.
 *
 * Concrete implementations should be added when API access is configured.
 * This class is NOT meant to be instantiated directly.
 */

import { BaseJobAdapter } from "./base-adapter";
import type { FetchOptions, AdapterResult } from "./types";

/**
 * Configuration for a company careers adapter instance.
 */
export interface CompanyCareersConfig {
  /** Company name */
  companyName: string;
  /** ATS platform (e.g., "greenhouse", "lever", "workable") */
  platform: string;
  /** API base URL for the company's ATS */
  apiBaseUrl: string;
  /** Optional API key (some ATS platforms have public board APIs) */
  apiKey?: string;
  /** Board token or identifier */
  boardToken?: string;
}

export abstract class CompanyCareersAdapter extends BaseJobAdapter {
  readonly sourceType = "ats";
  protected readonly config: CompanyCareersConfig;

  constructor(config: CompanyCareersConfig) {
    super();
    this.config = config;
  }

  get sourceName(): string {
    return `ats-${this.config.platform}-${this.config.companyName
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
  }

  get displayName(): string {
    return `${this.config.companyName} Careers (${this.config.platform})`;
  }

  getBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  abstract fetchJobs(options?: FetchOptions): Promise<AdapterResult>;

  abstract isAvailable(): Promise<boolean>;
}

/**
 * Example Greenhouse adapter stub.
 * Greenhouse provides a public Job Board API: https://developers.greenhouse.io/job-board.html
 *
 * To implement:
 * 1. Set boardToken in config
 * 2. Fetch from https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs
 * 3. Map Greenhouse job format to RawJob
 */
// export class GreenhouseAdapter extends CompanyCareersAdapter {
//   async fetchJobs(options?: FetchOptions): Promise<AdapterResult> {
//     // TODO: Implement when Greenhouse board access is configured
//     throw new Error("GreenhouseAdapter not yet implemented");
//   }
//
//   async isAvailable(): Promise<boolean> {
//     return !!this.config.boardToken;
//   }
// }
