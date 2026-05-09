-- ============================================================================
-- Migración: Añadir tabla vacaciones para gestionar periodos de vacaciones
-- ============================================================================

CREATE TABLE vacaciones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  personnel_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  personnel_name text NOT NULL,
  type text NOT NULL,
  is_change boolean DEFAULT false,
  modified_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  modified_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vacaciones_date ON vacaciones(date);
CREATE INDEX idx_vacaciones_personnel ON vacaciones(personnel_user_id);
CREATE INDEX idx_vacaciones_type ON vacaciones(type);

ALTER TABLE vacaciones ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden ver
CREATE POLICY "All authenticated users can view vacaciones"
  ON vacaciones FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins pueden gestionar todo
CREATE POLICY "Admins can manage all vacaciones"
  ON vacaciones FOR ALL
  USING (is_admin());

-- Coordinadores médicos gestionan vacaciones tipo medica
CREATE POLICY "Medical coordinators can manage medical vacaciones"
  ON vacaciones FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'medica'
  );

-- Coordinadores de enfermería gestionan vacaciones tipo enfermeria
CREATE POLICY "Nursing coordinators can manage nursing vacaciones"
  ON vacaciones FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'enfermeria'
  );
