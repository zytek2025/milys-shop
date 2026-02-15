-- SCRIPT REPARADO PARA CREAR CUENTA DE VANESSA (CEO)
-- Eliminamos el ON CONFLICT problemático y usamos lógica pura SQL

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'BEJARANO.V189@GMAIL.COM';
  v_password TEXT := '18261210';
  v_hashed_password TEXT := crypt(v_password, gen_salt('bf'));
BEGIN
  -- 1. Verificar si el usuario ya existe en auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- Crear nuevo usuario
    v_user_id := gen_random_uuid();
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
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      v_hashed_password,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"VANESSA BEJARANO"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    );
  ELSE
    -- Solo actualizar la contraseña del usuario existente
    UPDATE auth.users 
    SET encrypted_password = v_hashed_password,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 2. Crear o Actualizar el perfil en public.profiles
  INSERT INTO public.profiles (id, email, full_name, role, whatsapp)
  VALUES (v_user_id, v_email, 'VANESSA BEJARANO', 'admin', '04248797441')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin', full_name = 'VANESSA BEJARANO', whatsapp = '04248797441';

END $$;

NOTIFY pgrst, 'reload schema';
