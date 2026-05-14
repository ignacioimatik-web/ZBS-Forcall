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
  const mountedRef = useRef(true);
  const loadRef = useRef(false);

  // Track mount state to prevent setting state on unmounted component
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

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
      if (mountedRef.current) {
        setError(err?.message || 'Error al cargar historial');
      }
    }
  }, []);

  const loadRecords = useCallback(async () => {
    if (loadRef.current) return;
    loadRef.current = true;
    setIsLoading(true);

    try {
      // Verify session exists
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[TranscriptionRecords] Session error:', sessionError.message);
        if (mountedRef.current) {
          setError('Error de sesión: ' + sessionError.message);
        }
        return;
      }

      const session = sessionData?.session;
      if (!session?.user?.id) {
        console.error('[TranscriptionRecords] No authenticated user');
        if (mountedRef.current) {
          setRecords([]);
          setError(null);
        }
        return;
      }

      // Refresh token if near expiry (<5 min)
      const expiresAt = session.expires_at || 0;
      const now = Date.now() / 1000;
      if (expiresAt - now < 300) {
        console.log('[TranscriptionRecords] Refreshing token...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[TranscriptionRecords] Token refresh failed:', refreshError.message);
          if (mountedRef.current) {
            setError('Sesión expirada. Vuelve a iniciar sesión.');
            setRecords([]);
          }
          return;
        }
        if (!refreshed.session?.user?.id) {
          if (mountedRef.current) {
            setError('Sesión expirada. Vuelve a iniciar sesión.');
            setRecords([]);
          }
          return;
        }
      }

      await fetchRecords();
    } catch (err: any) {
      console.error('[TranscriptionRecords] Load error:', err);
      if (mountedRef.current) {
        setError(err?.message || 'Error al cargar historial de grabaciones');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      loadRef.current = false;
    }
  }, [fetchRecords]);

  useEffect(() => {
    loadRecords();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[TranscriptionRecords] Auth event:', event, 'userId:', session?.user?.id);

      // Only reload on SIGN_IN or USER_UPDATED — NOT on TOKEN_REFRESHED to avoid loops
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        loadRef.current = false; // Reset to allow reload
        loadRecords();
      }
      // NOTE: Do NOT clear records on SIGNED_OUT from subscription
      // It can fire during token refresh and wipe data incorrectly
    });

    return () => { subscription.unsubscribe(); };
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[TranscriptionRecords] addRecord session error:', sessionError.message);
        if (mountedRef.current) setError('Error de sesión al guardar.');
        return false;
      }

      const session = sessionData?.session;
      let userId = session?.user?.id;

      if (!userId) {
        console.error('[TranscriptionRecords] addRecord: no userId, refreshing...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        userId = refreshed.session?.user?.id || '';
        if (!userId) {
          if (mountedRef.current) setError('Usuario no autenticado. Vuelve a iniciar sesión.');
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
        if (mountedRef.current) setError('Error al guardar: ' + insertError.message);
        return false;
      }

      const newRecord = insertedData as TranscriptionRecord;
      console.log('[TranscriptionRecords] Record inserted:', newRecord.id);
      if (mountedRef.current) {
        setRecords(prev => [newRecord, ...prev]);
        setError(null);
      }
      return true;
    } catch (err: any) {
      console.error('[TranscriptionRecords] Add error:', err);
      if (mountedRef.current) setError(err?.message || 'Error al guardar grabación');
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

      if (mountedRef.current) {
        setRecords(prev => prev.filter(r => r.id !== id));
      }
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