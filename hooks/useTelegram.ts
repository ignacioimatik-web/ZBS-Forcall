import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface TelegramChat {
  id: string;
  group_id: string;
  group_name: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface UseTelegramResult {
  linkedChats: TelegramChat[];
  isLoading: boolean;
  linkChat: (chatId: string, chatName: string) => Promise<{ success: boolean; error?: string }>;
  unlinkChat: (chatId: string) => Promise<{ success: boolean; error?: string }>;
  generateQR: () => Promise<{ success: boolean; qrUrl?: string; deepLink?: string; error?: string }>;
  isTelegramConfigured: boolean;
}

const BOT_USERNAME = 'ZBSforcabot';

export function useTelegram(): UseTelegramResult {
  const [linkedChats, setLinkedChats] = useState<TelegramChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLinkedChats([]);
        return;
      }

      const { data, error } = await supabase
        .from('telegram_chats')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching telegram chats:', error);
        return;
      }

      setLinkedChats(data || []);
    } catch (err) {
      console.error('Unexpected error fetching telegram chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Listen for realtime changes on telegram_chats
  useEffect(() => {
    const subscription = supabase
      .channel('telegram_chats_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'telegram_chats',
      }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchChats]);

  const linkChat = useCallback(async (chatId: string, chatName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'No autenticado' };

      // Check if already linked
      const { data: existing } = await supabase
        .from('telegram_chats')
        .select('id')
        .eq('group_id', chatId)
        .single();

      if (existing) {
        return { success: false, error: 'Este grupo ya está vinculado' };
      }

      const { error } = await supabase
        .from('telegram_chats')
        .insert({
          group_id: chatId,
          group_name: chatName,
          created_by: user.id,
          is_active: true,
        });

      if (error) return { success: false, error: error.message };

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const unlinkChat = useCallback(async (chatId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('telegram_chats')
        .delete()
        .eq('group_id', chatId);

      if (error) return { success: false, error: error.message };

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const generateQR = useCallback(async (): Promise<{ success: boolean; qrUrl?: string; deepLink?: string; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'No autenticado' };

      // Call the edge function to generate QR
      const { data, error } = await supabase.functions.invoke('telegram-qr', {
        body: { user_id: user.id },
      });

      if (error) return { success: false, error: error.message };

      return { success: true, qrUrl: data.qr_url, deepLink: data.deep_link };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const isTelegramConfigured = !!BOT_USERNAME;

  return {
    linkedChats,
    isLoading,
    linkChat,
    unlinkChat,
    generateQR,
    isTelegramConfigured,
  };
}