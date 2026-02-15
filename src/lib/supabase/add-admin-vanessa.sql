-- AGREGAR NUEVA ADMINISTRADORA
UPDATE profiles 
SET 
    role = 'admin', 
    full_name = 'VANESSA BEJARANO', 
    whatsapp = '04248797441'
WHERE email = 'BEJARANO.V189@GMAIL.COM';

-- Asegurar que el otro admin también esté activo
UPDATE profiles 
SET role = 'admin'
WHERE email = 'dfornerino.usa@gmail.com';

-- Recargar sistema
NOTIFY pgrst, 'reload schema';
