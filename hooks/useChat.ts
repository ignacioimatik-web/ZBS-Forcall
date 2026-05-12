import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

const CHANNELS = ['general', 'medicina', 'enfermeria', 'sesiones'] as const;
type ChannelId = typeof CHANNELS[number];

interface UseChatResult {
  messagesByChannel: Record<ChannelId, ChatMessage[]>;
  isLoading: boolean;
  sendMessage: (channelId: string, text: string) => Promise<void>;
}

function mapRow(row: any): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    senderId: row.sender_id || 'unknown',
    senderName: row.sender_name,
    text: row.text,
    timestamp: new Date(row.created_at),
  };
}

export function useChat(): UseChatResult {
  const [messagesByChannel, setMessagesByChannel] = useState<Record<ChannelId, ChatMessage[]>>(
    () => Object.fromEntries(CHANNELS.map(c => [c, []])) as Record<ChannelId, ChatMessage[]>
  );
  const [isLoading, setIsLoading] = useState(true);

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

    await supabase.from('chat_messages').insert({
      channel_id: channelId,
      text: text.trim(),
    });
  }, []);

  return {
    messagesByChannel,
    isLoading,
    sendMessage,
  };
}
