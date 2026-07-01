-- Add full-text search vector column and GIN index to Property.
-- Hand-authored — never use `prisma db push` (see CLAUDE.md).

-- 1. Add the tsvector generated column.
--    Combines title (weight A — highest) and description (weight B) using
--    the built-in 'english' text search config, which handles stemming.
--    coalesce guards against NULL description.
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("description", '')), 'B')
    ) STORED;

-- 2. GIN index for fast full-text lookups.
CREATE INDEX IF NOT EXISTS "Property_search_vector_idx"
  ON "Property" USING GIN ("search_vector");
