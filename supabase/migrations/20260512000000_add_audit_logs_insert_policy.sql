-- ============================================================================
-- Permitir INSERT directo en audit_logs desde el frontend (para PERMUTAS)
-- ============================================================================

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
