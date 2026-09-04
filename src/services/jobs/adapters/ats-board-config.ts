/**
 * ATS Board Configuration — Curated public ATS job boards.
 *
 * Each entry represents a verified, publicly accessible company job board
 * on Greenhouse or Lever. Only boards with confirmed public API access
 * are included here.
 *
 * Board tokens / company slugs are NOT secrets — they are publicly visible
 * in the company's careers page URL and are required to use the public API.
 */

// ─── Greenhouse Board Configuration ───

export interface GreenhouseBoardConfig {
  /** Greenhouse board token (visible in public URL: boards.greenhouse.io/{boardToken}) */
  boardToken: string;
  /** Display name of the company */
  companyName: string;
  /** Optional company website */
  companyWebsite?: string;
}

/**
 * Curated list of verified public Greenhouse job boards.
 *
 * Verification criteria:
 * - The board token is publicly visible on the company's official careers page.
 * - The public API endpoint returns valid JSON with job listings.
 * - These are well-known tech companies with India engineering offices or remote roles.
 *
 * To add a new board, verify the token at:
 *   https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs
 */
export const GREENHOUSE_BOARDS: GreenhouseBoardConfig[] = [
  {
    boardToken: "postman",
    companyName: "Postman",
    companyWebsite: "https://www.postman.com",
  },
  {
    boardToken: "razorpaysoftwareprivatelimited",
    companyName: "Razorpay",
    companyWebsite: "https://razorpay.com",
  },
  {
    boardToken: "caborneodiscoveriesprivatelimited",
    companyName: "CRED",
    companyWebsite: "https://cred.club",
  },
];

// ─── Lever Board Configuration ───

export interface LeverBoardConfig {
  /** Lever company slug (visible in public URL: jobs.lever.co/{companySlug}) */
  companySlug: string;
  /** Display name of the company */
  companyName: string;
  /** Optional company website */
  companyWebsite?: string;
}

/**
 * Curated list of verified public Lever job boards.
 *
 * Verification criteria:
 * - The company slug is publicly visible on the company's official careers page.
 * - The public API endpoint returns valid JSON with postings.
 * - These are well-known tech companies with India/global engineering roles.
 *
 * To add a new board, verify the slug at:
 *   https://api.lever.co/v0/postings/{companySlug}?mode=json
 */
export const LEVER_BOARDS: LeverBoardConfig[] = [
  {
    companySlug: "browserstack",
    companyName: "BrowserStack",
    companyWebsite: "https://www.browserstack.com",
  },
];
