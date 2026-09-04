/**
 * External URL Sanitizer
 *
 * Validates and sanitizes external application and source URLs.
 * Strictly enforces HTTP and HTTPS protocols to prevent SSRF,
 * script execution (javascript:), data URIs (data:), and relative path errors.
 */

export function sanitizeApplicationUrl(
  url?: string | null
): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}
