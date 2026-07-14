import { PrismaClient } from "@prisma/client";

// Standard Next.js-safe Prisma singleton — prevents exhausting connections
// in dev due to hot-reload creating a new client on every edit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Tenant-scoped client factory.
 *
 * Every repository function MUST go through this rather than importing
 * `prisma` directly for any tenant-owned model (Lead, Conversation,
 * KnowledgeDocument, etc). It doesn't attempt row-level security at the
 * SQL layer (that's a Postgres RLS improvement to layer in later) — for
 * now it exists as a forcing function so a repository can't compile
 * without an explicit organizationId in scope, and to give us one place
 * to add RLS `SET app.current_org_id` session vars later without
 * touching every call site.
 */
export function scopedToOrg(organizationId: string) {
  if (!organizationId) {
    throw new Error("scopedToOrg() called without an organizationId");
  }
  return { organizationId, client: prisma };
}
