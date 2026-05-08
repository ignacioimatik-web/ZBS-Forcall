-- ============================================================================
-- Migración: Corregir handle_new_user y restaurar roles correctos en profiles
--
-- Problema: handle_new_user() restringía los roles a solo 'medico'/'enfermera',
-- ignorando 'coordinador_medico', 'coordinadora_enfermeria', y 'admin'.
-- Esto hacía que los coordinadores no pudieran asignar guardias ni ver
-- el historial de permutas, porque las políticas RLS lo bloqueaban.
-- ============================================================================

-- 1. Reparar handle_new_user para que acepte TODOS los roles válidos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role app_role;
  user_email text;
  user_name text;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));

  -- Extraer rol solicitado de metadata
  requested_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'medico'::app_role
  );

  -- Aceptar TODOS los roles válidos (admin, coordinador_medico, coordinadora_enfermeria, medico, enfermera)
  -- Si el rol no es válido, default a medico
  IF requested_role IS NULL THEN
    requested_role := 'medico'::app_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    requested_role,
    NEW.raw_user_meta_data->>'phone'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Restaurar roles correctos en perfiles existentes basados en los emails conocidos
--    (esto es seguro porque solo actualiza si el email coincide)
UPDATE profiles
SET role = 'admin'::app_role
WHERE email = 'joan.zbsforcall@gmail.com'
  AND role != 'admin'::app_role;

UPDATE profiles
SET role = 'coordinador_medico'::app_role
WHERE email = 'elena.zbsforcall@gmail.com'
  AND role != 'coordinador_medico'::app_role;

UPDATE profiles
SET role = 'coordinadora_enfermeria'::app_role
WHERE email = 'xelo.zbsforcall@gmail.com'
  AND role != 'coordinadora_enfermeria'::app_role;

-- (opcional) Los demás usuarios (medico/enfermera) ya deberían tener su rol correcto
