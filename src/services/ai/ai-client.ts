/**
 * AI Service Layer — Foundation
 * All AI calls must go through this module.
 * Concrete implementations: OpenAIClient, GeminiClient
 * Selected via AI_PROVIDER environment variable.
 * 
 * To be implemented in Phase 7 — AI Features.
 */

export type AIProvider = "openai" | "gemini";

export interface AITextParams {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatParams {
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

// Placeholder — will be implemented in Phase 7
export const aiClient = {
  generateText: async (_params: AITextParams): Promise<string> => {
    throw new Error("AI service not yet implemented. See Phase 7.");
  },
  chat: async (_params: AIChatParams): Promise<string> => {
    throw new Error("AI service not yet implemented. See Phase 7.");
  },
};
