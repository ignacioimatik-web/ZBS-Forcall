import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Libranza } from '../types';

interface UseLibranzasResult {
  libranzas: Libranza[];
  isLoading: boolean;
  error: string | null;
  addLibranza: (libranza: Omit<Libranza, 'id'>) => Promise<Libranza | null>;
  updateLibranza: (libranza: Libranza) => Promise<boolean>;
  deleteLibranza: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useLibranzas(): UseLibranzasResult {
  const [libranzas, setLibranzas] = useState<Libranza[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLibranzas = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('libranzas')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('Error loading libranzas:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: Libranza[] = (data || []).map(row => ({
        id: row.id,
        date: new Date(row.date),
        type: row.type as 'Médica' | 'Enfermería',
        personnelName: row.personnel_name,
        isChange: row.is_change,
        modifiedBy: row.modified_by || undefined,
        modifiedAt: row.modified_at ? new Date(row.modified_at) : undefined
      }));

      setLibranzas(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading libranzas:', err);
      setError(err?.message || 'Error al cargar libranzas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibranzas();
  }, [loadLibranzas]);

  const addLibranza = useCallback(async (libranza: Omit<Libranza, 'id'>): Promise<Libranza | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('libranzas')
        .insert({
          date: `${libranza.date.getFullYear()}-${String(libranza.date.getMonth() + 1).padStart(2, '0')}-${String(libranza.date.getDate()).padStart(2, '0')}`,
          personnel_name: libranza.personnelName,
          type: libranza.type,
          is_change: libranza.isChange || false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding libranza:', insertError);
        setError(insertError.message);
        return null;
      }

      const newLibranza: Libranza = {
        id: data.id,
        date: new Date(data.date),
        type: data.type as 'Médica' | 'Enfermería',
        personnelName: data.personnel_name,
        isChange: data.is_change,
        modifiedBy: data.modified_by || undefined,
        modifiedAt: data.modified_at ? new Date(data.modified_at) : undefined
      };

      setLibranzas(prev => [...prev, newLibranza]);
      return newLibranza;
    } catch (err: any) {
      console.error('Unexpected error adding libranza:', err);
      setError(err?.message || 'Error al añadir libranza');
      return null;
    }
  }, []);

  const updateLibranza = useCallback(async (libranza: Libranza): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('libranzas')
        .update({
          date: `${libranza.date.getFullYear()}-${String(libranza.date.getMonth() + 1).padStart(2, '0')}-${String(libranza.date.getDate()).padStart(2, '0')}`,
          personnel_name: libranza.personnelName,
          type: libranza.type,
          is_change: libranza.isChange || false
        })
        .eq('id', libranza.id);

      if (updateError) {
        console.error('Error updating libranza:', updateError);
        setError(updateError.message);
        return false;
      }

      setLibranzas(prev => prev.map(l => l.id === libranza.id ? libranza : l));
      return true;
    } catch (err: any) {
      console.error('Unexpected error updating libranza:', err);
      setError(err?.message || 'Error al actualizar libranza');
      return false;
    }
  }, []);

  const deleteLibranza = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('libranzas')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting libranza:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setLibranzas(prev => prev.filter(l => l.id !== id));
      return true;
    } catch (err: any) {
      console.error('Unexpected error deleting libranza:', err);
      setError(err?.message || 'Error al eliminar libranza');
      return false;
    }
  }, []);

  return {
    libranzas,
    isLoading,
    error,
    addLibranza,
    updateLibranza,
    deleteLibranza,
    refresh: loadLibranzas
  };
}
