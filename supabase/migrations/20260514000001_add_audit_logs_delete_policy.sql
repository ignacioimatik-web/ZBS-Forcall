-- ============================================================================
-- Migración: Añadir política RLS de DELETE para audit_logs
-- Permite a admins y coordinadores eliminar registros de permutas (deshacer)
-- ============================================================================

CREATE POLICY "Admins and coordinators can delete audit logs"
  ON audit_logs FOR DELETE
  USING (current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria'));
