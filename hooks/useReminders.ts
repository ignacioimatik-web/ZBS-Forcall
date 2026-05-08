import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Guardia, Libranza, Dobla } from '../types';

interface UseRemindersResult {
  scheduleReminder: (title: string, body: string, date: Date) => void;
  requestPermission: () => Promise<boolean>;
}

export function useReminders(): UseRemindersResult {
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
          icon: '/icon-192x192.png', // Asegúrate de tener este icono
          tag: key,
          requireInteraction: true
        });
      }
      delete timersRef.current[key];
    }, delay);
  }, []);

  // Cargar guardias y programar recordatorios al iniciar
  useEffect(() => {
    const loadAndSchedule = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      try {
        // Cargar guardias de los próximos 7 días
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const { data: guardias } = await supabase
          .from('guardias')
          .select('*')
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0]);

        const { data: libranzas } = await supabase
          .from('libranzas')
          .select('*')
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0]);

        const { data: doblas } = await supabase
          .from('doblas')
          .select('*')
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0]);

        // Programar recordatorios (1 día antes a las 20:00)
        const scheduleForType = (items: any[], type: string) => {
          items?.forEach((item: any) => {
            const eventDate = new Date(item.date);
            const reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - 1);
            reminderDate.setHours(20, 0, 0, 0);
            
            scheduleReminder(
              `Recordatorio: ${type}`,
              `${type} de ${item.personnel_name} el ${eventDate.toLocaleDateString('es-ES')}`,
              reminderDate
            );
          });
        };

        scheduleForType(guardias || [], item.type === 'medica' ? 'Guardia Médica' : 'Guardia Enfermería');
        scheduleForType(libranzas || [], item.type === 'medica' ? 'Libranza Médica' : 'Libranza Enfermería');
        scheduleForType(doblas || [], item.type === 'medica' ? 'Dobla Médica' : 'Dobla Enfermería');
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
