-- Script para habilitar la integración de Canva Pro
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS canva_api_key TEXT;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
