import { describe, it, expect } from "vitest";
import {
  decodeHtmlEntities,
  sanitizeHtml,
  processJobDescription,
} from "@/services/jobs/sanitizer";

describe("Job Description Sanitizer & Normalizer", () => {
  // 1. Normal plain text
  it("should preserve normal plain text formatting and paragraphs", () => {
    const plainText = `We are looking for a Senior Software Engineer to join our team.

Responsibilities:
- Build backend microservices
- Write unit tests
- Collaborate with product managers

Requirements:
5+ years experience in TypeScript & Node.js.`;

    const result = processJobDescription(plainText);

    expect(result.isHtml).toBe(false);
    expect(result.content).toBe(plainText.trim());
    expect(result.content).toContain("Build backend microservices");
  });

  // 2. HTML description
  it("should render and preserve valid HTML formatting (headings, lists, bold)", () => {
    const htmlDescription = `
      <div class="content-intro">
        <h4><strong>Who We Are</strong></h4>
        <p>JobFit is a high-growth AI platform.</p>
        <h4>What You Will Do</h4>
        <ul>
          <li>Design scalable distributed systems.</li>
          <li>Mentor junior engineers.</li>
        </ul>
      </div>
    `;

    const result = processJobDescription(htmlDescription);

    expect(result.isHtml).toBe(true);
    expect(result.content).toContain("<h4>");
    expect(result.content).toContain("<strong>Who We Are</strong>");
    expect(result.content).toContain("<p>JobFit is a high-growth AI platform.</p>");
    expect(result.content).toContain("<ul>");
    expect(result.content).toContain("<li>Design scalable distributed systems.</li>");
  });

  // 3. HTML-encoded description
  it("should correctly decode and render HTML-encoded descriptions (&lt;div&gt;)", () => {
    const encoded = `&lt;div class=&quot;content-intro&quot;&gt;&lt;h4&gt;&lt;strong&gt;Who We Are&lt;/strong&gt;&lt;/h4&gt;&lt;p&gt;We build great software.&lt;/p&gt;&lt;/div&gt;`;

    const result = processJobDescription(encoded);

    expect(result.isHtml).toBe(true);
    // Raw entity tags should NEVER remain
    expect(result.content).not.toContain("&lt;");
    expect(result.content).not.toContain("&gt;");
    expect(result.content).not.toContain("&quot;");
    // Actual HTML structure is restored
    expect(result.content).toContain("<strong>Who We Are</strong>");
    expect(result.content).toContain("<p>We build great software.</p>");
  });

  // 4. Double-encoded HTML
  it("should decode double-encoded HTML descriptions (&amp;lt;div&amp;gt;)", () => {
    const doubleEncoded = `&amp;lt;div&amp;gt;&amp;lt;h3&amp;gt;About The Role&amp;lt;/h3&amp;gt;&amp;lt;p&amp;gt;Exciting career opportunity.&amp;lt;/p&amp;gt;&amp;lt;/div&amp;gt;`;

    const result = processJobDescription(doubleEncoded);

    expect(result.isHtml).toBe(true);
    expect(result.content).not.toContain("&amp;lt;");
    expect(result.content).not.toContain("&lt;");
    expect(result.content).toContain("<h3>About The Role</h3>");
    expect(result.content).toContain("<p>Exciting career opportunity.</p>");
  });

  // 5. Malicious script/event-handler payload (XSS prevention)
  it("should strip malicious script tags, event handlers, and javascript: URLs", () => {
    const maliciousPayload = `
      <div>
        <h4>Engineering Lead</h4>
        <script>alert('xss-attack');</script>
        <img src="invalid-image" onerror="alert('onerror-xss')" />
        <p onclick="stealCookies()">Click for more information</p>
        <iframe src="https://attacker.example.com/phishing"></iframe>
        <a href="javascript:alert('javascript-url')">Malicious Link</a>
        <a href="data:text/html,<script>alert(1)</script>">Data Link</a>
        <object data="malicious.swf"></object>
      </div>
    `;

    const result = processJobDescription(maliciousPayload);

    expect(result.isHtml).toBe(true);
    // Disallowed tags stripped
    expect(result.content).not.toContain("<script>");
    expect(result.content).not.toContain("alert('xss-attack')");
    expect(result.content).not.toContain("<iframe");
    expect(result.content).not.toContain("<object");
    expect(result.content).not.toContain("<img");
    // Event handlers stripped
    expect(result.content).not.toContain("onerror");
    expect(result.content).not.toContain("onclick");
    expect(result.content).not.toContain("stealCookies");
    // Javascript / Data URLs neutralized
    expect(result.content).not.toContain("javascript:");
    expect(result.content).not.toContain("data:");
    // Legitimate content preserved
    expect(result.content).toContain("<h4>Engineering Lead</h4>");
    expect(result.content).toContain("Click for more information");
  });

  // 6. Safe links
  it("should preserve safe external links with target=_blank and rel=noopener noreferrer", () => {
    const contentWithLinks = `
      <p>Please visit our careers portal at <a href="https://careers.example.com">Careers Page</a> or email <a href="mailto:jobs@example.com">us</a>.</p>
    `;

    const result = processJobDescription(contentWithLinks);

    expect(result.isHtml).toBe(true);
    expect(result.content).toContain('href="https://careers.example.com"');
    expect(result.content).toContain('target="_blank"');
    expect(result.content).toContain('rel="noopener noreferrer"');
    expect(result.content).toContain('href="mailto:jobs@example.com"');
  });
});
