-- SCRIPT ACTUALIZADO PARA CREAR CUENTA DE CEO/ADMIN
-- Usuario: vbejarano
-- Contraseña: 18261210

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'BEJARANO.V189@GMAIL.COM';
  -- CONTRASEÑA SOLICITADA: 18261210
  hashed_password TEXT := crypt('18261210', gen_salt('bf')); 
BEGIN

  -- 1. Crear en auth.users
  INSERT INTO auth.users (
    id, 
    instance_id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    aud, 
    role,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"VANESSA BEJARANO", "username": "vbejarano"}',
    'authenticated',
    'authenticated',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE 
  SET encrypted_password = hashed_password; -- Esto permite resetear la clave si ya existía

  -- 2. Asegurar el ID
  SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;

  -- 3. Actualizar Perfil público
  INSERT INTO public.profiles (id, email, full_name, role, whatsapp)
  VALUES (new_user_id, user_email, 'VANESSA BEJARANO', 'admin', '04248797441')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin', full_name = 'VANESSA BEJARANO', whatsapp = '04248797441';

END $$;

NOTIFY pgrst, 'reload schema';
