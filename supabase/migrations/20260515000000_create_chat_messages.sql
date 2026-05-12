-- ============================================================================
-- Tabla de mensajes de chat (sistema tipo WhatsApp interno)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id text NOT NULL CHECK (channel_id IN ('general', 'medicina', 'enfermeria', 'sesiones')),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  text text NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 2000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer todos los mensajes
DROP POLICY IF EXISTS "Everyone can read chat messages" ON chat_messages;
CREATE POLICY "Everyone can read chat messages"
  ON chat_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger: forzar sender_id = auth.uid() y sender_name desde profiles
CREATE OR REPLACE FUNCTION set_chat_sender_info()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sender_id := auth.uid();
  NEW.sender_name := COALESCE(
    (SELECT full_name FROM profiles WHERE id = auth.uid()),
    (SELECT email FROM profiles WHERE id = auth.uid()),
    'Usuario'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_chat_sender_info ON chat_messages;
CREATE TRIGGER set_chat_sender_info BEFORE INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION set_chat_sender_info();

-- Habilitar Realtime para la tabla (necesario para que las suscripciones en vivo funcionen)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION
  WHEN SQLSTATE '42710' THEN
    NULL;
END;
$$;

-- RLS: solo insert si sender_id = auth.uid() (el trigger lo garantiza)
DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
CREATE POLICY "Users can insert chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());
