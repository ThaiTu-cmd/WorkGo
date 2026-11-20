-- Apply before deploying the order creation retry change; existing orders keep NULL keys.
BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key varchar(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS creation_request_hash varchar(64);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conrelid = 'orders'::regclass AND conname = 'uq_order_client_creation_key') THEN
        ALTER TABLE orders ADD CONSTRAINT uq_order_client_creation_key UNIQUE (client_id, idempotency_key);
    END IF;
END $$;
COMMIT;

-- Rollback: deploy the previous application, retaining these nullable columns and index.
-- They are backward compatible; keeping the receipt keys preserves safe retries on re-deploy.
