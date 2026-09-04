/**
 * Job Description Sanitizer and Normalizer
 *
 * Provides safe HTML entity decoding, HTML sanitization, and plain text formatting
 * for job descriptions across all external providers (Greenhouse, Remotive, Arbeitnow, etc.).
 */

const ALLOWED_TAGS = new Set([
  "p",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "br",
  "hr",
  "a",
  "blockquote",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

/**
 * Decode common HTML entities (including numerical and hex entities).
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";

  let result = text;

  // Function to perform single pass decode
  const singleDecode = (str: string): string => {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        return code > 0 && code < 65536 ? String.fromCharCode(code) : "";
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return code > 0 && code < 65536 ? String.fromCharCode(code) : "";
      })
      .replace(/&amp;/g, "&"); // amp last to avoid creating double-decoded entities in one pass
  };

  // If text contains any HTML entities, decode it
  if (result.includes("&")) {
    result = singleDecode(result);
    // If it was double-encoded (e.g. &amp;lt; became &lt; or &amp;amp; became &amp;), decode second pass if entities remain
    if (/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/.test(result)) {
      result = singleDecode(result);
    }
  }

  return result;
}

/**
 * Check if the string contains actual HTML tags.
 */
export function containsHtmlTags(text: string): boolean {
  if (!text) return false;
  return /<\/?(?:p|div|span|h[1-6]|ul|ol|li|strong|b|em|i|u|a|br|hr|table|blockquote|pre|code)[^>]*>/i.test(text);
}

/**
 * Sanitize an HTML string:
 * - Strips malicious tags (<script>, <style>, <iframe>, <object>, <embed>, <form>, etc.)
 * - Strips event handlers (onload, onerror, onclick, etc.)
 * - Validates links (only allows http, https, mailto; strips javascript: and data:)
 * - Enforces target="_blank" and rel="noopener noreferrer" on external links
 * - Retains only safe whitelisted tags and attributes
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  // 1. Remove dangerous blocks and their contents entirely
  let clean = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi, "");

  // 2. Strip dangerous standalone tags
  clean = clean.replace(/<\/?(?:input|button|select|textarea|link|meta|base|applet)\b[^>]*>/gi, "");

  // 3. Strip all event handlers (e.g. onerror=..., onclick=..., onload=...)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 4. Sanitize <a> tags (validate href, force safe rel and target)
  clean = clean.replace(/<a\b([^>]*)>/gi, (_, attributes) => {
    const hrefMatch = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] : "";

    // Reject javascript:, data:, vbscript:, or empty links
    const isSafeHref = /^(?:https?:|mailto:)/i.test(href.trim());

    if (!isSafeHref) {
      return `<span>`;
    }

    return `<a href="${href.trim()}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">`;
  });

  // 5. Filter all tags against the whitelist
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)\b([^>]*)>/gi, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return ""; // Strip unwhitelisted tags
    }

    // Closing tag
    if (match.startsWith("</")) {
      return `</${lowerTag}>`;
    }

    // Self closing or open tag
    if (lowerTag === "br" || lowerTag === "hr") {
      return `<${lowerTag} />`;
    }

    // Preserve existing class or add clean typography
    if (lowerTag === "a") {
      return match; // Already sanitized in step 4
    }

    return `<${lowerTag}>`;
  });

  return clean.trim();
}

export interface SanitizedJobDescription {
  content: string;
  isHtml: boolean;
}

/**
 * Process a job description at the application boundary:
 * Decodes HTML entities, determines if HTML or plain-text,
 * sanitizes if HTML, and returns the clean representation.
 */
export function processJobDescription(rawDescription: string): SanitizedJobDescription {
  if (!rawDescription) {
    return { content: "", isHtml: false };
  }

  // 1. Decode entities
  const decoded = decodeHtmlEntities(rawDescription);

  // 2. Check if content has HTML tags
  const hasHtml = containsHtmlTags(decoded);

  if (hasHtml) {
    // 3. Sanitize HTML
    const sanitized = sanitizeHtml(decoded);
    return {
      content: sanitized,
      isHtml: true,
    };
  }

  // 4. Plain text: preserve paragraphs and line breaks
  return {
    content: decoded.trim(),
    isHtml: false,
  };
}
