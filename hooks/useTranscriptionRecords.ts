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
  const loadRef = useRef(false);

  const fetchRecords = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transcription_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[TranscriptionRecords] Error loading:', fetchError.message);
        setError(fetchError.message);
        return;
      }

      console.log(`[TranscriptionRecords] Fetched ${data?.length || 0} records for user ${userId}`);
      setRecords(data || []);
      setError(null);
    } catch (err: any) {
      console.error('[TranscriptionRecords] Unexpected error:', err);
      setError(err?.message || 'Error al cargar historial');
    }
  }, []);

  const loadRecords = useCallback(async () => {
    if (loadRef.current) return;
    loadRef.current = true;
    setIsLoading(true);

    try {
      // Get fresh session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[TranscriptionRecords] Session error:', sessionError.message);
        setError('Error de sesión: ' + sessionError.message);
        return;
      }

      const session = sessionData?.session;
      const userId = session?.user?.id;

      if (!userId) {
        console.error('[TranscriptionRecords] No userId in session:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
        });
        setRecords([]);
        setError(null);
        return;
      }

      // Refresh token if near expiry
      const expiresAt = session.expires_at || 0;
      const now = Date.now() / 1000;
      if (expiresAt - now < 300) {
        console.log('[TranscriptionRecords] Refreshing expired token...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[TranscriptionRecords] Token refresh failed:', refreshError.message);
          setError('Sesión expirada. Vuelve a iniciar sesión.');
          setRecords([]);
          return;
        }
        const newUserId = refreshed.session?.user?.id;
        if (newUserId) {
          await fetchRecords(newUserId);
        } else {
          setError('No se pudo renovar la sesión.');
          setRecords([]);
        }
      } else {
        await fetchRecords(userId);
      }
    } catch (err: any) {
      console.error('[TranscriptionRecords] Load error:', err);
      setError(err?.message || 'Error al cargar historial de grabaciones');
    } finally {
      setIsLoading(false);
      loadRef.current = false;
    }
  }, [fetchRecords]);

  useEffect(() => {
    loadRecords();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[TranscriptionRecords] Auth event:', event, 'userId:', session?.user?.id);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await loadRecords();
      }
      if (event === 'SIGNED_OUT') {
        setRecords([]);
        setError(null);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [loadRecords]);

  const addRecord = useCallback(async (record: Omit<TranscriptionRecordInsert, 'id' | 'created_at' | 'user_id'>): Promise<boolean> => {
    try {
      // 1. Get session with token refresh
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[TranscriptionRecords] addRecord session error:', sessionError.message);
        setError('Error de sesión al guardar.');
        return false;
      }

      const session = sessionData?.session;
      const userId = session?.user?.id;

      console.log('[TranscriptionRecords] addRecord session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: userId,
        email: session?.user?.email,
        tokenExpiresAt: session?.expires_at,
        now: Date.now() / 1000,
      });

      if (!userId) {
        console.error('[TranscriptionRecords] addRecord: userId is empty or null');

        // Try refreshing the session one more time
        console.log('[TranscriptionRecords] Attempting token refresh...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        const refreshedUserId = refreshed.session?.user?.id;
        console.log('[TranscriptionRecords] After refresh userId:', refreshedUserId);

        if (!refreshedUserId) {
          setError('Usuario no autenticado. Vuelve a iniciar sesión.');
          return false;
        }

        // Use refreshed user
        const { error: insertError, data: insertedData } = await supabase
          .from('transcription_records')
          .insert({
            user_id: refreshedUserId,
            name: record.name,
            text: record.text,
          } as any)
          .select()
          .single();

        if (insertError) {
          console.error('[TranscriptionRecords] Insert error after refresh:', insertError.message, insertError.details);
          setError('Error al guardar: ' + insertError.message);
          return false;
        }

        const newRecord = insertedData as TranscriptionRecord;
        console.log('[TranscriptionRecords] Record inserted (after refresh):', newRecord.id);
        setRecords(prev => [newRecord, ...prev]);
        setError(null);
        return true;
      }

      // Normal path: userId exists
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
        console.error('[TranscriptionRecords] Insert error:', insertError.message, insertError.details);
        setError('Error al guardar: ' + insertError.message);
        return false;
      }

      const newRecord = insertedData as TranscriptionRecord;
      console.log('[TranscriptionRecords] Record inserted:', newRecord.id);
      setRecords(prev => [newRecord, ...prev]);
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