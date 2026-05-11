-- ============================================================================
-- Forzar actor_user_id = auth.uid() en inserts de audit_logs
-- ============================================================================

-- Función que asigna automáticamente el usuario autenticado al registro
CREATE OR REPLACE FUNCTION set_audit_actor_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actor_user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE INSERT para que el RLS WITH CHECK verifique el valor correcto
DROP TRIGGER IF EXISTS set_audit_actor_user_id ON audit_logs;
CREATE TRIGGER set_audit_actor_user_id BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION set_audit_actor_user_id();

-- Reemplazar política demasiado permisiva por una que verifique actor_user_id
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (actor_user_id = auth.uid());
