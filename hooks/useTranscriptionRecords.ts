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

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const loadRecords = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    // Timeout de seguridad: si tarda más de 15s, liberar
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 15000);

    try {
      // Verificar sesión primero
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      if (sessionError) {
        console.error('[TranscriptionRecords] Session error:', sessionError.message);
        setError('Error de sesión. Recarga la página.');
        return;
      }

      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        console.error('[TranscriptionRecords] No userId found in session');
        setRecords([]);
        return;
      }

      // Intentar refresh del token si está cerca de expirar
      const expiresAt = sessionData?.session?.expires_at || 0;
      if (expiresAt - Date.now() / 1000 < 300) {
        try {
          await supabase.auth.refreshSession();
        } catch {
          // Si el refresh falla, continuar de todas formas
        }
      }

      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);
      if (!mountedRef.current) return;

      if (fetchError) {
        console.error('[TranscriptionRecords] Fetch error:', fetchError.message, fetchError.details);
        setError('Error al cargar: ' + fetchError.message);
        return;
      }

      console.log('[TranscriptionRecords] Fetched', data?.length || 0, 'records');
      setRecords(data || []);
      setError(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (!mountedRef.current) return;
      console.error('[TranscriptionRecords] Error:', err);
      setError(err?.message || 'Error al cargar historial');
    } finally {
      if (mountedRef.current) {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    if (!mountedRef.current) return false;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.id) {
        try {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (!refreshed.session?.user?.id) {
            if (mountedRef.current) setError('Sesión expirada. Vuelve a iniciar sesión.');
            return false;
          }
          const { error: insertError, data: insertedData } = await supabase
            .from('transcription_records')
            .insert({
              user_id: refreshed.session.user.id,
              name: record.name,
              text: record.text,
            } as any)
            .select()
            .single();

          if (insertError) {
            if (mountedRef.current) setError('Error al guardar: ' + insertError.message);
            return false;
          }
          if (mountedRef.current) {
            setRecords(prev => [insertedData as TranscriptionRecord, ...prev]);
            setError(null);
          }
          return true;
        } catch (refreshErr) {
          if (mountedRef.current) setError('Error al actualizar sesión.');
          return false;
        }
      }

      const userId = sessionData.session.user.id;
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