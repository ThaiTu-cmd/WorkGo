-- Apply to shared PostgreSQL before deploying proposal-order support.
-- Existing duplicate PROPOSAL sources must be reconciled first; repeated SERVICE sources are valid.
BEGIN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proposal_slot integer;
ALTER TABLE order_snapshots ADD COLUMN IF NOT EXISTS proposal_snapshot jsonb;
UPDATE orders SET proposal_slot = 1 WHERE source_type = 'PROPOSAL';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_proposal_slot'
                   AND conrelid = 'orders'::regclass) THEN
        ALTER TABLE orders ADD CONSTRAINT ck_order_proposal_slot CHECK (
            (source_type = 'PROPOSAL' AND source_id IS NOT NULL AND proposal_slot IS NOT NULL AND proposal_slot = 1)
            OR ((source_type IS NULL OR source_type <> 'PROPOSAL') AND proposal_slot IS NULL)
        );
    END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_proposal_source ON orders(source_type, source_id, proposal_slot);
-- Hibernate-generated enum CHECK names vary; replace only checks on this enum column.
DO $$
DECLARE enum_check record;
BEGIN
    FOR enum_check IN
        SELECT c.conname FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'order_items'::regclass AND c.contype = 'c' AND a.attname = 'item_type'
    LOOP
        EXECUTE format('ALTER TABLE order_items DROP CONSTRAINT %I', enum_check.conname);
    END LOOP;
    ALTER TABLE order_items ADD CONSTRAINT ck_order_item_type
        CHECK (item_type IN ('PACKAGE', 'ADDON', 'PLATFORM_FEE', 'PROPOSAL'));
END $$;
COMMIT;
