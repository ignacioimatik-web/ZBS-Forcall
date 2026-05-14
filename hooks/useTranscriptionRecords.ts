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

  const loadRecords = useCallback(async () => {
    if (loadRef.current) return;
    loadRef.current = true;
    setIsLoading(true);

    try {
      // Verify session exists
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[TranscriptionRecords] Session error:', sessionError.message);
        setError('Error de sesión: ' + sessionError.message);
        return;
      }

      const session = sessionData?.session;
      if (!session?.user?.id) {
        console.error('[TranscriptionRecords] No authenticated user');
        setRecords([]);
        setError(null);
        return;
      }

      // Refresh token if near expiry (<5 min)
      const expiresAt = session.expires_at || 0;
      const now = Date.now() / 1000;
      let userId = session.user.id;

      if (expiresAt - now < 300) {
        console.log('[TranscriptionRecords] Refreshing token...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[TranscriptionRecords] Token refresh failed:', refreshError.message);
          setError('Sesión expirada. Vuelve a iniciar sesión.');
          setRecords([]);
          return;
        }
        userId = refreshed.session?.user?.id || userId;
      }

      // Fetch ALL records (shared library, no user filter)
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
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
      console.error('[TranscriptionRecords] Load error:', err);
      setError(err?.message || 'Error al cargar historial de grabaciones');
    } finally {
      setIsLoading(false);
      loadRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadRecords();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[TranscriptionRecords] Auth event:', event, 'userId:', session?.user?.id);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await loadRecords();
      }
      if (event === 'SIGNED_OUT') {
        setRecords([]);
        setError(null);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[TranscriptionRecords] addRecord session error:', sessionError.message);
        setError('Error de sesión al guardar.');
        return false;
      }

      const session = sessionData?.session;
      let userId = session?.user?.id;

      if (!userId) {
        console.error('[TranscriptionRecords] addRecord: no userId');
        // Try refreshing
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        userId = refreshed.session?.user?.id || '';
        if (!userId) {
          setError('Usuario no autenticado. Vuelve a iniciar sesión.');
          return false;
        }
      }

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