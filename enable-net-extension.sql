-- SOLUCIÓN AL ERROR: schema "net" does not exist
-- Este script habilita las extensiones necesarias para que los webhooks de Supabase funcionen correctamente.
-- 1. Habilitar pg_net (necesario para los "Database Webhooks" del Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_net;
-- 2. Habilitar la extensión http (necesaria para los triggers manuales en setup-webhooks.sql)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
-- Verificación: Listar extensiones activas
SELECT name,
    default_version,
    installed_version
FROM pg_available_extensions
WHERE installed_version IS NOT NULL
    AND name IN ('pg_net', 'http');