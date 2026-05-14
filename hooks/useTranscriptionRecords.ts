import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TranscriptionRecord = Database['public']['Tables']['transcription_records']['Row'];
type TranscriptionRecordInsert = Database['public']['Tables']['transcription_records']['Insert'];

interface UseTranscriptionRecordsResult {
  records: TranscriptionRecord[];
  isLoading: boolean;
  error: string | null;
  addRecord: (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useTranscriptionRecords(): UseTranscriptionRecordsResult {
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(false);

  const fetchRecords = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[TranscriptionRecords] Error loading:', fetchError.message);
        setError(fetchError.message);
        return;
      }

      console.log(`[TranscriptionRecords] Fetched ${data?.length || 0} records`);
      setRecords(data || []);
      setError(null);
    } catch (err: any) {
      console.error('[TranscriptionRecords] Unexpected error:', err);
      setError(err?.message || 'Error al cargar historial');
    }
  }, []);

  const loadRecords = useCallback(async () => {
    // Prevent concurrent loads
    if (loadRef.current) return;
    loadRef.current = true;
    setIsLoading(true);

    try {
      // 1. Get session (refreshes token if expired)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[TranscriptionRecords] Session error:', sessionError.message);
        setError('Error de sesión: ' + sessionError.message);
        return;
      }

      const session = sessionData?.session;
      if (!session) {
        console.error('[TranscriptionRecords] No session found');
        setError('No hay sesión activa');
        setRecords([]);
        return;
      }

      const userId = session.user.id;
      const token = session.access_token;
      console.log('[TranscriptionRecords] Session user:', userId, 'Token valid:', !session.expires_at || session.expires_at > Date.now() / 1000);

      // 2. Ensure token is fresh (refresh if near expiry)
      const expiresAt = session.expires_at || 0;
      const fiveMinutes = 300;
      if (expiresAt - Date.now() / 1000 < fiveMinutes) {
        console.log('[TranscriptionRecords] Refreshing token...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[TranscriptionRecords] Token refresh error:', refreshError.message);
          setError('Sesión expirada. Vuelve a iniciar sesión.');
          return;
        }
        await fetchRecords(refreshed.session?.user.id || userId);
      } else {
        await fetchRecords(userId);
      }
    } catch (err: any) {
      console.error('[TranscriptionRecords] Load error:', err);
      setError(err?.message || 'Error al cargar historial de grabaciones');
    } finally {
      setIsLoading(false);
      loadRef.current = false;
    }
  }, [fetchRecords]);

  // Load on mount and subscribe to auth changes
  useEffect(() => {
    loadRecords();

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[TranscriptionRecords] Auth event:', event, 'User:', session?.user?.id);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await loadRecords();
      }
      if (event === 'SIGNED_OUT') {
        setRecords([]);
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session) {
        console.error('[TranscriptionRecords] No session for addRecord');
        setError('Usuario no autenticado. Vuelve a iniciar sesión.');
        return false;
      }

      const userId = session.user.id;
      console.log('[TranscriptionRecords] Adding record for user:', userId);

      const { error: insertError, data: insertedData } = await supabase
        .from('transcription_records')
        .insert({
          user_id: userId,
          name: record.name,
          text: record.text,
        } as any)
        .select()
        .single();

      if (insertError) {
        console.error('[TranscriptionRecords] Insert error:', insertError.message, insertError.details);
        setError('Error al guardar: ' + insertError.message);
        return false;
      }

      const newRecord = insertedData as TranscriptionRecord;
      console.log('[TranscriptionRecords] Record inserted:', newRecord.id);
      setRecords(prev => [newRecord, ...prev]);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('[TranscriptionRecords] Add error:', err);
      setError(err?.message || 'Error al guardar grabación');
      return false;
    }
  }, []);

  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('transcription_records')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[TranscriptionRecords] Delete error:', deleteError.message);
        return false;
      }

      setRecords(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      console.error('[TranscriptionRecords] Delete unexpected error:', err);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    records,
    isLoading,
    error,
    addRecord,
    deleteRecord,
    refresh: loadRecords,
    clearError,
  };
}