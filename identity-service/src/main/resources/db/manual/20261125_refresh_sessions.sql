-- Additive DEV-04 migration; apply before starting Identity with the new session code.
-- Existing JWTs without sessionId are deliberately rejected; users sign in again.
-- Manual order: after 20261119_provider_snapshot_defaults.sql; DEV-29 owns upgrade/restore acceptance.
BEGIN;
CREATE TABLE IF NOT EXISTS refresh_sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    family_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auth_time BIGINT NOT NULL,
    auth_version BIGINT NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    rotated_to VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS ix_refresh_family ON refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS ix_refresh_user ON refresh_sessions(user_id);
COMMIT;
