-- ============================================================================
-- Migración: Corregir las 6 políticas RLS que usaban tipos con tilde (Médica/Enfermería)
-- y ahora deben usar lowercase sin tilde (medica/enfermeria) para coincidir
-- con los datos actualizados.
-- ============================================================================

-- 1. Guardias
DROP POLICY IF EXISTS "Medical coordinators can manage medical guardias" ON guardias;
CREATE POLICY "Medical coordinators can manage medical guardias"
  ON guardias FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'medica'
  );

DROP POLICY IF EXISTS "Nursing coordinators can manage nursing guardias" ON guardias;
CREATE POLICY "Nursing coordinators can manage nursing guardias"
  ON guardias FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'enfermeria'
  );

-- 2. Libranzas
DROP POLICY IF EXISTS "Medical coordinators can manage medical libranzas" ON libranzas;
CREATE POLICY "Medical coordinators can manage medical libranzas"
  ON libranzas FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'medica'
  );

DROP POLICY IF EXISTS "Nursing coordinators can manage nursing libranzas" ON libranzas;
CREATE POLICY "Nursing coordinators can manage nursing libranzas"
  ON libranzas FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'enfermeria'
  );

-- 3. Doblas
DROP POLICY IF EXISTS "Medical coordinators can manage medical doblas" ON doblas;
CREATE POLICY "Medical coordinators can manage medical doblas"
  ON doblas FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'medica'
  );

DROP POLICY IF EXISTS "Nursing coordinators can manage nursing doblas" ON doblas;
CREATE POLICY "Nursing coordinators can manage nursing doblas"
  ON doblas FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'enfermeria'
  );
