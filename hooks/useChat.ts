import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

const CHANNELS = ['general'] as const;
type ChannelId = typeof CHANNELS[number];

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

interface UseChatResult {
  messagesByChannel: Record<ChannelId, ChatMessage[]>;
  isLoading: boolean;
  sendMessage: (channelId: string, text: string) => Promise<void>;
  sendImage: (channelId: string, file: File) => Promise<void>;
  sendAudio: (channelId: string, blob: Blob) => Promise<void>;
  deleteMessage: (msg: ChatMessage) => Promise<void>;
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

  const addMessage = useCallback((channelId: string, row: any) => {
    const cid = channelId as ChannelId;
    if (!CHANNELS.includes(cid)) return;
    setMessagesByChannel(prev => {
      if (prev[cid].some(m => m.id === row.id)) return prev;
      return { ...prev, [cid]: [...prev[cid], mapRow(row)] };
    });
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
        addMessage(payload.new.channel_id, payload.new);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const deletedId = payload.old.id;
        setMessagesByChannel(prev => {
          const next = { ...prev };
          for (const cid of CHANNELS) {
            next[cid] = next[cid].filter(m => m.id !== deletedId);
          }
          return next;
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAllChannels, addMessage]);

  const sendMessage = useCallback(async (channelId: string, text: string) => {
    if (!text.trim() || text.length > 2000) return;
    if (!CHANNELS.includes(channelId as ChannelId)) return;
    const { data, error } = await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: text.trim(),
    }).select();
    if (error) {
      console.error('Error enviando mensaje:', error.message);
      return;
    }
    if (data?.[0]) addMessage(channelId, data[0]);
  }, [addMessage]);

  const uploadFile = useCallback(async (channelId: string, file: File | Blob, folder: string, ext: string): Promise<string | null> => {
    if (!CHANNELS.includes(channelId as ChannelId)) return null;
    setIsUploading(true);
    try {
      const fileName = `${channelId}/${uuidv4()}.${ext}`;
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

    const { data, error } = await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: '',
      image_url: url,
    }).select();
    if (error) {
      console.error('Error enviando imagen:', error.message);
      return;
    }
    if (data?.[0]) addMessage(channelId, data[0]);
  }, [uploadFile, addMessage]);

  const sendAudio = useCallback(async (channelId: string, blob: Blob) => {
    const url = await uploadFile(channelId, blob, 'audio', 'webm');
    if (!url) return;

    const { data, error } = await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: '',
      audio_url: url,
    }).select();
    if (error) {
      console.error('Error enviando audio:', error.message);
      return;
    }
    if (data?.[0]) addMessage(channelId, data[0]);
  }, [uploadFile, addMessage]);

  const deleteMessage = useCallback(async (msg: ChatMessage) => {
    try {
      const prefix = '/object/public/chat_media/';
      const extractPath = (url: string) => {
        const idx = url.indexOf(prefix);
        return idx !== -1 ? url.substring(idx + prefix.length) : null;
      };

      if (msg.imageUrl) {
        const path = extractPath(msg.imageUrl);
        if (path) await supabase.storage.from('chat_media').remove([path]);
      }
      if (msg.audioUrl) {
        const path = extractPath(msg.audioUrl);
        if (path) await supabase.storage.from('chat_media').remove([path]);
      }

      const { error } = await supabase.from('chat_messages').delete().eq('id', msg.id);
      if (error) {
        console.error('Error eliminando mensaje:', error.message);
        return;
      }

      setMessagesByChannel(prev => ({
        ...prev,
        general: prev.general.filter(m => m.id !== msg.id),
      }));
    } catch (err) {
      console.error('Error inesperado al eliminar mensaje:', err);
    }
  }, []);

  return {
    messagesByChannel,
    isLoading,
    sendMessage,
    sendImage,
    sendAudio,
    deleteMessage,
    isUploading,
  };
}
