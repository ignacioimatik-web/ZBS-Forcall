import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TranscriptionRecord = Database['public']['Tables']['transcription_records']['Row'];
type TranscriptionRecordInsert = Database['public']['Tables']['transcription_records']['Insert'];

interface UseTranscriptionRecordsResult {
  records: TranscriptionRecord[];
  isLoading: boolean;
  error: string | null;
  addRecord: (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useTranscriptionRecords(): UseTranscriptionRecordsResult {
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading transcription records:', fetchError);
        setError(fetchError.message);
        return;
      }

      setRecords(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading transcription records:', err);
      setError(err?.message || 'Error al cargar historial de grabaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at'>) => {
    try {
      const { error: insertError } = await supabase
        .from('transcription_records')
        .insert({
          user_id: supabase.auth.getUser()?.id || '',
          name: record.name,
          text: record.text,
        });

      if (insertError) {
        console.error('Error adding transcription record:', insertError);
        setError(insertError.message);
        return;
      }

      await loadRecords();
    } catch (err: any) {
      console.error('Unexpected error adding transcription record:', err);
      setError(err?.message || 'Error al guardar grabación');
    }
  }, [loadRecords]);

  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('transcription_records')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting transcription record:', deleteError);
        return false;
      }

      setRecords(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      console.error('Unexpected error deleting transcription record:', err);
      return false;
    }
  }, []);

  return {
    records,
    isLoading,
    error,
    addRecord,
    deleteRecord,
    refresh: loadRecords,
  };
}