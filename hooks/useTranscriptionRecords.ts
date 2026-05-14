import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TranscriptionRecord = Database['public']['Tables']['transcription_records']['Row'];
type TranscriptionRecordInsert = Database['public']['Tables']['transcription_records']['Insert'];

// Cache global: sobrevive al desmontaje del componente
let cachedRecords: TranscriptionRecord[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 120000; // 2 minutos

interface UseTranscriptionRecordsResult {
  records: TranscriptionRecord[];
  isLoading: boolean;
  error: string | null;
  addRecord: (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

let isRefreshingSession = false;

export function useTranscriptionRecords(): UseTranscriptionRecordsResult {
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadCountRef = useRef(0);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const loadRecords = useCallback(async (forceRefresh: boolean = false) => {
    if (!mountedRef.current) return;

    const currentLoad = ++loadCountRef.current;

    // Mostrar caché inmediatamente si está fresca (salto instantáneo)
    const cacheFresh = (Date.now() - cacheTimestamp) < CACHE_TTL;
    if (cacheFresh && cachedRecords.length > 0 && !forceRefresh) {
      setRecords(cachedRecords);
      setIsLoading(false);
      setError(null);
    }

    // Solo mostrar "cargando" en la primera carga real
    if (cachedRecords.length === 0 || forceRefresh) {
      setIsLoading(true);
    }
    setError(null);

    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loadCountRef.current === currentLoad) {
        setError('La conexión está tardando demasiado.');
        setIsLoading(false);
      }
    }, 8000);

    try {
      // Asegurar auto-refresh activo (es idempotent)
      supabase.auth.startAutoRefresh();

      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!mountedRef.current || loadCountRef.current !== currentLoad) {
        clearTimeout(timeoutId);
        return;
      }

      if (sessionError || !session?.user?.id) {
        if (!isRefreshingSession) {
          isRefreshingSession = true;
          try {
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshed.session?.user?.id) {
              setError('Sesión expirada. Vuelve a iniciar sesión.');
              setIsLoading(false);
              return;
            }
          } catch {
            setError('Error de conexión. Recarga la página.');
            setIsLoading(false);
            return;
          } finally {
            isRefreshingSession = false;
          }
        } else {
          // Otro proceso está refrescando, esperar un poco
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      // Consultar datos
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);
      if (!mountedRef.current || loadCountRef.current !== currentLoad) return;

      if (fetchError) {
        console.error('[TranscriptionRecords] Query error:', fetchError.message, fetchError.details);
        // No borrar caché si hay error de red
        setError('Error al cargar: ' + fetchError.message);
        if (cachedRecords.length > 0) {
          // Mantener datos en caché como fallback
          setIsLoading(false);
        }
        return;
      }

      cachedRecords = data || [];
      cacheTimestamp = Date.now();
      setRecords(cachedRecords);
      setError(null);
      console.log(`[TranscriptionRecords] Loaded ${cachedRecords.length} records`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (!mountedRef.current || loadCountRef.current !== currentLoad) return;
      console.error('[TranscriptionRecords] Error:', err);
      setError(err?.message || 'Error al cargar historial');
    } finally {
      if (mountedRef.current && loadCountRef.current === currentLoad) {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRecords();
    // NO detener auto-refresh al desmontar — es global y necesario
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      let userId = user?.id || '';

      if (!userId) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        userId = refreshed.session?.user?.id || '';
      }

      if (!userId) {
        setError('Sesión expirada.');
        return false;
      }

      const { error: insertError, data: insertedData } = await supabase
        .from('transcription_records')
        .insert({ user_id: userId, name: record.name, text: record.text } as any)
        .select()
        .single();

      if (insertError) {
        setError('Error al guardar: ' + insertError.message);
        return false;
      }

      // Actualizar caché local
      const newRecord = insertedData as TranscriptionRecord;
      cachedRecords = [newRecord, ...cachedRecords];
      cacheTimestamp = Date.now();
      setRecords(cachedRecords);
      setError(null);
      return true;
    } catch (err: any) {
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

      cachedRecords = cachedRecords.filter(r => r.id !== id);
      cacheTimestamp = Date.now();
      setRecords(cachedRecords);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar');
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { records, isLoading, error, addRecord, deleteRecord, refresh: loadRecords, clearError };
}