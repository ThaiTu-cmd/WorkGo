-- Run before deployment against identity_db. Replaces the local docs/sql/identity-service/001_rating_snapshot_version.sql.
BEGIN;
ALTER TABLE provider_profiles
    ADD COLUMN IF NOT EXISTS rating_aggregate_version BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_financially_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS financial_restriction_version BIGINT NOT NULL DEFAULT 0;
UPDATE provider_profiles SET rating_aggregate_version = 0 WHERE rating_aggregate_version IS NULL;
UPDATE provider_profiles SET is_financially_restricted = FALSE WHERE is_financially_restricted IS NULL;
UPDATE provider_profiles SET financial_restriction_version = 0 WHERE financial_restriction_version IS NULL;
ALTER TABLE provider_profiles
    ALTER COLUMN rating_aggregate_version SET DEFAULT 0,
    ALTER COLUMN rating_aggregate_version SET NOT NULL,
    ALTER COLUMN is_financially_restricted SET DEFAULT FALSE,
    ALTER COLUMN is_financially_restricted SET NOT NULL,
    ALTER COLUMN financial_restriction_version SET DEFAULT 0,
    ALTER COLUMN financial_restriction_version SET NOT NULL;
COMMIT;
