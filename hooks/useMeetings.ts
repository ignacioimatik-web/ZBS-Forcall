import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting, MeetingType, Comment } from '../types';

interface UseMeetingsResult {
  meetings: Meeting[];
  isLoading: boolean;
  error: string | null;
  addMeeting: (meeting: Omit<Meeting, 'id'>) => Promise<Meeting | null>;
  updateMeeting: (meeting: Meeting) => Promise<boolean>;
  deleteMeeting: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useMeetings(): UseMeetingsResult {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('Error loading meetings:', fetchError);
        setError(fetchError.message);
        return;
      }

      const mapped: Meeting[] = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        type: row.type as MeetingType,
        date: new Date(row.date),
        time: row.time || undefined,
        speaker: row.speaker || undefined,
        location: row.location || undefined,
        description: row.description || undefined,
        isConfirmed: row.is_confirmed,
        presentationUrl: row.presentation_url || undefined,
        summary: row.summary || undefined,
        proposals: (row.proposals as Comment[]) || undefined,
        isCancelled: row.is_cancelled,
        cancellationReason: row.cancellation_reason || undefined
      }));

      setMeetings(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error loading meetings:', err);
      setError(err?.message || 'Error al cargar reuniones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const addMeeting = useCallback(async (meeting: Omit<Meeting, 'id'>): Promise<Meeting | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      const { data, error: insertError } = await supabase
        .from('meetings')
        .insert({
          title: meeting.title,
          type: meeting.type,
          description: meeting.description || null,
          date: meeting.date.toISOString(),
          time: meeting.time || null,
          location: meeting.location || null,
          speaker: meeting.speaker || null,
          author_user_id: userId || null,
          is_confirmed: meeting.isConfirmed,
          is_cancelled: meeting.isCancelled || false,
          cancellation_reason: meeting.cancellationReason || null,
          presentation_url: meeting.presentationUrl || null,
          summary: meeting.summary || null,
          proposals: (meeting.proposals as any) || []
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding meeting:', insertError);
        setError(insertError.message);
        return null;
      }

      const newMeeting: Meeting = {
        id: data.id,
        title: data.title,
        type: data.type as MeetingType,
        date: new Date(data.date),
        time: data.time || undefined,
        speaker: data.speaker || undefined,
        location: data.location || undefined,
        description: data.description || undefined,
        isConfirmed: data.is_confirmed,
        presentationUrl: data.presentation_url || undefined,
        summary: data.summary || undefined,
        proposals: (data.proposals as Comment[]) || undefined,
        isCancelled: data.is_cancelled,
        cancellationReason: data.cancellation_reason || undefined
      };

      setMeetings(prev => [...prev, newMeeting]);
      return newMeeting;
    } catch (err: any) {
      console.error('Unexpected error adding meeting:', err);
      setError(err?.message || 'Error al añadir reunión');
      return null;
    }
  }, []);

  const updateMeeting = useCallback(async (meeting: Meeting): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          title: meeting.title,
          type: meeting.type,
          description: meeting.description || null,
          date: meeting.date.toISOString(),
          time: meeting.time || null,
          location: meeting.location || null,
          speaker: meeting.speaker || null,
          is_confirmed: meeting.isConfirmed,
          is_cancelled: meeting.isCancelled || false,
          cancellation_reason: meeting.cancellationReason || null,
          presentation_url: meeting.presentationUrl || null,
          summary: meeting.summary || null,
          proposals: (meeting.proposals as any) || []
        })
        .eq('id', meeting.id);

      if (updateError) {
        console.error('Error updating meeting:', updateError);
        setError(updateError.message);
        return false;
      }

      setMeetings(prev => prev.map(m => m.id === meeting.id ? meeting : m));
      return true;
    } catch (err: any) {
      console.error('Unexpected error updating meeting:', err);
      setError(err?.message || 'Error al actualizar reunión');
      return false;
    }
  }, []);

  const deleteMeeting = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting meeting:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setMeetings(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err: any) {
      console.error('Unexpected error deleting meeting:', err);
      setError(err?.message || 'Error al eliminar reunión');
      return false;
    }
  }, []);

  return {
    meetings,
    isLoading,
    error,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    refresh: loadMeetings
  };
}
