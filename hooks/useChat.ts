import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

const CHANNELS = ['general'] as const;
type ChannelId = typeof CHANNELS[number];

interface UseChatResult {
  messagesByChannel: Record<ChannelId, ChatMessage[]>;
  isLoading: boolean;
  sendMessage: (channelId: string, text: string) => Promise<void>;
  sendImage: (channelId: string, file: File) => Promise<void>;
  sendAudio: (channelId: string, blob: Blob) => Promise<void>;
  isUploading: boolean;
}

function mapRow(row: any): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    senderId: row.sender_id || 'unknown',
    senderName: row.sender_name,
    text: row.text || '',
    timestamp: new Date(row.created_at),
    imageUrl: row.image_url || undefined,
    audioUrl: row.audio_url || undefined,
  };
}

export function useChat(): UseChatResult {
  const [messagesByChannel, setMessagesByChannel] = useState<Record<ChannelId, ChatMessage[]>>(
    () => Object.fromEntries(CHANNELS.map(c => [c, []])) as Record<ChannelId, ChatMessage[]>
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadAllChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        console.error('Error loading chat messages:', error);
        return;
      }

      const grouped = Object.fromEntries(
        CHANNELS.map(c => [c, [] as ChatMessage[]])
      ) as Record<ChannelId, ChatMessage[]>;

      (data || []).forEach(row => {
        const channelId = row.channel_id as ChannelId;
        if (grouped[channelId]) {
          grouped[channelId].push(mapRow(row));
        }
      });

      setMessagesByChannel(grouped);
    } catch (err) {
      console.error('Unexpected error loading chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllChannels();

    const subscription = supabase
      .channel('chat_messages_all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const row = payload.new;
        const channelId = row.channel_id as ChannelId;
        if (CHANNELS.includes(channelId)) {
          setMessagesByChannel(prev => ({
            ...prev,
            [channelId]: [...prev[channelId], mapRow(row)],
          }));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAllChannels]);

  const sendMessage = useCallback(async (channelId: string, text: string) => {
    if (!text.trim() || text.length > 2000) return;
    if (!CHANNELS.includes(channelId as ChannelId)) return;
    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: text.trim(),
    });
    if (error) {
      console.error('Error enviando mensaje:', error.message);
    }
  }, []);

  const uploadFile = useCallback(async (channelId: string, file: File | Blob, folder: string, ext: string): Promise<string | null> => {
    if (!CHANNELS.includes(channelId as ChannelId)) return null;
    setIsUploading(true);
    try {
      const fileName = `${channelId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError.message);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat_media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error inesperado al subir archivo:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const sendImage = useCallback(async (channelId: string, file: File) => {
    const url = await uploadFile(channelId, file, 'images', file.name.split('.').pop() || 'jpg');
    if (!url) return;

    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: '',
      image_url: url,
    });
    if (error) {
      console.error('Error enviando imagen:', error.message);
    }
  }, [uploadFile]);

  const sendAudio = useCallback(async (channelId: string, blob: Blob) => {
    const url = await uploadFile(channelId, blob, 'audio', 'webm');
    if (!url) return;

    const { error } = await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: '',
      audio_url: url,
    });
    if (error) {
      console.error('Error enviando audio:', error.message);
    }
  }, [uploadFile]);

  return {
    messagesByChannel,
    isLoading,
    sendMessage,
    sendImage,
    sendAudio,
    isUploading,
  };
}
