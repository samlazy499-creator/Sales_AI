import OpenAI from "openai";
import type { AIProvider, GenerateOptions, GenerateResult } from "@/lib/ai/provider";

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_CHAT_MODEL = "gpt-4o";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateResponse(options: GenerateOptions): Promise<GenerateResult> {
    const completion = await this.client.chat.completions.create({
      model: options.model ?? DEFAULT_CHAT_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 500,
    });

    const choice = completion.choices[0];
    return {
      content: choice?.message?.content ?? "",
      usage: completion.usage
        ? {
            inputTokens: completion.usage.prompt_tokens,
            outputTokens: completion.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async embedText(text: string): Promise<number[]> {
    const result = await this.client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return result.data[0].embedding;
  }
}
