/**
 * AI Service Layer — Provider Agnostic Client
 *
 * Implements native fetch clients for OpenAI and Gemini (zero heavy external SDKs),
 * plus a deterministic MockAIClient for 100% reliable, network-free tests.
 */

import { z } from "zod";
import { evaluateInterviewAnswerDeterministically } from "@/services/interview/evaluation-engine";

export type AIProvider = "openai" | "gemini" | "mock";

export interface AITextParams {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIStructuredParams<T> {
  prompt: string;
  systemPrompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
}

export interface AIClient {
  generateStructuredOutput<T>(params: AIStructuredParams<T>): Promise<T>;
  generateText(params: AITextParams): Promise<string>;
}

/**
 * OpenAI native fetch client
 */
export class OpenAIClient implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "gpt-4o-mini") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model;
  }

  async generateStructuredOutput<T>(params: AIStructuredParams<T>): Promise<T> {
    if (!this.apiKey || this.apiKey === "your-openai-api-key") {
      throw new Error(
        "OpenAI API key is missing. Set OPENAI_API_KEY in your environment or use mock mode."
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.prompt },
          ],
          response_format: { type: "json_object" },
          temperature: params.temperature ?? 0.2,
          max_tokens: params.maxTokens ?? 2000,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `OpenAI API request failed (${response.status}): ${errText || response.statusText}`
        );
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error("OpenAI returned an empty completion.");
      }

      const parsedJson = JSON.parse(rawContent);
      return params.schema.parse(parsedJson);
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateText(params: AITextParams): Promise<string> {
    if (!this.apiKey || this.apiKey === "your-openai-api-key") {
      throw new Error("OpenAI API key is missing.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.prompt },
          ],
          temperature: params.temperature ?? 0.3,
          max_tokens: params.maxTokens ?? 1500,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Gemini native fetch client
 */
export class GeminiClient implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "gemini-1.5-flash") {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.model = model;
  }

  async generateStructuredOutput<T>(params: AIStructuredParams<T>): Promise<T> {
    if (!this.apiKey || this.apiKey === "your-gemini-api-key") {
      throw new Error(
        "Gemini API key is missing. Set GEMINI_API_KEY in your environment or use mock mode."
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: params.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: params.prompt }],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: params.temperature ?? 0.2,
            maxOutputTokens: params.maxTokens ?? 2000,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `Gemini API request failed (${response.status}): ${errText || response.statusText}`
        );
      }

      const data = await response.json();
      const rawContent =
        data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) {
        throw new Error("Gemini returned an empty completion.");
      }

      const parsedJson = JSON.parse(rawContent);
      return params.schema.parse(parsedJson);
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateText(params: AITextParams): Promise<string> {
    if (!this.apiKey || this.apiKey === "your-gemini-api-key") {
      throw new Error("Gemini API key is missing.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${params.systemPrompt}\n\n${params.prompt}` }],
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

/**
 * Deterministic Mock AI Client for tests and zero-cost local development
 */
export class MockAIClient implements AIClient {
  private customMockResponse?: any;

  constructor(customMockResponse?: any) {
    this.customMockResponse = customMockResponse;
  }

  setMockResponse(resp: any) {
    this.customMockResponse = resp;
  }

  async generateStructuredOutput<T>(params: AIStructuredParams<T>): Promise<T> {
    if (this.customMockResponse !== undefined) {
      return params.schema.parse(this.customMockResponse);
    }

    // Interview Answer Evaluation Mock
    if (
      params.prompt.includes("=== CANDIDATE'S CURRENT ANSWER ===") ||
      params.systemPrompt.includes("senior Engineering Interviewer")
    ) {
      const qMatch = params.prompt.match(/=== PRIMARY INTERVIEW QUESTION ===\n([\s\S]*?)(?:\n\n===|$)/);
      const aMatch = params.prompt.match(/=== CANDIDATE'S CURRENT ANSWER ===\n([\s\S]*?)(?:\n\n===|$)/);
      const depthMatch = params.prompt.match(/Current Follow-up Depth: (\d+)/);

      const questionContent = qMatch ? qMatch[1].trim() : "Explain your architecture.";
      const candidateAnswer = aMatch ? aMatch[1].trim() : "";
      const currentFollowUpDepth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

      // Parse previous follow ups
      const previousFollowUps: Array<{ question: string; answer?: string | null }> = [];
      const prevSectionMatch = params.prompt.match(/=== PREVIOUS FOLLOW-UP CONVERSATION ===\n([\s\S]*?)(?:\n\n=== CANDIDATE|$)/);
      if (prevSectionMatch) {
        const qaMatches = prevSectionMatch[1].matchAll(/Q:\s*(.*?)\nA:\s*(.*?)(?=\n\nQ:|$)/gs);
        for (const m of qaMatches) {
          previousFollowUps.push({ question: m[1].trim(), answer: m[2].trim() });
        }
      }

      const evalMock = evaluateInterviewAnswerDeterministically({
        questionContent,
        candidateAnswer,
        previousFollowUps,
        currentFollowUpDepth,
        maxFollowUpDepth: 2,
      });

      return params.schema.parse(evalMock);
    }

    // Interview Question Generation Mock
    if (
      params.prompt.includes("=== GENERATION REQUEST ===") ||
      params.systemPrompt.includes("Technical Interviewer")
    ) {
      const questionsMock = {
        questions: [
          {
            content: "Explain how you architected your main project and structured its modules.",
            category: "PROJECT",
            difficulty: "medium",
            source: "RESUME",
            targetSkill: "Architecture",
            rationale: "Assessing code organization and modular design.",
          },
          {
            content: "What are the primary performance trade-offs in the technologies you used?",
            category: "TECHNICAL",
            difficulty: "medium",
            source: "RESUME",
            targetSkill: "Performance",
            rationale: "Probing technical depth and optimization awareness.",
          },
          {
            content: "Describe how you prioritize technical debt when deadlines are tight.",
            category: "BEHAVIORAL",
            difficulty: "medium",
            source: "BEHAVIORAL",
            rationale: "Assessing engineering judgment and teamwork.",
          },
        ],
      };
      return params.schema.parse(questionsMock);
    }

    // Default deterministic structured output conforming to aiStructuredOutputSchema (Resume Improvement)
    const defaultOutput = {
      improvedSummary: {
        originalText: "Software developer with experience in React and Node.",
        improvedText:
          "Full-stack software engineer with demonstrated expertise in building responsive React frontends and scalable Node.js backend services.",
        explanation:
          "Strengthened professional tone and highlighted verified technical competencies.",
      },
      improvedBullets: [
        {
          id: "bullet-1",
          section: "EXPERIENCE",
          originalText: "Built frontend using React and fixed bugs.",
          improvedText:
            "Architected responsive web application components using React, reducing load times and improving user engagement [Add metric, e.g. % faster load].",
          factualBasis: "Verified candidate skill React and frontend development history.",
          alignmentReason: "Highlights primary frontend framework required by role.",
        },
        {
          id: "bullet-2",
          section: "PROJECTS",
          originalText: "Created REST API in Express with MongoDB.",
          improvedText:
            "Engineered modular RESTful API endpoints utilizing Node.js and Express to handle data persistence, supporting client applications.",
          factualBasis: "Verified candidate skill Node.js, Express, and REST APIs.",
          alignmentReason: "Emphasizes backend architecture capabilities.",
        },
      ],
      skillsSuggestions: {
        verifiedSkillsToEmphasize: ["React", "TypeScript", "Node.js"],
        missingSkillsAdvice: [
          {
            skill: "PostgreSQL",
            advice:
              "Job requires relational database experience: Consider building a project using PostgreSQL to showcase database migrations and indexing.",
          },
        ],
      },
      atsSuggestions: [
        {
          keyword: "RESTful API",
          category: "RELEVANT_SKILL",
          foundInCandidateResume: true,
          advice:
            "Ensure 'RESTful API' is explicitly phrased in your bullet points to match common ATS parser rules.",
        },
      ],
      clarificationRequests: [
        {
          field: "Frontend Performance",
          question:
            "Do you have a quantifiable measure of performance improvement or daily active users for your React application?",
          context: "Quantifiable results can replace the [Add metric] placeholder.",
        },
      ],
    };

    return params.schema.parse(defaultOutput);
  }

  async generateText(_params: AITextParams): Promise<string> {
    return "This is a deterministic AI response generated by MockAIClient.";
  }
}

/**
 * Provider factory
 */
export function getAIClient(): AIClient {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  // Test environment or explicit mock provider
  if (process.env.NODE_ENV === "test" || provider === "mock") {
    return new MockAIClient();
  }

  if (provider === "gemini") {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key") {
      return new GeminiClient();
    }
    // Fallback to mock in development if key is default
    console.warn("[getAIClient] GEMINI_API_KEY is not configured. Falling back to MockAIClient.");
    return new MockAIClient();
  }

  // Default OpenAI
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-openai-api-key") {
    return new OpenAIClient();
  }

  // Fallback to mock in development if key is default
  console.warn("[getAIClient] OPENAI_API_KEY is not configured. Falling back to MockAIClient.");
  return new MockAIClient();
}

export const aiClient = getAIClient();
