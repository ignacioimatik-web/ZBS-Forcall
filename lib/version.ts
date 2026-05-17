export const VERSION = '2.4.0';
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
    version: '2.4.0',
    date: 'Mayo 2026',
    title: 'Dictado por voz, navegación por gestos en calendarios y persistencia de ajustes',
    changes: [
      'IAassist dividido en dos paneles: dictado por voz (izquierda) y PDF/OCR (derecha).',
      'Dictado por voz con tres modos seleccionables: Asignar, Borrar entradas y Notas.',
      'Las notas de voz se asignan al día concreto y aparecen en el calendario de planificación.',
      'Navegación entre meses con swipe táctil (iPad/tablet/móvil) y barras laterales en escritorio.',
      'Transición slide animada al cambiar de mes (40px, 300ms, cubic-bezier).',
      'Persistencia de configuración por usuario en metadata de Supabase Auth (esquema de color, efecto, intensidad).',
      'Chat ampliado de 450px a 600px de altura.',
      'Refactor de avisos: eliminada sección VOST/red social, estilo liquid glass en tarjetas.',
      'Selector de idioma en login con indicador animado y banderas (🇪🇸 + Senyera Coronada).',
    ],
  },
  {
    version: '2.3.0',
    date: 'Mayo 2026',
    title: 'Telegram, Mensajes, Turnos, Transcripciones multi-dispositivo',
    changes: [
      'Transcripciones de voz multi-dispositivo vía Supabase con botones separados start/stop y PDF nativo (jsPDF).',
      'Renombrado Alertas → Avisos en toda la interfaz (i18n, rutas, componentes).',
      'Renombrado Guardias → Turnos con subcategorías por rol (Médico/Enfermería).',
      'Eliminado sistema de detección de solapamientos/conflictos. Días con eventos muestran "Asignado".',
      'Renombrado Chat → Mensajes visualmente (manteniendo nomenclatura interna).',
      'Chat simplificado: solo canal de equipo, sin mensajes directos, ventana compacta (450px).',
      'Chat restringido a coordinadoras (Elena y Xelo).',
      'Sustituidos Morella por Todolella y Palanques en clima y avisos.',
      'Integración con Telegram: bot @ZBSforcabot, webhook, QR linking, reenvío bidireccional de mensajes.',
      'Reenvío de imágenes a Telegram vía sendPhoto API.',
      'Reenvío de audio a Telegram: OGG/Opus sendVoice (timeline) con fallback MP4 sendAudio (ventana inline) y enlace.',
      'Grabación de audio en OGG/Opus con fallback a MP4/WebM según soporte del navegador.',
      'Arreglo de build: variable "all" no declarada en validateDay, keys i18n incorrectas.',
    ],
  },
  {
    version: '2.0.0',
    date: 'Mayo 2026',
    title: 'Navegación rediseñada, página de ayuda y unificación visual',
    changes: [
      'Subcategorías de Guardias movidas a menú expandible en la barra lateral.',
      'Nueva página de Ayuda interactiva con guía asistida de la aplicación.',
      'Rediseño visual de la sección Dictado alineado con Unificado/Guardias.',
      'Rediseño visual de la sección Alertas alineado con Unificado/Guardias.',
      'Eliminado el indicador de versión del encabezado superior.',
      'Corrección de import faltante de useMemo en App.tsx.',
    ],
  },
  {
    version: '1.7.0',
    date: 'Mayo 2026',
    title: 'Panel lateral de detalle del día y rediseño del calendario',
    changes: [
      'Panel lateral de detalle del día con secciones agrupadas (guardia, libranza, dobla, vacación, reunión).',
      'Desplazamiento suave y auto-scroll al panel al seleccionar un día.',
      'Indicador visual de día seleccionado con anillo (ring-2) en el calendario.',
      'Rediseño del calendario: contenedor blanco tipo card, rejilla basada en bordes, chips de eventos más suaves.',
      'Componente ShiftBadge reutilizable para etiquetas de tipo (M/E/L/R/MT/VAC).',
      'Indicador +N de eventos adicionales en celdas del calendario.',
      'Layout responsive de dos columnas (calendario + panel) en desktop, apilado en móvil.',
      'Correcciones de selectores de idioma VA.',
    ],
  },
  {
    version: '1.6.0',
    date: 'Mayo 2026',
    title: 'Valencià, notas en calendario y mejoras de UI',
    changes: [
      'Traducción completa al valenciano con sistema i18n y selector de idioma.',
      'Selector de idioma ES/VA en pantalla de login.',
      'Notas diarias en libranzas/refuerzo al hacer clic en celda.',
      'Panel de notas para Xelo/Elena (edición) y resto (lectura).',
      'Eliminación de la sección Dietas.',
      'Renombrado "Historial de Permutas" a "Cambios de Guardia".',
      'Renombrado "Administrativos" a "Gestión Admin".',
      'Correcciones de errores y mejoras de estabilidad.',
    ],
  },
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