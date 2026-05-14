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
  const retryCountRef = useRef(0);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetchWithAuth = useCallback(async (): Promise<TranscriptionRecord[] | null> => {
    // Primero intentar getSession (rápido, usa caché local)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (!mountedRef.current) return null;

    let userId = sessionData?.session?.user?.id;

    // Si no hay userId en la sesión, intentar getUser (refresca el token si es necesario)
    if (!userId) {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('[TranscriptionRecords] getUser error:', userError.message);
          return null;
        }
        userId = userData?.user?.id;
      } catch (e: any) {
        console.error('[TranscriptionRecords] getUser exception:', e.message);
        return null;
      }
    }

    if (!userId) {
      console.error('[TranscriptionRecords] Still no userId after getUser + getSession');
      return null;
    }

    // Hacer la query con autenticación explícita
    const { data, error: fetchError } = await supabase
      .from('transcription_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[TranscriptionRecords] Query error:', fetchError.message, fetchError.details);
      return null;
    }

    return data || [];
  }, []);

  const loadRecords = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.warn('[TranscriptionRecords] Timeout after 15s');
        setIsLoading(false);
      }
    }, 15000);

    try {
      const data = await fetchWithAuth();

      clearTimeout(timeoutId);
      if (!mountedRef.current) return;

      if (data === null) {
        // Fallo de autenticación — reintentar máximo 3 veces
        if (retryCountRef.current < 3) {
          retryCountRef.current += 1;
          console.log(`[TranscriptionRecords] Retry ${retryCountRef.current}/3...`);
          setTimeout(() => loadRecords(), 1000 * retryCountRef.current);
        } else {
          setError('No se pudo conectar. Recarga la página.');
          setRecords([]);
        }
        return;
      }

      retryCountRef.current = 0; // Resetear contador de reintentos
      console.log(`[TranscriptionRecords] Fetched ${data.length || 0} records`);
      setRecords(data as TranscriptionRecord[]);
      setError(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (!mountedRef.current) return;
      console.error('[TranscriptionRecords] Unexpected error:', err);
      setError(err?.message || 'Error al cargar historial');
      setRecords([]);
    } finally {
      if (mountedRef.current) {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadRecords();

    // Recargar cuando la pestaña vuelve a ser visible
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        console.log('[TranscriptionRecords] Tab visible, refreshing...');
        retryCountRef.current = 0;
        loadRecords();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    if (!mountedRef.current) return false;

    try {
      let userId = '';

      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData?.session?.user?.id || '';

      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id || '';
      }

      if (!userId) {
        if (mountedRef.current) setError('Sesión expirada. Vuelve a iniciar sesión.');
        return false;
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
        console.error('[TranscriptionRecords] Insert error:', insertError.message);
        if (mountedRef.current) setError('Error al guardar: ' + insertError.message);
        return false;
      }

      if (mountedRef.current) {
        setRecords(prev => [insertedData as TranscriptionRecord, ...prev]);
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
      console.error('[TranscriptionRecords] Delete error:', err);
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