import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Vacacion } from '../types';

interface UseVacacionesResult {
  vacaciones: Vacacion[];
  isLoading: boolean;
  error: string | null;
  addVacacion: (vacacion: Omit<Vacacion, 'id'>) => Promise<Vacacion | null>;
  deleteVacacion: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useVacaciones(): UseVacacionesResult {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVacaciones = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('vacaciones')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('Error loading vacaciones:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: Vacacion[] = (data || []).map(row => ({
        id: row.id,
        date: new Date(row.date),
        type: row.type as 'medica' | 'enfermeria',
        personnelName: row.personnel_name,
        isChange: row.is_change,
        modifiedBy: row.modified_by || undefined,
        modifiedAt: row.modified_at ? new Date(row.modified_at) : undefined
      }));

      setVacaciones(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading vacaciones:', err);
      setError(err?.message || 'Error al cargar vacaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVacaciones();
  }, [loadVacaciones]);

  const addVacacion = useCallback(async (vacacion: Omit<Vacacion, 'id'>): Promise<Vacacion | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('vacaciones')
        .insert({
          date: `${vacacion.date.getFullYear()}-${String(vacacion.date.getMonth() + 1).padStart(2, '0')}-${String(vacacion.date.getDate()).padStart(2, '0')}`,
          personnel_name: vacacion.personnelName,
          type: vacacion.type,
          is_change: vacacion.isChange || false,
          modified_by: vacacion.modifiedBy || null,
          modified_at: vacacion.modifiedAt?.toISOString() || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding vacacion:', insertError);
        setError(insertError.message);
        return null;
      }

      const newVacacion: Vacacion = {
        id: data.id,
        date: new Date(data.date),
        type: data.type as 'medica' | 'enfermeria',
        personnelName: data.personnel_name,
        isChange: data.is_change,
        modifiedBy: data.modified_by || undefined,
        modifiedAt: data.modified_at ? new Date(data.modified_at) : undefined
      };

      setVacaciones(prev => [...prev, newVacacion]);
      return newVacacion;
    } catch (err: any) {
      console.error('Unexpected error adding vacacion:', err);
      setError(err?.message || 'Error al añadir vacación');
      return null;
    }
  }, []);

  const deleteVacacion = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('vacaciones')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting vacacion:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setVacaciones(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (err: any) {
      console.error('Unexpected error deleting vacacion:', err);
      setError(err?.message || 'Error al eliminar vacación');
      return false;
    }
  }, []);

  return {
    vacaciones,
    isLoading,
    error,
    addVacacion,
    deleteVacacion,
    refresh: loadVacaciones
  };
}
