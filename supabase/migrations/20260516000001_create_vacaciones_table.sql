-- ============================================================================
-- Migración: Crear/regularizar tabla vacaciones con RLS
-- ============================================================================
-- Esta tabla fue creada manualmente y existía en la BD sin migración ni RLS.
-- Este script la crea si no existe y añade las políticas de seguridad.
-- ============================================================================

-- 1. Crear la tabla si no existe
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vacaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  personnel_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('medica', 'enfermeria')),
  is_change boolean DEFAULT false,
  modified_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  modified_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Añadir columnas que pudieran faltar si la tabla ya existe
-- ----------------------------------------------------------------------------
ALTER TABLE public.vacaciones ADD COLUMN IF NOT EXISTS is_change boolean DEFAULT false;
ALTER TABLE public.vacaciones ADD COLUMN IF NOT EXISTS modified_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.vacaciones ADD COLUMN IF NOT EXISTS modified_at timestamptz NULL;
ALTER TABLE public.vacaciones ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. Índices
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vacaciones_date ON vacaciones(date);
CREATE INDEX IF NOT EXISTS idx_vacaciones_type ON vacaciones(type);
CREATE INDEX IF NOT EXISTS idx_vacaciones_personnel ON vacaciones(personnel_name);

-- 4. Activar RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.vacaciones ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- ----------------------------------------------------------------------------

-- 5.1 SELECT: todos los autenticados pueden ver
DROP POLICY IF EXISTS "All authenticated users can view vacaciones" ON vacaciones;
CREATE POLICY "All authenticated users can view vacaciones"
  ON vacaciones FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5.2 INSERT: admins y coordinadores pueden añadir
DROP POLICY IF EXISTS "Admins and coordinators can manage vacaciones" ON vacaciones;
CREATE POLICY "Admins and coordinators can manage vacaciones"
  ON vacaciones FOR INSERT
  WITH CHECK (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- 5.3 DELETE: admins y coordinadores pueden eliminar
DROP POLICY IF EXISTS "Admins and coordinators can delete vacaciones" ON vacaciones;
CREATE POLICY "Admins and coordinators can delete vacaciones"
  ON vacaciones FOR DELETE
  USING (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- 5.4 UPDATE: admins y coordinadores pueden actualizar
DROP POLICY IF EXISTS "Admins and coordinators can update vacaciones" ON vacaciones;
CREATE POLICY "Admins and coordinators can update vacaciones"
  ON vacaciones FOR UPDATE
  USING (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- 6. Trigger updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_vacaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Añadir columna updated_at si no existe
ALTER TABLE public.vacaciones ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS set_vacaciones_updated_at ON vacaciones;
CREATE TRIGGER set_vacaciones_updated_at BEFORE UPDATE ON vacaciones
  FOR EACH ROW EXECUTE FUNCTION set_vacaciones_updated_at();

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
