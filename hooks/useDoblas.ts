import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Dobla } from '../types';

interface UseDoblasResult {
  doblas: Dobla[];
  isLoading: boolean;
  error: string | null;
  addDobla: (dobla: Omit<Dobla, 'id'>) => Promise<Dobla | null>;
  updateDobla: (dobla: Dobla) => Promise<boolean>;
  deleteDobla: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useDoblas(): UseDoblasResult {
  const [doblas, setDoblas] = useState<Dobla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoblas = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('doblas')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('Error loading doblas:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: Dobla[] = (data || []).map(row => ({
        id: row.id,
        date: new Date(row.date),
        time: undefined,
        type: row.type as 'Médica' | 'Enfermería',
        personnelName: row.personnel_name,
        isChange: row.is_change
      }));

      setDoblas(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading doblas:', err);
      setError(err?.message || 'Error al cargar doblas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoblas();
  }, [loadDoblas]);

  const addDobla = useCallback(async (dobla: Omit<Dobla, 'id'>): Promise<Dobla | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('doblas')
        .insert({
          date: dobla.date.toISOString().split('T')[0],
          personnel_name: dobla.personnelName,
          type: dobla.type,
          is_change: dobla.isChange || false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding dobla:', insertError);
        setError(insertError.message);
        return null;
      }

      const newDobla: Dobla = {
        id: data.id,
        date: new Date(data.date),
        type: data.type as 'Médica' | 'Enfermería',
        personnelName: data.personnel_name,
        isChange: data.is_change
      };

      setDoblas(prev => [...prev, newDobla]);
      return newDobla;
    } catch (err: any) {
      console.error('Unexpected error adding dobla:', err);
      setError(err?.message || 'Error al añadir dobla');
      return null;
    }
  }, []);

  const updateDobla = useCallback(async (dobla: Dobla): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('doblas')
        .update({
          date: dobla.date.toISOString().split('T')[0],
          personnel_name: dobla.personnelName,
          type: dobla.type,
          is_change: dobla.isChange || false
        })
        .eq('id', dobla.id);

      if (updateError) {
        console.error('Error updating dobla:', updateError);
        setError(updateError.message);
        return false;
      }

      setDoblas(prev => prev.map(d => d.id === dobla.id ? dobla : d));
      return true;
    } catch (err: any) {
      console.error('Unexpected error updating dobla:', err);
      setError(err?.message || 'Error al actualizar dobla');
      return false;
    }
  }, []);

  const deleteDobla = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('doblas')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting dobla:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setDoblas(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (err: any) {
      console.error('Unexpected error deleting dobla:', err);
      setError(err?.message || 'Error al eliminar dobla');
      return false;
    }
  }, []);

  return {
    doblas,
    isLoading,
    error,
    addDobla,
    updateDobla,
    deleteDobla,
    refresh: loadDoblas
  };
}
