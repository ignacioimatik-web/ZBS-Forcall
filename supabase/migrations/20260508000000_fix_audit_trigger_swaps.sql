-- ============================================================================
-- Migración: Evitar duplicados en audit_logs para permutas
-- ============================================================================

-- 1. Eliminar el trigger existente
DROP TRIGGER IF EXISTS audit_guardias ON guardias;
DROP TRIGGER IF EXISTS audit_libranzas ON libranzas;
DROP TRIGGER IF EXISTS audit_doblas ON doblas;
DROP TRIGGER IF EXISTS audit_meetings ON meetings;
DROP TRIGGER IF EXISTS audit_alertas ON alertas;

-- 2. Recrear la función de auditoría para que salte actualizaciones con is_change = true
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  actor_id uuid;
  actor_full_name text;
  action_type audit_action;
BEGIN
  actor_id := auth.uid();
  SELECT full_name INTO actor_full_name FROM profiles WHERE id = actor_id;
  
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREACION'::audit_action;
  ELSIF TG_OP = 'UPDATE' THEN
    -- SI es un cambio de permuta (is_change = true), NO registrar (se hará manual como PERMUTA)
    IF (TG_TABLE_NAME = 'guardias' OR TG_TABLE_NAME = 'libranzas' OR TG_TABLE_NAME = 'doblas') THEN
      IF (NEW.is_change = true) THEN
        RETURN NEW;
      END IF;
    END IF;
    action_type := 'CAMBIO'::audit_action;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'ELIMINACION'::audit_action;
  END IF;
  
  INSERT INTO audit_logs (
    actor_user_id,
    actor_name,
    entity_type,
    entity_id,
    action,
    description,
    payload
  ) VALUES (
    actor_id,
    actor_full_name,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    action_type,
    format('%s en %s', action_type, TG_TABLE_NAME),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reaplicar triggers (excluyendo permutas automáticas)
CREATE TRIGGER audit_guardias BEFORE INSERT OR UPDATE OR DELETE ON guardias
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_libranzas BEFORE INSERT OR UPDATE OR DELETE ON libranzas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_doblas BEFORE INSERT OR UPDATE OR DELETE ON doblas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_meetings BEFORE INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_alertas BEFORE INSERT OR UPDATE OR DELETE ON alertas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
