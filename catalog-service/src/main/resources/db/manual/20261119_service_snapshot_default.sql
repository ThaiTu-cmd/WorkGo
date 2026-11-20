-- Run before deployment against catalog_db. Replaces the local docs/sql/catalog-service/001_rating_snapshot_version.sql.
BEGIN;
ALTER TABLE services ADD COLUMN IF NOT EXISTS rating_aggregate_version BIGINT NOT NULL DEFAULT 0;
UPDATE services SET rating_aggregate_version = 0 WHERE rating_aggregate_version IS NULL;
ALTER TABLE services
    ALTER COLUMN rating_aggregate_version SET DEFAULT 0,
    ALTER COLUMN rating_aggregate_version SET NOT NULL;
COMMIT;
