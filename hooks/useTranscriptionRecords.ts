import { useState, useEffect, useCallback } from 'react';
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

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simple fetch: no session check here, RLS handles auth
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[TranscriptionRecords] Load error:', fetchError.message, fetchError.details);
        setError(fetchError.message);
        return;
      }

      console.log(`[TranscriptionRecords] Fetched ${data?.length || 0} records`);
      setRecords(data || []);
    } catch (err: any) {
      console.error('[TranscriptionRecords] Unexpected error:', err);
      setError(err?.message || 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    try {
      // Get session to obtain user_id
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        console.error('[TranscriptionRecords] No session for addRecord:', sessionError?.message);
        // Try a quick refresh
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!refreshed.session?.user?.id) {
          setError('Sesión expirada. Vuelve a iniciar sesión.');
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
          console.error('[TranscriptionRecords] Insert error (after refresh):', insertError.message);
          setError('Error al guardar: ' + insertError.message);
          return false;
        }
        setRecords(prev => [insertedData as TranscriptionRecord, ...prev]);
        setError(null);
        return true;
      }

      const { error: insertError, data: insertedData } = await supabase
        .from('transcription_records')
        .insert({
          user_id: session.user.id,
          name: record.name,
          text: record.text,
        } as any)
        .select()
        .single();

      if (insertError) {
        console.error('[TranscriptionRecords] Insert error:', insertError.message);
        setError('Error al guardar: ' + insertError.message);
        return false;
      }

      setRecords(prev => [insertedData as TranscriptionRecord, ...prev]);
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