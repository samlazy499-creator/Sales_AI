import { prisma } from "@/lib/db";
import OpenAI from "openai";
import crypto from "crypto";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE_CHARS = 1800; // roughly 400-450 tokens
const CHUNK_OVERLAP_CHARS = 200;

// Embeddings always go through OpenAI directly regardless of AI_PROVIDER —
// Anthropic has no embeddings endpoint (see providers/anthropic-provider.ts).
// This is intentionally its own client rather than routed through
// getAIProvider() so a business running AI_PROVIDER=anthropic for chat
// still gets a working knowledge base as long as OPENAI_API_KEY is set.
function getEmbeddingClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Splits text into overlapping chunks on paragraph boundaries where
 * possible, falling back to a hard character cut for any paragraph
 * longer than the chunk size itself (e.g. a wall-of-text PDF page).
 * Overlap keeps a sentence that straddles a chunk boundary retrievable
 * from either side.
 */
export function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (para.length > CHUNK_SIZE_CHARS) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < para.length; i += CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS) {
        chunks.push(para.slice(i, i + CHUNK_SIZE_CHARS));
      }
      continue;
    }

    if ((current + "\n\n" + para).length > CHUNK_SIZE_CHARS) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);

  return chunks.filter((c) => c.trim().length > 20);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const client = getEmbeddingClient();
  const result = await client.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  return result.data.map((d) => d.embedding);
}

function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

/**
 * Full pipeline for one document: chunk its extracted text, embed every
 * chunk, and write the rows via raw SQL — Prisma Client can't construct
 * `vector(1536)` values directly since it's an Unsupported type in the
 * schema, so this is the one place that reaches past the client.
 */
export async function embedAndStoreDocument(documentId: string, text: string) {
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { status: "FAILED" } });
    return;
  }

  // Batch to stay well under OpenAI's per-request input limits.
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(batch);

    for (let j = 0; j < batch.length; j++) {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "Embedding" (id, "documentId", "chunkText", vector, "createdAt")
        VALUES (${id}, ${documentId}, ${batch[j]}, ${toVectorLiteral(vectors[j])}::vector, now())
      `;
    }
  }

  await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { status: "READY" } });
}

export async function deleteEmbeddingsForDocument(documentId: string) {
  await prisma.embedding.deleteMany({ where: { documentId } });
}

/**
 * Cosine-similarity search scoped to one organization's READY documents.
 * `<=>` is pgvector's cosine distance operator — lower is more similar,
 * so we order ascending and take the top K.
 */
export async function searchSimilarChunks(organizationId: string, query: string, topK = 5) {
  const [queryVector] = await embedBatch([query]);
  const literal = toVectorLiteral(queryVector);

  const rows = await prisma.$queryRaw<{ chunkText: string; distance: number }[]>`
    SELECT e."chunkText", (e.vector <=> ${literal}::vector) AS distance
    FROM "Embedding" e
    INNER JOIN "KnowledgeDocument" d ON d.id = e."documentId"
    WHERE d."organizationId" = ${organizationId} AND d.status = 'READY'
    ORDER BY distance ASC
    LIMIT ${topK}
  `;

  return rows;
}
