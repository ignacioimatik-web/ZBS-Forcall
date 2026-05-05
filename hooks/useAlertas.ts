import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Alerta {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
  source: string | null;
  published_at: Date;
  created_by: string | null;
  created_at: Date;
}

interface UseAlertasResult {
  alertas: Alerta[];
  isLoading: boolean;
  error: string | null;
  addAlerta: (alerta: Omit<Alerta, 'id' | 'created_at' | 'published_at'>) => Promise<Alerta | null>;
  refresh: () => Promise<void>;
}

export function useAlertas(): UseAlertasResult {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlertas = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('alertas')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error loading alertas:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: Alerta[] = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        severity: row.severity as 'info' | 'warning' | 'critical',
        source: row.source,
        published_at: new Date(row.published_at),
        created_by: row.created_by,
        created_at: new Date(row.created_at)
      }));

      setAlertas(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading alertas:', err);
      setError(err?.message || 'Error al cargar alertas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlertas();
  }, [loadAlertas]);

  const addAlerta = useCallback(async (alerta: Omit<Alerta, 'id' | 'created_at' | 'published_at'>): Promise<Alerta | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      const { data, error: insertError } = await supabase
        .from('alertas')
        .insert({
          title: alerta.title,
          content: alerta.content,
          severity: alerta.severity,
          source: alerta.source,
          created_by: userId || null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding alerta:', insertError);
        setError(insertError.message);
        return null;
      }

      const newAlerta: Alerta = {
        id: data.id,
        title: data.title,
        content: data.content,
        severity: data.severity as 'info' | 'warning' | 'critical',
        source: data.source,
        published_at: new Date(data.published_at),
        created_by: data.created_by,
        created_at: new Date(data.created_at)
      };

      setAlertas(prev => [newAlerta, ...prev]);
      return newAlerta;
    } catch (err: any) {
      console.error('Unexpected error adding alerta:', err);
      setError(err?.message || 'Error al añadir alerta');
      return null;
    }
  }, []);

  return {
    alertas,
    isLoading,
    error,
    addAlerta,
    refresh: loadAlertas
  };
}
