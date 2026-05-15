import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage, Profile } from '../types';

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
  profiles: Profile[];
  messagesByChannel: Record<string, ChatMessage[]>;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  sendPrivateMessage: (receiverId: string, text: string) => Promise<void>;
  sendImage: (file: File, receiverId?: string) => Promise<void>;
  sendAudio: (blob: Blob, receiverId?: string) => Promise<void>;
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
    receiverId: row.receiver_id || undefined,
  };
}

const TEAM_KEY = 'general';

function dmChannelKey(myId: string, otherId: string): string {
  return [myId, otherId].sort().join('_');
}

// Cache global: sobrevive al desmontaje del componente
let cachedProfiles: Profile[] = [];
let cacheTimestamp = 0;
const PROFILE_CACHE_TTL = 300000; // 5 minutos

export function useChat(currentUserId?: string | null): UseChatResult {
  const uid = currentUserId || null;
  const [profiles, setProfiles] = useState<Profile[]>(cachedProfiles);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const mountedRef = useRef(true);
  const profileRetries = useRef(0);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('is_active', true).order('full_name');
      if (data && data.length > 0) {
        cachedProfiles = data;
        cacheTimestamp = Date.now();
        if (mountedRef.current) {
          setProfiles(data);
          profileRetries.current = 0;
        }
      } else if (profileRetries.current < 3) {
        profileRetries.current++;
        setTimeout(loadProfiles, 1000 * profileRetries.current);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
    }
  }, []);

  const addMessage = useCallback((channelKey: string, msg: ChatMessage) => {
    setMessagesByChannel(prev => {
      const list = prev[channelKey] || [];
      if (list.some(m => m.id === msg.id)) return prev;
      return { ...prev, [channelKey]: [...list, msg] };
    });
  }, []);

  const removeMessage = useCallback((msgId: string) => {
    setMessagesByChannel(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(m => m.id !== msgId);
      }
      return next;
    });
  }, []);

  const getChannelKey = useCallback((row: any): string | null => {
    if (row.channel_id === 'general' && !row.receiver_id) return TEAM_KEY;
    if (row.channel_id === 'dm' && row.receiver_id && uid) {
      const sender = row.sender_id || uid;
      return dmChannelKey(uid, sender === uid ? row.receiver_id : sender);
    }
    return null;
  }, [uid]);

  const loadAllMessages = useCallback(async () => {
    if (!uid) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const grouped: Record<string, ChatMessage[]> = {};
      (data || []).forEach(row => {
        const key = getChannelKey(row);
        if (key) {
          if (!grouped[key]) grouped[key] = [];
          const msg = mapRow(row);
          if (!grouped[key].some(m => m.id === msg.id)) grouped[key].push(msg);
        }
      });
      setMessagesByChannel(grouped);
    } catch (err) {
      console.error('Unexpected error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [uid, getChannelKey]);

  // Cargar perfiles (con caché)
  useEffect(() => {
    const cacheFresh = (Date.now() - cacheTimestamp) < PROFILE_CACHE_TTL;
    if (cacheFresh && cachedProfiles.length > 0) {
      setProfiles(cachedProfiles);
      profileRetries.current = 0;
    } else {
      loadProfiles();
    }
  }, [loadProfiles]);

  // Cargar mensajes cuando hay usuario
  useEffect(() => {
    if (uid) loadAllMessages();
  }, [uid, loadAllMessages]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!uid) return;

    const subscription = supabase
      .channel('chat_messages_all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const key = getChannelKey(payload.new);
        if (key) addMessage(key, mapRow(payload.new));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        removeMessage(payload.old.id);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid, getChannelKey, addMessage, removeMessage]);

  // Reenvío a Telegram (no bloquea la UI)
  const forwardToTelegram = useCallback(async (text: string, senderName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`${supabase.supabaseUrl}/functions/v1/telegram-forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text,
          sender_name: senderName,
          user_id: session.user.id,
        }),
      });
    } catch (err) {
      console.error('Telegram forward failed:', err);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || text.length > 2000) return;
    const { data, error } = await supabase.from('chat_messages').insert({
      channel_id: TEAM_KEY,
      text: text.trim(),
    } as any).select();
    if (error) {
      console.error('Error enviando mensaje:', error.message);
      return;
    }
    if (data?.[0]) {
      addMessage(TEAM_KEY, mapRow(data[0]));
      forwardToTelegram(text.trim(), data[0].sender_name || 'Equipo');
    }
  }, [addMessage, forwardToTelegram]);

  const sendPrivateMessage = useCallback(async (receiverId: string, text: string) => {
    if (!text.trim() || text.length > 2000 || !uid) return;
    const { data, error } = await supabase.from('chat_messages').insert({
      channel_id: 'dm',
      text: text.trim(),
      receiver_id: receiverId,
    } as any).select();
    if (error) {
      console.error('Error enviando mensaje privado:', error.message);
      return;
    }
    if (data?.[0]) {
      const key = getChannelKey(data[0]);
      if (key) addMessage(key, mapRow(data[0]));
    }
  }, [uid, getChannelKey, addMessage]);

  const uploadFile = useCallback(async (file: File | Blob, ext: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileName = `${uuidv4()}.${ext}`;
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

  const sendImage = useCallback(async (file: File, receiverId?: string) => {
    if (receiverId && !uid) return;
    const url = await uploadFile(file, file.name.split('.').pop() || 'jpg');
    if (!url) return;

    const insertData: any = {
      channel_id: receiverId ? 'dm' : TEAM_KEY,
      text: '',
      image_url: url,
    };
    if (receiverId) insertData.receiver_id = receiverId;

    const { data, error } = await supabase.from('chat_messages').insert(insertData as any).select();
    if (error) {
      console.error('Error enviando imagen:', error.message);
      return;
    }
    if (data?.[0]) {
      const key = getChannelKey(data[0]);
      if (key) addMessage(key, mapRow(data[0]));
      if (!receiverId) forwardToTelegram('📷 [Imagen]', data[0].sender_name || 'Equipo');
    }
  }, [uploadFile, uid, getChannelKey, addMessage, forwardToTelegram]);

  const sendAudio = useCallback(async (blob: Blob, receiverId?: string) => {
    if (receiverId && !uid) return;
    const url = await uploadFile(blob, 'webm');
    if (!url) return;

    const insertData: any = {
      channel_id: receiverId ? 'dm' : TEAM_KEY,
      text: '',
      audio_url: url,
    };
    if (receiverId) insertData.receiver_id = receiverId;

    const { data, error } = await supabase.from('chat_messages').insert(insertData as any).select();
    if (error) {
      console.error('Error enviando audio:', error.message);
      return;
    }
    if (data?.[0]) {
      const key = getChannelKey(data[0]);
      if (key) addMessage(key, mapRow(data[0]));
      if (!receiverId) forwardToTelegram('🎤 [Mensaje de voz]', data[0].sender_name || 'Equipo');
    }
  }, [uploadFile, uid, getChannelKey, addMessage, forwardToTelegram]);

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

      removeMessage(msg.id);
    } catch (err) {
      console.error('Error inesperado al eliminar mensaje:', err);
    }
  }, [removeMessage]);

  return {
    profiles,
    messagesByChannel,
    isLoading,
    sendMessage,
    sendPrivateMessage,
    sendImage,
    sendAudio,
    deleteMessage,
    isUploading,
  };
}