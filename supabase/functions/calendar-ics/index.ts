// Supabase Edge Function: calendar-ics
// Genera un archivo .ics con las guardias, libranzas y doblas del usuario autenticado

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    // Obtener usuario autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('No autorizado', { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('No autorizado', { status: 401 });
    }

    // Obtener perfil para el nombre
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || profile?.email || 'Usuario';

    // Obtener guardias, libranzas y doblas del usuario
    const { data: guardias } = await supabase
      .from('guardias')
      .select('*')
      .eq('personnel_name', userName);

    const { data: libranzas } = await supabase
      .from('libranzas')
      .select('*')
      .eq('personnel_name', userName);

    const { data: doblas } = await supabase
      .from('doblas')
      .select('*')
      .eq('personnel_name', userName);

    // Generar ICS
    const formatDate = (date: string | Date) => {
      const d = new Date(date);
      return d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1) + 'Z';
    };

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ZBS Forcall//ES\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';

    const addEvent = (summary: string, start: string, type: string) => {
      const uid = `${summary}-${start}@zbsforcall`;
      const dtstart = formatDate(start);
      const dtend = formatDate(new Date(new Date(start).getTime() + 3600000)); // +1 hora
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTART:${dtstart}\r\n`;
      ics += `DTEND:${dtend}\r\n`;
      ics += `SUMMARY:${summary}\r\n`;
      ics += `DESCRIPTION:${type} - ZBS Forcall\r\n`;
      ics += 'END:VEVENT\r\n';
    };

    guardias?.forEach((g: any) => {
      const type = g.type === 'medica' ? 'Guardia Medica' : 'Guardia Enfermeria';
      addEvent(`${type}: ${g.personnel_name}`, g.date, type);
    });

    libranzas?.forEach((l: any) => {
      const type = l.type === 'medica' ? 'Libranza Medica' : 'Libranza Enfermeria';
      addEvent(`${type}: ${l.personnel_name}`, l.date, type);
    });

    doblas?.forEach((d: any) => {
      const type = d.type === 'medica' ? 'Dobla Medica' : 'Dobla Enfermeria';
      addEvent(`${type}: ${d.personnel_name}`, d.date, type);
    });

    ics += 'END:VCALENDAR';

    return new Response(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="guardias-${userName}.ics"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('Error interno', { status: 500 });
  }
});
