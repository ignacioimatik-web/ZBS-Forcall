import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Guardia, Libranza, Dobla } from '../types';
import { useT } from '../lib/i18n';

interface UseRemindersResult {
  scheduleReminder: (title: string, body: string, date: Date) => void;
  requestPermission: () => Promise<boolean>;
}

export function useReminders(userName?: string): UseRemindersResult {
  const { t } = useT();
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const scheduleReminder = useCallback((title: string, body: string, date: Date) => {
    const now = new Date();
    const delay = date.getTime() - now.getTime();
    
    if (delay <= 0) return; // Ya pasó
    
    const key = `${title}-${date.getTime()}`;
    if (timersRef.current[key]) return; // Ya programado
    
    timersRef.current[key] = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          tag: key,
          requireInteraction: true
        });
      }
      delete timersRef.current[key];
    }, delay);
  }, []);

  // Cargar guardias y programar recordatorios al iniciar
  useEffect(() => {
    if (!userName) return; // No programar si no hay usuario
    
    const loadAndSchedule = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      try {
        // Cargar guardias de los próximos 7 días filtradas por el usuario
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const { data: guardias } = await supabase
          .from('guardias')
          .select('*')
          .eq('personnel_name', userName)
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0]);

        const { data: libranzas } = await supabase
          .from('libranzas')
          .select('*')
          .eq('personnel_name', userName)
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0]);

        const { data: doblas } = await supabase
          .from('doblas')
          .select('*')
          .eq('personnel_name', userName)
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0]);

        // Programar recordatorios (1 día antes a las 20:00)
        const scheduleForType = (items: any[], typeKey: string) => {
          items?.forEach((item: any) => {
            const eventDate = new Date(item.date);
            const reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - 1);
            reminderDate.setHours(20, 0, 0, 0);
            
            const typeLabel = t(`reminders.${typeKey}`);
            scheduleReminder(
              `${t('reminders.reminder')} ${typeLabel}`,
              `${t('reminders.your')} ${typeLabel.toLowerCase()} ${t('reminders.isOn')} ${eventDate.toLocaleDateString('es-ES')}`,
              reminderDate
            );
          });
        };

        scheduleForType(guardias || [], (guardias || []).some((g: any) => g.type === 'medica') ? 'guardiaMedica' : 'guardiaEnfermeria');
        scheduleForType(libranzas || [], (libranzas || []).some((l: any) => l.type === 'medica') ? 'libranzaMedica' : 'libranzaEnfermeria');
        scheduleForType(doblas || [], (doblas || []).some((d: any) => d.type === 'medica') ? 'doblaMedica' : 'doblaEnfermeria');
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    };

    loadAndSchedule();

    return () => {
      // Limpiar todos los timers al desmontar
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, [requestPermission, scheduleReminder]);

  return {
    scheduleReminder,
    requestPermission
  };
}
