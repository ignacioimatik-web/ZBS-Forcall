-- ============================================================================
-- Migración inicial: Integración completa Supabase para ZBS Forcall
-- ============================================================================

-- 1. TIPOS ENUMERADOS
-- ----------------------------------------------------------------------------

CREATE TYPE app_role AS ENUM (
  'admin',
  'coordinador_medico',
  'coordinadora_enfermeria',
  'medico',
  'enfermera'
);

CREATE TYPE staff_group AS ENUM (
  'medico',
  'enfermeria'
);

CREATE TYPE alerta_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

CREATE TYPE audit_action AS ENUM (
  'VALIDACION',
  'CAMBIO',
  'PERMUTA',
  'CREACION',
  'ELIMINACION'
);

-- 2. EXTENSIONES
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. TABLAS BASE
-- ----------------------------------------------------------------------------

-- 3.1 Perfiles de usuario
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role app_role NOT NULL DEFAULT 'medico',
  staff_group staff_group GENERATED ALWAYS AS (
    CASE 
      WHEN role IN ('medico', 'coordinador_medico') THEN 'medico'::staff_group
      WHEN role IN ('enfermera', 'coordinadora_enfermeria') THEN 'enfermeria'::staff_group
      ELSE NULL
    END
  ) STORED,
  is_active boolean DEFAULT true,
  phone text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_staff_group ON profiles(staff_group);
CREATE INDEX idx_profiles_email ON profiles(email);

-- 3.2 Guardias
CREATE TABLE guardias (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  personnel_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  personnel_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Médica', 'Enfermería')),
  is_change boolean DEFAULT false,
  modified_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  modified_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_guardias_date ON guardias(date);
CREATE INDEX idx_guardias_personnel ON guardias(personnel_user_id);
CREATE INDEX idx_guardias_type ON guardias(type);

-- 3.3 Libranzas
CREATE TABLE libranzas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  personnel_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  personnel_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Médica', 'Enfermería')),
  is_change boolean DEFAULT false,
  modified_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  modified_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_libranzas_date ON libranzas(date);
CREATE INDEX idx_libranzas_personnel ON libranzas(personnel_user_id);

-- 3.4 Doblas
CREATE TABLE doblas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  personnel_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  personnel_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Médica', 'Enfermería')),
  is_change boolean DEFAULT false,
  modified_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  modified_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_doblas_date ON doblas(date);
CREATE INDEX idx_doblas_personnel ON doblas(personnel_user_id);

-- 3.5 Reuniones/Sesiones
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  type text NOT NULL,
  description text NULL,
  date timestamptz NOT NULL,
  time text NULL,
  location text NULL,
  speaker text NULL,
  author_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  author_name text NULL,
  target_group text NULL,
  is_confirmed boolean DEFAULT false,
  is_cancelled boolean DEFAULT false,
  cancellation_reason text NULL,
  presentation_url text NULL,
  summary text NULL,
  proposals jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_author ON meetings(author_user_id);
CREATE INDEX idx_meetings_target_group ON meetings(target_group);

-- 3.6 Calendarios (soporte para configuración/metadata)
CREATE TABLE calendarios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3.7 Festivos manuales
CREATE TABLE manual_holidays (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_manual_holidays_date ON manual_holidays(date);

-- 3.8 Alertas
CREATE TABLE alertas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  severity alerta_severity DEFAULT 'info',
  source text NULL,
  published_at timestamptz DEFAULT now(),
  created_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_alertas_published ON alertas(published_at DESC);
CREATE INDEX idx_alertas_severity ON alertas(severity);

-- 3.9 Avisos
CREATE TABLE avisos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel text DEFAULT 'avisos',
  sender_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  text text NOT NULL,
  is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_avisos_channel ON avisos(channel);
CREATE INDEX idx_avisos_created ON avisos(created_at DESC);

-- 3.10 Logs de auditoría
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name text NULL,
  entity_type text NOT NULL,
  entity_id uuid NULL,
  action audit_action NOT NULL,
  description text NOT NULL,
  category text NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);

-- 4. FUNCIONES HELPER
-- ----------------------------------------------------------------------------

-- 4.1 Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Helpers de rol y permisos
CREATE OR REPLACE FUNCTION current_app_role()
RETURNS app_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_staff_group()
RETURNS staff_group AS $$
  SELECT staff_group FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_manage_medical_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordinador_medico')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_manage_nursing_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordinadora_enfermeria')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION belongs_to_current_user(target_user_id uuid)
RETURNS boolean AS $$
  SELECT target_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4.3 Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role app_role;
  user_email text;
  user_name text;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));
  
  -- Extraer rol solicitado (si existe en metadata)
  requested_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'medico'::app_role
  );
  
  -- Validar que en autorregistro solo se permitan roles base
  IF requested_role NOT IN ('medico', 'enfermera') THEN
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. TRIGGERS UPDATED_AT
-- ----------------------------------------------------------------------------

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_guardias_updated_at BEFORE UPDATE ON guardias
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_libranzas_updated_at BEFORE UPDATE ON libranzas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_doblas_updated_at BEFORE UPDATE ON doblas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_calendarios_updated_at BEFORE UPDATE ON calendarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Activar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE libranzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE doblas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 RLS: profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Coordinators can view their staff group"
  ON profiles FOR SELECT
  USING (
    (current_app_role() = 'coordinador_medico' AND staff_group = 'medico') OR
    (current_app_role() = 'coordinadora_enfermeria' AND staff_group = 'enfermeria')
  );

CREATE POLICY "Users can update own profile (limited)"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- No permitir auto-escalada de roles
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- 6.2 RLS: guardias
CREATE POLICY "All authenticated users can view guardias"
  ON guardias FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own guardias"
  ON guardias FOR SELECT
  USING (personnel_user_id = auth.uid());

CREATE POLICY "Admins can manage all guardias"
  ON guardias FOR ALL
  USING (is_admin());

CREATE POLICY "Medical coordinators can manage medical guardias"
  ON guardias FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'Médica'
  );

CREATE POLICY "Nursing coordinators can manage nursing guardias"
  ON guardias FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'Enfermería'
  );

-- 6.3 RLS: libranzas
CREATE POLICY "All authenticated users can view libranzas"
  ON libranzas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all libranzas"
  ON libranzas FOR ALL
  USING (is_admin());

CREATE POLICY "Medical coordinators can manage medical libranzas"
  ON libranzas FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'Médica'
  );

CREATE POLICY "Nursing coordinators can manage nursing libranzas"
  ON libranzas FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'Enfermería'
  );

-- 6.4 RLS: doblas
CREATE POLICY "All authenticated users can view doblas"
  ON doblas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all doblas"
  ON doblas FOR ALL
  USING (is_admin());

CREATE POLICY "Medical coordinators can manage medical doblas"
  ON doblas FOR ALL
  USING (
    can_manage_medical_staff() AND type = 'Médica'
  );

CREATE POLICY "Nursing coordinators can manage nursing doblas"
  ON doblas FOR ALL
  USING (
    can_manage_nursing_staff() AND type = 'Enfermería'
  );

-- 6.5 RLS: meetings
CREATE POLICY "All authenticated users can view public meetings"
  ON meetings FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (target_group IS NULL OR target_group = 'all' OR target_group = current_staff_group()::text)
  );

CREATE POLICY "Admins and coordinators can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

CREATE POLICY "Admins and coordinators can update meetings"
  ON meetings FOR UPDATE
  USING (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

CREATE POLICY "Admins can delete meetings"
  ON meetings FOR DELETE
  USING (is_admin());

-- 6.6 RLS: calendarios
CREATE POLICY "All authenticated users can view calendarios"
  ON calendarios FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and coordinators can manage calendarios"
  ON calendarios FOR ALL
  USING (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- 6.7 RLS: manual_holidays
CREATE POLICY "All authenticated users can view holidays"
  ON manual_holidays FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and coordinators can manage holidays"
  ON manual_holidays FOR ALL
  USING (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- 6.8 RLS: alertas
CREATE POLICY "All authenticated users can view alertas"
  ON alertas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and coordinators can create alertas"
  ON alertas FOR INSERT
  WITH CHECK (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

CREATE POLICY "Admins can manage all alertas"
  ON alertas FOR ALL
  USING (is_admin());

-- 6.9 RLS: avisos
CREATE POLICY "All authenticated users can view avisos"
  ON avisos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can create avisos"
  ON avisos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Urgent avisos restricted to admins and coordinators"
  ON avisos FOR INSERT
  WITH CHECK (
    NOT is_urgent OR 
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- 6.10 RLS: audit_logs
CREATE POLICY "Admins and coordinators can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    current_app_role() IN ('admin', 'coordinador_medico', 'coordinadora_enfermeria')
  );

-- Los audit_logs se crearán mediante triggers, no directamente desde cliente

-- 7. FUNCIONES DE AUDITORÍA
-- ----------------------------------------------------------------------------

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

-- Aplicar triggers de auditoría
CREATE TRIGGER audit_guardias AFTER INSERT OR UPDATE OR DELETE ON guardias
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_libranzas AFTER INSERT OR UPDATE OR DELETE ON libranzas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_doblas AFTER INSERT OR UPDATE OR DELETE ON doblas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_meetings AFTER INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_alertas AFTER INSERT OR UPDATE OR DELETE ON alertas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
