/**
 * Common interface every AI provider implements. Nothing outside this
 * folder should import `openai` or `@anthropic-ai/sdk` directly — the
 * conversation engine only ever talks to `AIProvider`, so swapping
 * OpenAI for Anthropic (or adding a third provider) never touches
 * business logic.
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateOptions {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
  maxTokens?: number;
}

export interface GenerateResult {
  content: string;
  /** Raw token usage if the provider reports it — used for future billing/usage metering. */
  usage?: { inputTokens: number; outputTokens: number };
}

export interface AIProvider {
  generateResponse(options: GenerateOptions): Promise<GenerateResult>;
  embedText(text: string): Promise<number[]>;
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER ?? "openai";

  if (providerName === "anthropic") {
    // Lazy import so the OpenAI SDK isn't pulled into the bundle when
    // running with Anthropic configured, and vice versa.
    const { AnthropicProvider } = require("./providers/anthropic-provider");
    cachedProvider = new AnthropicProvider();
  } else {
    const { OpenAIProvider } = require("./providers/openai-provider");
    cachedProvider = new OpenAIProvider();
  }

  return cachedProvider;
}
