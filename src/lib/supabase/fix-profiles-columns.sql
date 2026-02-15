-- FIX: Columnas faltantes en PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- RECARGAR EL ESQUEMA (CRÍTICO)
NOTIFY pgrst, 'reload schema';
