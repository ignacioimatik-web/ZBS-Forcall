-- ============================================================================
-- Tabla de mensajes de chat (sistema tipo WhatsApp interno)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id text NOT NULL CHECK (channel_id IN ('general', 'medicina', 'enfermeria', 'sesiones')),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  text text NOT NULL DEFAULT '',
  image_url text,
  audio_url text,
  created_at timestamptz DEFAULT now()
);

-- Añadir columnas si tabla ya existía sin ellas
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE chat_messages ALTER COLUMN text SET DEFAULT '';

-- Quitar NOT NULL de text para permitir mensajes solo con media
ALTER TABLE chat_messages ALTER COLUMN text DROP NOT NULL;
-- Restricción: al menos texto o media
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_has_content;
ALTER TABLE chat_messages ADD CONSTRAINT chat_has_content
  CHECK (char_length(COALESCE(text, '')) > 0 OR image_url IS NOT NULL OR audio_url IS NOT NULL);

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

-- ============================================================================
-- Storage bucket para imágenes y audio del chat
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_media',
  'chat_media',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/ogg', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- RLS storage: autenticados pueden subir
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat_media');

-- RLS storage: autenticados pueden leer
DROP POLICY IF EXISTS "Authenticated users can view chat media" ON storage.objects;
CREATE POLICY "Authenticated users can view chat media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat_media');
