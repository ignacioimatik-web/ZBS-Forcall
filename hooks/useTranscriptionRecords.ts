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

    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setError('La conexión está tardando demasiado.');
        setIsLoading(false);
      }
    }, 10000);

    try {
      // Query directa — Supabase maneja auth automáticamente con RLS
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);
      if (!mountedRef.current) return;

      if (fetchError) {
        // Si es error de RLS (403), los datos están protegidos correctamente
        // pero el usuario puede necesitar refrescar sesión
        if (fetchError.code === '42501' || fetchError.code === '403') {
          try {
            await supabase.auth.refreshSession();
            const { data: retryData, error: retryError } = await supabase
              .from('transcription_records')
              .select('*')
              .order('created_at', { ascending: false });

            if (retryError) {
              setError('Error al cargar: ' + retryError.message);
            } else {
              setRecords(retryData || []);
              setError(null);
            }
          } catch {
            setError('Sesión expirada. Recarga la página.');
            setRecords([]);
          }
        } else {
          setError('Error al cargar: ' + fetchError.message);
        }
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
      setRecords([]);
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      let userId = userData?.user?.id || '';

      if (!userId) {
        await supabase.auth.refreshSession();
        const { data: refreshed } = await supabase.auth.getUser();
        userId = refreshed.user?.id || '';
      }

      if (!userId) {
        setError('Sesión expirada.');
        return false;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('transcription_records')
        .insert({
          user_id: userId,
          name: record.name,
          text: record.text,
        } as any)
        .select()
        .single();

      if (insertError) {
        setError('Error al guardar: ' + insertError.message);
        return false;
      }

      setRecords(prev => [insertedData as TranscriptionRecord, ...prev]);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('[TranscriptionRecords] Add error:', err);
      setError(err?.message || 'Error al guardar');
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
        setError('Error al eliminar: ' + deleteError.message);
        return false;
      }

      setRecords(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar');
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { records, isLoading, error, addRecord, deleteRecord, refresh: loadRecords, clearError };
}