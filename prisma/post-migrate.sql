-- Run once after your first `prisma migrate deploy`, against the same database.
-- Prisma's migration creates the Embedding table but can't express a
-- pgvector-specific index type, so it's applied separately here.
--
-- IVFFlat is the standard choice for pgvector at small-to-medium scale
-- (up to a few million rows). `lists = 100` is a reasonable default for
-- up to ~1M rows — see https://github.com/pgvector/pgvector#ivfflat for
-- how to tune it as your knowledge base grows.

CREATE INDEX IF NOT EXISTS embedding_vector_idx
  ON "Embedding"
  USING ivfflat (vector vector_cosine_ops)
  WITH (lists = 100);
