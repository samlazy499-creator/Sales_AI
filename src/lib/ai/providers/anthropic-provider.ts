import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, GenerateOptions, GenerateResult, ChatMessage } from "@/lib/ai/provider";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateResponse(options: GenerateOptions): Promise<GenerateResult> {
    // Anthropic's Messages API takes `system` as a top-level field rather
    // than a message with role "system" — split it out here so callers
    // can build prompts the same way regardless of provider.
    const systemMessages = options.messages.filter((m) => m.role === "system");
    const conversationMessages = options.messages.filter(
      (m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system"
    );

    const response = await this.client.messages.create({
      model: options.model ?? DEFAULT_MODEL,
      system: systemMessages.map((m) => m.content).join("\n\n"),
      messages: conversationMessages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 500,
    });

    const textBlock = response.content.find((block) => block.type === "text");

    return {
      content: textBlock?.type === "text" ? textBlock.text : "",
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async embedText(): Promise<number[]> {
    // Anthropic doesn't offer an embeddings endpoint. The knowledge-base
    // (Phase 7) always embeds via OpenAI regardless of AI_PROVIDER for
    // this reason — see rag.service.ts. This method exists to satisfy
    // the AIProvider interface and should not be called directly.
    throw new Error(
      "AnthropicProvider does not support embeddings — use OPENAI_API_KEY for the knowledge base even when AI_PROVIDER=anthropic."
    );
  }
}
