import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

interface UseAvisosResult {
  avisos: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addAviso: (text: string, isUrgent: boolean) => Promise<ChatMessage | null>;
  refresh: () => Promise<void>;
}

export function useAvisos(channelId: string = 'avisos'): UseAvisosResult {
  const [avisos, setAvisos] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvisos = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('avisos')
        .select('*')
        .eq('channel', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) {
        console.error('Error loading avisos:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: ChatMessage[] = (data || []).map(row => ({
        id: row.id,
        channelId: row.channel,
        senderId: row.sender_user_id || 'system',
        senderName: row.sender_name,
        text: row.text,
        timestamp: new Date(row.created_at),
        isUrgent: row.is_urgent
      }));

      setAvisos(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading avisos:', err);
      setError(err?.message || 'Error al cargar avisos');
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    loadAvisos();

    // Suscripción en tiempo real
    const subscription = supabase
      .channel(`avisos:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'avisos',
        filter: `channel=eq.${channelId}`
      }, (payload) => {
        const row = payload.new;
        const newAviso: ChatMessage = {
          id: row.id,
          channelId: row.channel,
          senderId: row.sender_user_id || 'system',
          senderName: row.sender_name,
          text: row.text,
          timestamp: new Date(row.created_at),
          isUrgent: row.is_urgent
        };
        setAvisos(prev => [...prev, newAviso]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, loadAvisos]);

  const addAviso = useCallback(async (text: string, isUrgent: boolean): Promise<ChatMessage | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId || '')
        .single();

      const senderName = profileData?.full_name || 'Usuario';

      const { data, error: insertError } = await supabase
        .from('avisos')
        .insert({
          channel: channelId,
          sender_user_id: userId || null,
          sender_name: senderName,
          text: text,
          is_urgent: isUrgent
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding aviso:', insertError);
        setError(insertError.message);
        return null;
      }

      // El realtime subscription se encargará de añadirlo
      return {
        id: data.id,
        channelId: data.channel,
        senderId: data.sender_user_id || 'system',
        senderName: data.sender_name,
        text: data.text,
        timestamp: new Date(data.created_at),
        isUrgent: data.is_urgent
      };
    } catch (err: any) {
      console.error('Unexpected error adding aviso:', err);
      setError(err?.message || 'Error al enviar aviso');
      return null;
    }
  }, [channelId]);

  return {
    avisos,
    isLoading,
    error,
    addAviso,
    refresh: loadAvisos
  };
}
