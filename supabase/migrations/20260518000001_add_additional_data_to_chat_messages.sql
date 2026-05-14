-- Añadir columna additional_data a chat_messages para datos de Telegram y otros orígenes
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS additional_data jsonb DEFAULT NULL;

-- Índice para búsquedas por fuente
CREATE INDEX IF NOT EXISTS idx_chat_messages_source
  ON chat_messages USING gin ((additional_data->>'source'));