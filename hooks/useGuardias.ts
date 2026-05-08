import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Guardia } from '../types';

// Tipos fijos según CHECK constraint: 'medica' o 'enfermeria' (SIN tildes)
const VALID_TYPES = ['medica', 'enfermeria'];

// Convertir cualquier formato a frontend (SIEMPRE medica/enfermeria sin tildes)
function toFrontendType(dbType: string): 'medica' | 'enfermeria' {
  const lowered = dbType.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (lowered === 'medica') return 'medica';
  if (lowered === 'enfermeria') return 'enfermeria';
  return 'medica'; // Por defecto medica
}

// Convertir a formato BD (SIEMPRE medica/enfermeria con tildes)
function toDBType(frontendType: string): string {
  const lowered = frontendType.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (lowered === 'medica') return 'medica';
  if (lowered === 'enfermeria') return 'enfermeria';
  return frontendType; // Asumimos que ya tiene el formato correcto
}

interface UseGuardiasResult {
  guardias: Guardia[];
  isLoading: boolean;
  error: string | null;
  addGuardia: (guardia: Omit<Guardia, 'id'>) => Promise<Guardia | null>;
  updateGuardia: (guardia: Guardia) => Promise<boolean>;
  deleteGuardia: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useGuardias(): UseGuardiasResult {
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGuardias = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('guardias')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('Error loading guardias:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Convertir fechas y normalizar tipos a formato frontend (medica/enfermeria)
      const mapped: Guardia[] = (data || []).map(row => ({
        id: row.id,
        date: new Date(row.date),
        time: undefined,
        type: toFrontendType(row.type),
        personnelName: row.personnel_name,
        isChange: row.is_change,
        modifiedBy: row.modified_by || undefined,
        modifiedAt: row.modified_at ? new Date(row.modified_at) : undefined
      }));

      setGuardias(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading guardias:', err);
      setError(err?.message || 'Error al cargar guardias');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuardias();
  }, [loadGuardias]);

  const addGuardia = useCallback(async (guardia: Omit<Guardia, 'id'>): Promise<Guardia | null> => {
    try {
      const dbType = toDBType(guardia.type);
      const { data, error: insertError } = await supabase
        .from('guardias')
        .insert({
          date: `${guardia.date.getFullYear()}-${String(guardia.date.getMonth() + 1).padStart(2, '0')}-${String(guardia.date.getDate()).padStart(2, '0')}`,
          personnel_name: guardia.personnelName,
          type: dbType,
          is_change: guardia.isChange || false,
          modified_by: guardia.modifiedBy || null,
          modified_at: guardia.modifiedAt?.toISOString() || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding guardia:', insertError);
        setError(insertError.message);
        return null;
      }

      const newGuardia: Guardia = {
        id: data.id,
        date: new Date(data.date),
        type: toFrontendType(data.type),
        personnelName: data.personnel_name,
        isChange: data.is_change,
        modifiedBy: data.modified_by || undefined,
        modifiedAt: data.modified_at ? new Date(data.modified_at) : undefined
      };

      setGuardias(prev => [...prev, newGuardia]);
      return newGuardia;
    } catch (err: any) {
      console.error('Unexpected error adding guardia:', err);
      setError(err?.message || 'Error al añadir guardia');
      return null;
    }
  }, []);

  const updateGuardia = useCallback(async (guardia: Guardia): Promise<boolean> => {
    try {
      // Mantener el tipo ORIGINAL de la BD para NO mezclar médicos/enfermeras
      const { data: currentData, error: readError } = await supabase
        .from('guardias')
        .select('type')
        .eq('id', guardia.id)
        .single();

      if (readError) {
        console.error('Error reading guardia type:', readError);
        setError(readError.message);
        return false;
      }

      // Usar el tipo que YA está en BD (no cambiarlo nunca)
      const dbType = currentData?.type || toDBType(guardia.type);

      const { error: updateError } = await supabase
        .from('guardias')
        .update({
          date: `${guardia.date.getFullYear()}-${String(guardia.date.getMonth() + 1).padStart(2, '0')}-${String(guardia.date.getDate()).padStart(2, '0')}`,
          personnel_name: guardia.personnelName,
          type: dbType, // Mantener tipo original SIEMPRE
          is_change: guardia.isChange || false,
          modified_by: guardia.modifiedBy || null,
          modified_at: guardia.modifiedAt?.toISOString() || null
        })
        .eq('id', guardia.id);

      if (updateError) {
        console.error('Error updating guardia:', updateError);
        setError(updateError.message);
        return false;
      }

      setGuardias(prev => prev.map(g => g.id === guardia.id ? guardia : g));
      return true;
    } catch (err: any) {
      console.error('Unexpected error updating guardia:', err);
      setError(err?.message || 'Error al actualizar guardia');
      return false;
    }
  }, []);

  const deleteGuardia = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('guardias')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting guardia:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setGuardias(prev => prev.filter(g => g.id !== id));
      return true;
    } catch (err: any) {
      console.error('Unexpected error deleting guardia:', err);
      setError(err?.message || 'Error al eliminar guardia');
      return false;
    }
  }, []);

  return {
    guardias,
    isLoading,
    error,
    addGuardia,
    updateGuardia,
    deleteGuardia,
    refresh: loadGuardias
  };
}


