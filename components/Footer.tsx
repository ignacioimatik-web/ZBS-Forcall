import React from 'react';
import { jsPDF } from 'jspdf';

function generatePrivacyPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const bodyW = pageW - margin * 2;
  let y = margin;

  const title = (text: string) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 8;
  };
  const heading = (text: string) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 6;
  };
  const body = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, bodyW);
    lines.forEach((l: string) => {
      if (y > 285) { doc.addPage(); y = margin; }
      doc.text(l, margin, y);
      y += 4.5;
    });
    y += 2;
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Política de Privacidad', margin, y);
  y += 12;

  heading('1. Identificación del responsable del tratamiento');
  body('ZBS Gestión de Equipos, con domicilio en Zona Básica de Salud de Forcall, Castellón, es el responsable del tratamiento de los datos personales recabados a través de esta aplicación.');

  heading('2. Marco normativo');
  body('Esta política de privacidad se rige por la normativa vigente en materia de protección de datos, en particular:\n\n- Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos (RGPD).\n- Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).\n- Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica.');

  heading('3. Finalidad del tratamiento');
  body('Los datos personales recabados a través de esta aplicación se tratan con las siguientes finalidades:\n- Gestión de guardias médicas y de enfermería del equipo sanitario de la ZBS Forcall.\n- Gestión de libranzas, refuerzos y vacaciones del personal.\n- Comunicación interna entre los miembros del equipo sanitario.\n- Gestión de alertas y emergencias sanitarias.\n- Registro de actividad (auditoría) para garantizar la trazabilidad de los cambios.');

  heading('4. Base jurídica del tratamiento');
  body('La base jurídica para el tratamiento de los datos es:\n- La ejecución de una misión realizada en interés público o en el ejercicio de poderes públicos conferidos al responsable del tratamiento (art. 6.1.e RGPD).\n- El cumplimiento de una obligación legal aplicable al responsable del tratamiento (art. 6.1.c RGPD).\n- El consentimiento explícito del usuario (art. 6.1.a RGPD) para funcionalidades específicas.');

  heading('5. Categorías de datos tratados');
  body('Se tratan las siguientes categorías de datos personales:\n- Datos identificativos: nombre, apellidos, correo electrónico.\n- Datos profesionales: categoría profesional, rol, grupo de trabajo.\n- Datos de actividad: registro de acceso, modificaciones realizadas en el sistema.\n- Datos de contacto: teléfono profesional.\n\nNo se tratan categorías especiales de datos (salud, datos biométricos, etc.) más allá de la información profesional sanitaria inherente a la función del usuario.');

  heading('6. Destinatarios de cesiones');
  body('Los datos no serán cedidos a terceros salvo obligación legal. No está prevista la transferencia internacional de datos fuera del Espacio Económico Europeo.');

  heading('7. Plazo de conservación');
  body('Los datos se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se recaban y, en todo caso, durante los plazos establecidos por la normativa aplicable en materia de documentación sanitaria y administrativa. Una vez finalizada la relación, se procederá a la supresión de los datos conforme a la política de conservación establecida.');

  heading('8. Derechos del interesado');
  body('El usuario tiene derecho a:\n- Acceder a sus datos personales.\n- Rectificar los datos inexactos.\n- Solicitar la supresión de sus datos.\n- Solicitar la limitación del tratamiento.\n- Oponerse al tratamiento.\n- Solicitar la portabilidad de sus datos.\n- No ser objeto de decisiones individuales automatizadas.\n\nPara ejercer estos derechos, el usuario puede dirigirse al responsable del tratamiento a través del correo electrónico: ignacio@digitalcode.es.');

  heading('9. Medidas de seguridad');
  body('Se han implementado las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado, de acuerdo con el estado de la técnica, los costes de implementación y la naturaleza, el alcance, el contexto y los fines del tratamiento.');

  heading('10. Modificaciones');
  body('Esta política de privacidad puede ser actualizada periódicamente. Se recomienda al usuario revisarla cada cierto tiempo. El uso continuado de la aplicación tras la publicación de cambios constituye la aceptación de dichos cambios.');

  doc.save('Politica_Privacidad_ZBS_Gestion_Equipos.pdf');
}

function generateTermsPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const bodyW = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const title = (text: string) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 8;
  };
  const heading = (text: string) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 6;
  };
  const body = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, bodyW);
    lines.forEach((l: string) => {
      if (y > 285) { doc.addPage(); y = margin; }
      doc.text(l, margin, y);
      y += 4.5;
    });
    y += 2;
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos de Uso', margin, y);
  y += 12;

  heading('1. Aceptación de los términos');
  body('El uso de esta aplicación (ZBS Gestión de Equipos) atribuye la condición de usuario e implica la aceptación plena y sin reservas de todos y cada uno de los términos y condiciones incluidos en este documento. Si el usuario no acepta la totalidad de los presentes términos, deberá abstenerse de utilizar la aplicación.');

  heading('2. Descripción del servicio');
  body('ZBS Gestión de Equipos es una aplicación web diseñada para la gestión interna del equipo sanitario de la Zona Básica de Salud de Forcall. Sus funcionalidades incluyen:\n- Gestión de guardias médicas y de enfermería.\n- Gestión de libranzas, refuerzos y vacaciones.\n- Sistema de mensajería y comunicación interna.\n- Calendario compartido de reuniones y eventos.\n- Sistema de alertas y avisos.\n- Herramientas de transcripción y dictado.\n- Visualización de alertas meteorológicas y de protección civil.');

  heading('3. Acceso y uso');
  body('El acceso a la aplicación está restringido al personal sanitario y administrativo autorizado de la ZBS Forcall. Cada usuario dispondrá de credenciales de acceso personales e intransferibles. El usuario se compromete a:\n- Mantener la confidencialidad de sus credenciales de acceso.\n- No compartir su cuenta con terceros.\n- Notificar inmediatamente cualquier uso no autorizado de su cuenta.\n- Hacer un uso adecuado y responsable de la aplicación.');

  heading('4. Responsabilidad del usuario');
  body('El usuario es responsable de:\n- La veracidad y exactitud de los datos introducidos.\n- El uso adecuado de las funcionalidades de la aplicación.\n- Cumplir con la normativa sanitaria y de protección de datos aplicable.\n- No realizar modificaciones no autorizadas en la configuración del sistema.\n- No introducir contenido ilegal, ofensivo o que pueda dañar el sistema.');

  heading('5. Propiedad intelectual');
  body('Todos los derechos de propiedad intelectual sobre la aplicación, su diseño, código fuente, logotipos y contenido son propiedad de los desarrolladores de la aplicación. Queda prohibida la reproducción, distribución, modificación o explotación no autorizada de la aplicación o cualquiera de sus componentes.');

  heading('6. Limitación de responsabilidad');
  body('La aplicación se proporciona "tal cual", sin garantías de ningún tipo, expresas o implícitas. Los desarrolladores no serán responsables de:\n- Daños directos o indirectos derivados del uso de la aplicación.\n- Pérdida de datos o interrupción del servicio.\n- Decisiones clínicas basadas en la información contenida en la aplicación.\n- La disponibilidad o continuidad del servicio.\n\nLa información farmacológica y las calculadoras incluidas en la aplicación tienen carácter meramente orientativo y no sustituyen el criterio clínico del profesional sanitario ni las fichas técnicas oficiales de los medicamentos.');

  heading('7. Modificaciones');
  body('Los desarrolladores se reservan el derecho de modificar los presentes términos de uso en cualquier momento, notificando los cambios a los usuarios a través de la propia aplicación o mediante correo electrónico.');

  heading('8. Legislación aplicable');
  body('Los presentes términos se rigen por la legislación española. Para cualquier controversia que pudiera derivarse del uso de la aplicación, las partes se someten a los juzgados y tribunales de la provincia de Castellón, renunciando a cualquier otro fuero que pudiera corresponderles.');

  heading('9. Contacto');
  body('Para cualquier consulta relacionada con estos términos de uso, el usuario puede contactar a través del correo electrónico: ignacio@digitalcode.es');

  doc.save('Terminos_Uso_ZBS_Gestion_Equipos.pdf');
}

function generateVersionesPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const bodyW = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const title = (text: string) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 9;
  };
  const subtitle = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(text, margin, y);
    y += 5;
    doc.setTextColor(0);
  };
  const version = (ver: string, date: string, desc: string) => {
    if (y > 260) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(ver, margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(date, margin + 50, y);
    doc.setTextColor(0);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(desc, bodyW);
    lines.forEach((l: string) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(l, margin + 3, y);
      y += 4.2;
    });
    y += 4;
  };

  title('Historial de Versiones');
  subtitle('ZBS Gestión de Equipos — Documento de versionado semántico');
  y += 2;

  version(
    'v1.5.0',
    'Mayo 2026',
    'Dietas / Kilometraje para hoja de dietas.\n' +
    '• Planificación de rutas de visitas a domicilio por población.\n' +
    '• Cálculo de distancias reales por carretera vía OSRM.\n' +
    '• Clasificación de tramos computables / no computables para dietas.\n' +
    '• Persistencia del día en localStorage con historial de sesiones.\n' +
    '• Navegación entre días con calendario de fechas guardadas.'
  );
  version(
    'v1.4.0',
    'Mayo 2026',
    'Filtros de calendario por grupo de usuario y mejoras visuales.\n' +
    '• Calendarios filtrados por grupo (médico/enfermería/ambos).\n' +
    '• Corrección de barras grises fantasma en celdas vacías del calendario.\n' +
    '• Estadística de vacaciones en el Dashboard.\n' +
    '• Corrección de teléfonos de los 13 ayuntamientos de Els Ports.\n' +
    '• Mejoras en AlertasView: eliminación de resumen operativo, rename a Nota de prensa.'
  );
  version(
    'v1.3.0',
    'Mayo 2026',
    'Sistema de chat interno con mensajería privada.\n' +
    '• Chat en tiempo real con Supabase Realtime.\n' +
    '• Soporte de imágenes y audio en mensajes.\n' +
    '• Mensajería privada (DMs) con indicadores de no leídos.\n' +
    '• Eliminación de mensajes con limpieza de adjuntos.\n' +
    '• Compatibilidad iOS Safari (optimistic updates, uuidv4 fallback).\n' +
    '• Seguridad: autenticación vía triggers de base de datos (sender_id = auth.uid()).\n' +
    '• Ocultación de usuarios externos en lista de DMs.'
  );
  version(
    'v1.2.0',
    'Mayo 2026',
    'Permisos por rol, permutas de guardias y planificación.\n' +
    '• Permisos de gestión por rol: administrador, coordinador, médico, enfermera.\n' +
    '• Permutas de guardias con historial de auditoría.\n' +
    '• Exportación iCal del calendario personal.\n' +
    '• Notificaciones push para guardias, libranzas y refuerzos (24h antes).\n' +
    '• Gestión de vacaciones por coordinadores.\n' +
    '• Cierre de sesión automático por inactividad (1 hora).\n' +
    '• Etiquetas de tipo (M/E/L/R/MT) en calendario y PDF.\n' +
    '• Seguridad: eliminación de API keys del frontend, SRI hashes en CDNs.'
  );
  version(
    'v1.1.0',
    'Marzo–Mayo 2026',
    'Calendario, clima y alertas.\n' +
    '• Código de colores por tipo: medicina azul, enfermería rojo.\n' +
    '• Exportación PDF unificada del calendario en A4.\n' +
    '• Datos meteorológicos reales vía Open-Meteo API.\n' +
    '• Alertas oficiales de Protección Civil (112 Comunitat Valenciana).\n' +
    '• Diseño de alertas tipo periódico con mapa de preemergencias.\n' +
    '• Transcripción por voz (Web Speech API).\n' +
    '• Indicador visual de carga de datos.'
  );
  version(
    'v1.0.0',
    'Febrero 2026',
    'Versión inicial desarrollada con Vercent.\n' +
    '• Gestión básica de guardias médicas y de enfermería.\n' +
    '• Autenticación mediante PIN local.\n' +
    '• Integración con Supabase (PostgreSQL, Auth, RLS).\n' +
    '• Calendario unificado con vista mensual.\n' +
    '• Gestión de libranzas, refuerzos y reuniones.\n' +
    '• Dashboard con resumen de indicadores.\n' +
    '• Migración a autenticación real con Supabase Auth.'
  );

  doc.save('Versiones_ZBS_Gestion_Equipos.pdf');
}

export const Footer: React.FC = () => (
  <footer className="border-t border-gray-200 mt-12 py-6">
    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-bold text-gray-500">
      <span>© 2026 ZBS Gestión de Equipos. Todos los derechos reservados.</span>
      <div className="flex items-center gap-3">
        <button onClick={generateVersionesPDF} className="hover:text-gray-800 transition-colors underline underline-offset-2">Versiones</button>
        <span className="text-gray-300">·</span>
        <button onClick={generatePrivacyPDF} className="hover:text-gray-800 transition-colors underline underline-offset-2">Privacidad</button>
        <span className="text-gray-300">·</span>
        <button onClick={generateTermsPDF} className="hover:text-gray-800 transition-colors underline underline-offset-2">Términos</button>
        <span className="text-gray-300">·</span>
        <a href="mailto:ignacio@digitalcode.es" className="hover:text-gray-800 transition-colors underline underline-offset-2">Contacto</a>
      </div>
    </div>
  </footer>
);
