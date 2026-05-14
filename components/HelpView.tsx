import React, { useState } from 'react';

const sections = [
  {
    id: 'introduccion',
    icon: 'home',
    title: 'Bienvenido a ZBS Forcall',
    content: `
      ZBS Forcall es una aplicación de gestión de equipos médicos diseñada para organizar y visualizar
      guardias, libranzas, refuerzos y vacaciones del personal sanitario. La aplicación te permite
      coordinar turnos de manera eficiente, con herramientas de planificación, comunicación y dictado.
    `,
  },
  {
    id: 'navegacion',
    icon: 'navigation',
    title: 'Navegación por la aplicación',
    content: `
      En la barra lateral izquierda (azul oscuro) encontrarás las secciones principales:

      • Unificado — Vista general del equipo con métricas y resumen del día.
      • Turnos — Calendario detallado con subcategorías: Medicina, Enfermería, Libranzas, Refuerzo y Vacaciones.
      • Mensajes — comunicación con el equipo (vinculable con Telegram).
• Dictado — Herramienta de transcripción por voz.
       • Avisos — Centro de notificaciones y avisos del sistema.

      Para acceder a una sección, haz clic en su nombre en la barra lateral.
      En la sección Turnos, pulsa "Turnos" para desplegar las subcategorías y elige la que necesites.
    `,
  },
  {
    id: 'unificado',
    icon: 'dashboard',
    title: 'Vista Unificado (Dashboard)',
    content: `
      La pantalla de inicio te muestra un resumen completo del equipo:

      • Tarjetas de métricas — Total de profesionales, guardias asignadas, libranzas, refuerzos y vacaciones activas.
      • Resumen del día — Doctores y enfermeros de guardia hoy, reuniones programadas.
      • Accesos directos — Botones para ir directamente a crear guardias, libranzas, etc.

      Esta vista está diseñada para darte una foto rápida del estado del equipo.
    `,
  },
  {
    id: 'guardias',
    icon: 'calendar_month',
    title: 'Sección Turnos (Calendario)',
    content: `
      Es la sección principal de la aplicación. Aquí puedes:

      • Visualizar el calendario mensual con todas las guardias, libranzas, refuerzos y vacaciones.
      • Cambiar entre subcategorías (Medicina, Enfermería, Libranzas, Refuerzo, Vacaciones) desde el menú desplegable de la barra lateral.
      • Cada tipo de evento se muestra con un color distinto en el calendario.
      • Al hacer clic en un día, se abre un panel con los detalles de los turnos de ese día.
      • Puedes añadir, editar y eliminar eventos directamente desde el calendario.
      • La barra de herramientas superior te permite navegar entre meses y años.
      • También puedes exportar el calendario a PDF o imagen.
    `,
  },
  {
    id: 'eventos',
    icon: 'edit_note',
    title: 'Gestionar eventos (Añadir / Editar / Eliminar)',
    content: `
      Para añadir un nuevo evento:

      1. Asegúrate de estar en la subcategoría correcta (Medicina, Enfermería, etc.).
      2. Si ves el calendario mensual, busca el botón con el icono "+" en la barra de herramientas superior.
      3. Rellena los datos necesarios: profesional, fecha, tipo de evento.
      4. Confirma para guardar.

      Para editar o eliminar:
      • Haz clic sobre un evento existente en el calendario.
      • En el panel de detalles que se abre, verás opciones para modificar o eliminar el evento.
      • Al eliminar, se te pedirá confirmación antes de proceder.
    `,
  },
  {
    id: 'permutas',
    icon: 'swap_horiz',
    title: 'Permutas entre profesionales',
    content: `
      La aplicación permite intercambiar guardias entre profesionales:

      1. Activa el modo de permuta desde la barra de herramientas.
      2. Selecciona el primer turno (origen).
      3. Selecciona el segundo turno (destino).
      4. Confirma el intercambio.

      El sistema registrará la permuta en el historial y actualizará el calendario automáticamente.
      Puedes deshacer una permuta desde el panel de historial si es necesario.
    `,
  },
  {
id: 'chat',
     icon: 'forum',
     title: 'Mensajes del equipo',
    content: `
      La sección de Chat permite la comunicación entre los miembros del equipo.

      • Puedes enviar mensajes de texto a todo el equipo.
      • Los mensajes se muestran en orden cronológico.
      • Es útil para coordinar cambios de última hora o comunicar novedades.
    `,
  },
  {
    id: 'dictado',
    icon: 'mic',
    title: 'Dictado por voz',
    content: `
      La herramienta de Dictado convierte voz en texto:

      1. Pulsa el botón de grabación para empezar.
      2. Habla claramente — la aplicación transcribirá tu voz en tiempo real.
      3. Pulsa de nuevo para detener la grabación.
      4. El texto transcrito aparecerá en el área de texto, listo para copiar o usar.

      Esta herramienta es útil para tomar notas rápidas sin escribir.
    `,
  },
{
     id: 'avisos',
     icon: 'notifications',
     title: 'Avisos y notificaciones',
     content: `
       El centro de Avisos te mantiene informado de eventos importantes:

       • Cambios en la planificación de guardias.
       • Permutas realizadas por otros miembros del equipo.
       • Recordatorios de próximos eventos.

       Los avisos aparecen también como notificaciones temporales en la parte superior de la pantalla.
     `,
   },
  {
    id: 'faq',
    icon: 'help_outline',
    title: 'Preguntas frecuentes',
    content: `
      ¿Cómo cambio de mes en el calendario?
      Usa las flechas izquierda/derecha en la barra de herramientas superior del calendario.

      ¿Puedo ver todos los tipos de eventos a la vez?
      Sí, usa la vista "Unificado" desde la barra lateral para ver un resumen de todo.

      ¿Quién puede modificar los eventos?
      Los usuarios con permisos de administración pueden gestionar todos los eventos.
      Los profesionales solo pueden ver su información.

      ¿Cómo exporto el calendario?
      Usa el botón de exportación en la barra de herramientas del calendario.
      Puedes exportar como PDF o como imagen PNG.

      ¿Los cambios se guardan automáticamente?
      Sí, todas las modificaciones se persisten en la base de datos inmediatamente.
    `,
  },
];

export const HelpView: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>('introduccion');

  const toggle = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-forcall-100 text-forcall-700">
          <span className="material-symbols-outlined text-2xl">help</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ayuda</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guía interactiva de ZBS Forcall</p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map(section => {
          const isOpen = expanded === section.id;
          return (
            <div
              key={section.id}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
              >
                <span className="material-symbols-outlined text-xl text-forcall-600">
                  {section.icon}
                </span>
                <span className="flex-1 font-semibold text-gray-800 text-sm">
                  {section.title}
                </span>
                <span
                  className={`material-symbols-outlined text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.content.trim()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
