-- Update payment_confirmations to track which account the payment was sent to
ALTER TABLE payment_confirmations
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES finance_accounts(id) ON DELETE
SET NULL;
-- Notify schema change
NOTIFY pgrst,
'reload schema';