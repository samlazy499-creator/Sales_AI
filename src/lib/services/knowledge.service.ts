import { prisma } from "@/lib/db";
import { uploadToStorage } from "@/lib/integrations/s3.client";
import {
  extractFromPDF,
  extractFromDOCX,
  extractFromURL,
  extractFromPlainText,
} from "@/lib/services/document-extraction.service";
import { embedAndStoreDocument } from "@/lib/services/embedding.service";
import type { SourceType } from "@prisma/client";

/**
 * Runs extraction + embedding for a document and updates its status at
 * each stage. Called synchronously right after creation for now (same
 * "no queue yet" tradeoff as WhatsApp processing in Phase 6) — a slow
 * PDF won't block the upload response since the caller doesn't await
 * this in the route handler, but there's no retry-on-failure until
 * Inngest is wired up.
 */
async function processDocument(documentId: string, sourceType: SourceType, source: Buffer | string) {
  await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { status: "PROCESSING" } });

  try {
    let text: string;
    switch (sourceType) {
      case "PDF":
        text = await extractFromPDF(source as Buffer);
        break;
      case "DOCX":
        text = await extractFromDOCX(source as Buffer);
        break;
      case "URL":
        text = await extractFromURL(source as string);
        break;
      case "TEXT":
        text = extractFromPlainText(source as string);
        break;
      default:
        throw new Error(`Unsupported source type for embedding: ${sourceType}`);
    }

    if (!text || text.trim().length < 20) {
      throw new Error("Extracted text was empty or too short to be useful");
    }

    await embedAndStoreDocument(documentId, text);
  } catch (err) {
    console.error(`Document processing failed for ${documentId}:`, err);
    await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { status: "FAILED" } });
  }
}

export async function ingestFile(
  organizationId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
) {
  const sourceType: SourceType = contentType.includes("pdf")
    ? "PDF"
    : contentType.includes("wordprocessingml") || fileName.endsWith(".docx")
    ? "DOCX"
    : "TEXT";

  let storageKey: string | undefined;
  try {
    storageKey = await uploadToStorage(organizationId, fileName, buffer, contentType);
  } catch (err) {
    // S3 not configured — proceed without persistent storage. The
    // document can still be embedded from the in-memory buffer; it just
    // won't be re-downloadable later. Surfaced via a console warning
    // rather than failing the whole upload, since search/RAG still works.
    console.warn("Storage upload skipped (S3 not configured):", err);
  }

  const doc = await prisma.knowledgeDocument.create({
    data: { organizationId, title: fileName, sourceType, storageKey, status: "PENDING" },
  });

  // Fire and forget — the route responds immediately with PENDING status,
  // UI polls for READY/FAILED.
  processDocument(doc.id, sourceType, buffer).catch((err) =>
    console.error("Unhandled document processing error:", err)
  );

  return doc;
}

export async function ingestURL(organizationId: string, url: string) {
  const doc = await prisma.knowledgeDocument.create({
    data: { organizationId, title: url, sourceType: "URL", sourceUrl: url, status: "PENDING" },
  });

  processDocument(doc.id, "URL", url).catch((err) =>
    console.error("Unhandled document processing error:", err)
  );

  return doc;
}

export async function ingestText(organizationId: string, title: string, text: string) {
  const doc = await prisma.knowledgeDocument.create({
    data: { organizationId, title, sourceType: "TEXT", status: "PENDING" },
  });

  processDocument(doc.id, "TEXT", text).catch((err) =>
    console.error("Unhandled document processing error:", err)
  );

  return doc;
}

export async function listDocuments(organizationId: string) {
  return prisma.knowledgeDocument.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function deleteDocument(organizationId: string, documentId: string) {
  const result = await prisma.knowledgeDocument.deleteMany({
    where: { id: documentId, organizationId },
  });
  return result.count > 0;
}
