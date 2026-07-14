import { searchSimilarChunks } from "@/lib/services/embedding.service";

/**
 * Real implementation as of Phase 7 — embeds the query and runs a
 * pgvector cosine-similarity search scoped to this org's READY
 * documents. Signature is unchanged from the Phase 5 placeholder, so
 * ai-agent.service.ts needed no changes to pick this up.
 *
 * A distance threshold (rather than always returning the top K
 * regardless of relevance) matters here: without it, a query with no
 * real match in the knowledge base would still return "the least bad"
 * chunks, which the AI could mistake for actual grounding and answer
 * confidently from unrelated content.
 */
const RELEVANCE_THRESHOLD = 0.45; // cosine distance — lower is more similar

export async function retrieveContext(organizationId: string, query: string): Promise<string> {
  if (!query.trim()) return "";

  let results: { chunkText: string; distance: number }[];
  try {
    results = await searchSimilarChunks(organizationId, query, 5);
  } catch (err) {
    // No OPENAI_API_KEY configured, or no documents/extension yet —
    // fail open with no context rather than breaking the conversation.
    console.error("RAG retrieval failed:", err);
    return "";
  }

  const relevant = results.filter((r) => r.distance <= RELEVANCE_THRESHOLD);
  if (relevant.length === 0) return "";

  return relevant.map((r) => r.chunkText).join("\n---\n");
}
