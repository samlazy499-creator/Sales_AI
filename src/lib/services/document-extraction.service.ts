import * as cheerio from "cheerio";

/**
 * Extracts plain text from each supported source type. Kept separate
 * from chunking/embedding so the extraction step (which depends on
 * external libraries per format) can fail independently and report a
 * specific error back to the document's status, rather than one giant
 * try/catch hiding which stage broke.
 */

export async function extractFromPDF(buffer: Buffer): Promise<string> {
  // Lazy-required — pdf-parse reads a test file on import in some
  // versions if pulled in eagerly at module load in serverless envs.
  const pdfParse = require("pdf-parse");
  const result = await pdfParse(buffer);
  return result.text;
}

export async function extractFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractFromURL(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "SalesPilotAI-KnowledgeBase/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);
  const html = await res.text();

  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript").remove();
  const text = $("body").text();

  // Collapse the whitespace mess that comes out of stripping tags.
  return text.replace(/\s+/g, " ").trim();
}

export function extractFromPlainText(text: string): string {
  return text.trim();
}
