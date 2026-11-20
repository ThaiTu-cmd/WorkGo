-- Legacy escrow rows were gateway-funded; existing WALLET values are preserved.
BEGIN;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS funding_source VARCHAR(255);
UPDATE escrow_accounts SET funding_source = 'GATEWAY'
WHERE funding_source IS NULL AND payment_id IS NOT NULL
    AND (to_jsonb(escrow_accounts)->>'hold_transaction_id') IS NULL;
-- Null sources without unambiguous legacy payment evidence fail here; reconcile their receipts first.
ALTER TABLE escrow_accounts
    ALTER COLUMN funding_source SET DEFAULT 'GATEWAY',
    ALTER COLUMN funding_source SET NOT NULL;
COMMIT;
