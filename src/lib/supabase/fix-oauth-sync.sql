-- =====================================================
-- FIX: Sincronización automática de OAuth → profiles
-- Crea un trigger en auth.users para insertar perfiles
-- automáticamente al registrarse (email, Google, etc.)
-- =====================================================
-- 1. Crear la función que maneja nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        whatsapp,
        shipping_address,
        age,
        city,
        gender,
        role,
        crm_status,
        marketing_consent,
        created_at,
        updated_at
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'whatsapp',
        NEW.raw_user_meta_data->>'shipping_address',
        (NEW.raw_user_meta_data->>'age')::integer,
        NEW.raw_user_meta_data->>'city',
        NEW.raw_user_meta_data->>'gender',
        'user',
        'lead',
        COALESCE(
            (NEW.raw_user_meta_data->>'marketing_consent')::boolean,
            false
        ),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = COALESCE(
        NULLIF(profiles.full_name, ''),
        EXCLUDED.full_name
    ),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Vincular el trigger a auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 3. MIGRACIÓN RETROACTIVA: Crear perfiles para usuarios de Auth existentes sin perfil
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        crm_status,
        created_at,
        updated_at
    )
SELECT au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ),
    au.raw_user_meta_data->>'avatar_url',
    'user',
    'lead',
    au.created_at,
    NOW()
FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
-- 4. Recargar schema de PostgREST
NOTIFY pgrst,
'reload schema';