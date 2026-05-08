import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';

interface UseAuditLogsResult {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuditLogs(): UseAuditLogsResult {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.error('Error loading audit logs:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: AuditLog[] = (data || []).map(row => {
        const payload = row.payload || {};
        return {
          id: row.id,
          type: mapActionToType(row.action),
          user: row.actor_name || 'Sistema',
          timestamp: new Date(row.created_at),
          description: row.description || '',
          category: row.category || row.entity_type || '',
          details: payload.details || (payload.from ? {
            from: payload.from,
            to: payload.to,
            date1: payload.date1 ? new Date(payload.date1) : new Date(),
            date2: payload.date2 ? new Date(payload.date2) : new Date(),
          } : undefined)
        };
      });

      setLogs(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading audit logs:', err);
      setError(err?.message || 'Error al cargar logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLog = useCallback(async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    try {
      const payload: any = {};
      if (log.details) {
        payload.details = {
          from: log.details.from,
          to: log.details.to,
          date1: log.details.date1.toISOString(),
          date2: log.details.date2.toISOString(),
        };
      }

      const { error: insertError } = await supabase
        .from('audit_logs')
        .insert({
          actor_name: log.user,
          action: mapTypeToAction(log.type),
          description: log.description,
          category: log.category,
          payload,
        });

      if (insertError) {
        console.error('Error adding audit log:', insertError);
        return;
      }

      await loadLogs();
    } catch (err: any) {
      console.error('Unexpected error adding audit log:', err);
    }
  }, [loadLogs]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    error,
    addLog,
    refresh: loadLogs,
  };
}

function mapActionToType(action: string): AuditLog['type'] {
  switch (action) {
    case 'VALIDACION': return 'VALIDACION';
    case 'CAMBIO': return 'CAMBIO';
    case 'PERMUTA': return 'PERMUTA';
    case 'CREACION': return 'CAMBIO';
    case 'ELIMINACION': return 'CAMBIO';
    default: return 'CAMBIO';
  }
}

function mapTypeToAction(type: AuditLog['type']): string {
  switch (type) {
    case 'VALIDACION': return 'VALIDACION';
    case 'CAMBIO': return 'CAMBIO';
    case 'PERMUTA': return 'PERMUTA';
    default: return 'CAMBIO';
  }
}
