export const VERSION = '1.5.0';
export const VERSION_STRING = `Gestión Equipos v${VERSION}`;
export const VERSION_YEAR = '2026';

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: '1.5.0',
    date: 'Mayo 2026',
    title: 'Dietas / Kilometraje para hoja de dietas',
    changes: [
      'Planificación de rutas de visitas a domicilio por población.',
      'Cálculo de distancias reales por carretera vía OSRM.',
      'Clasificación de tramos computables / no computables para dietas.',
      'Persistencia del día en localStorage con historial de sesiones.',
      'Navegación entre días con calendario de fechas guardadas.',
    ],
  },
  {
    version: '1.4.0',
    date: 'Mayo 2026',
    title: 'Filtros de calendario por grupo de usuario y mejoras visuales',
    changes: [
      'Calendarios filtrados por grupo (médico/enfermería/ambos).',
      'Corrección de barras grises fantasma en celdas vacías del calendario.',
      'Estadística de vacaciones en el Dashboard.',
      'Corrección de teléfonos de los 13 ayuntamientos de Els Ports.',
      'Mejoras en AlertasView: eliminación de resumen operativo, rename a Nota de prensa.',
    ],
  },
  {
    version: '1.3.0',
    date: 'Mayo 2026',
    title: 'Sistema de chat interno con mensajería privada',
    changes: [
      'Chat en tiempo real con Supabase Realtime.',
      'Soporte de imágenes y audio en mensajes.',
      'Mensajería privada (DMs) con indicadores de no leídos.',
      'Eliminación de mensajes con limpieza de adjuntos.',
      'Compatibilidad iOS Safari (optimistic updates, uuidv4 fallback).',
      'Seguridad: autenticación vía triggers de base de datos.',
      'Ocultación de usuarios externos en lista de DMs.',
    ],
  },
  {
    version: '1.2.0',
    date: 'Mayo 2026',
    title: 'Permisos por rol, permutas de guardias y planificación',
    changes: [
      'Permisos de gestión por rol: administrador, coordinador, médico, enfermera.',
      'Permutas de guardias con historial de auditoría.',
      'Exportación iCal del calendario personal.',
      'Notificaciones push para guardias, libranzas y refuerzos (24h antes).',
      'Gestión de vacaciones por coordinadores.',
      'Cierre de sesión automático por inactividad (1 hora).',
      'Etiquetas de tipo (M/E/L/R/MT) en calendario y PDF.',
      'Seguridad: eliminación de API keys del frontend, SRI hashes en CDNs.',
    ],
  },
  {
    version: '1.1.0',
    date: 'Marzo–Mayo 2026',
    title: 'Calendario, clima y alertas',
    changes: [
      'Código de colores por tipo: medicina azul, enfermería rojo.',
      'Exportación PDF unificada del calendario en A4.',
      'Datos meteorológicos reales vía Open-Meteo API.',
      'Alertas oficiales de Protección Civil (112 Comunitat Valenciana).',
      'Diseño de alertas tipo periódico con mapa de preemergencias.',
      'Transcripción por voz (Web Speech API).',
      'Indicador visual de carga de datos.',
    ],
  },
  {
    version: '1.0.0',
    date: 'Febrero 2026',
    title: 'Versión inicial',
    changes: [
      'Gestión básica de guardias médicas y de enfermería.',
      'Autenticación mediante PIN local.',
      'Integración con Supabase (PostgreSQL, Auth, RLS).',
      'Calendario unificado con vista mensual.',
      'Gestión de libranzas, refuerzos y reuniones.',
      'Dashboard con resumen de indicadores.',
      'Migración a autenticación real con Supabase Auth.',
    ],
  },
];
