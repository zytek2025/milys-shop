-- Add receipt_url column to finance_transactions for expense photo uploads
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS receipt_url TEXT;