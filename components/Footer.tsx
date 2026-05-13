import React from 'react';
import { jsPDF } from 'jspdf';
import { VERSION_STRING, CHANGELOG } from '../lib/version';

type RGB = [number, number, number];

const RED: RGB = [139, 0, 0];
const DARK: RGB = [51, 51, 51];
const GRAY: RGB = [140, 140, 140];
const LIGHT_GRAY: RGB = [220, 220, 220];
const MARGIN = 22;
const FOOTER_Y = 288;

interface Ctx {
  doc: jsPDF;
  pw: number;
  y: number;
  pageNum: number;
}

function startPage(ctx: Ctx, title: string): Ctx {
  const doc = ctx.doc;
  const pw = ctx.pw;
  const pageNum = ctx.pageNum + 1;

  const topY = 16;

  doc.setFillColor(...RED);
  doc.rect(MARGIN, topY - 2, pw - MARGIN * 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...RED);
  doc.text('ZBS Gestión de Equipos', MARGIN, topY + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(today, MARGIN, topY + 13);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(title, MARGIN, topY + 26);

  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(MARGIN, topY + 30, pw - MARGIN, topY + 30);

  return { ...ctx, pageNum, y: topY + 37 };
}

function endPage(ctx: Ctx, docName: string) {
  const doc = ctx.doc;
  const pw = ctx.pw;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(MARGIN, FOOTER_Y, pw - MARGIN, FOOTER_Y);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(docName, MARGIN, FOOTER_Y + 5);
  doc.text(`${ctx.pageNum}`, pw - MARGIN, FOOTER_Y + 5, { align: 'right' });
}

function ensureSpace(ctx: Ctx, needed: number, title: string, docName: string): Ctx {
  if (ctx.y + needed > FOOTER_Y) {
    endPage(ctx, docName);
    ctx.doc.addPage();
    return startPage(ctx, title);
  }
  return ctx;
}

function section(ctx: Ctx, num: string, heading: string, bodyText: string, title: string, docName: string): Ctx {
  let c = ensureSpace(ctx, 16, title, docName);

  // Accent bar
  c.doc.setFillColor(...RED);
  c.doc.rect(MARGIN, c.y, 3, 12, 'F');

  c.doc.setFontSize(11);
  c.doc.setFont('helvetica', 'bold');
  c.doc.setTextColor(...DARK);
  c.doc.text(`${num}  ${heading}`, MARGIN + 7, c.y + 4);
  c.y += 10;

  c.doc.setFontSize(8.5);
  c.doc.setFont('helvetica', 'normal');
  c.doc.setTextColor(...DARK);

  const lines = c.doc.splitTextToSize(bodyText, c.pw - MARGIN * 2 - 14);
  for (const l of lines) {
    c = ensureSpace(c, 5, title, docName);
    c.doc.text(l, MARGIN + 14, c.y);
    c.y += 4.2;
  }
  c.y += 3.5;
  return c;
}

function generatePrivacyPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const docName = 'Política de Privacidad';
  let ctx: Ctx = { doc, pw, y: 0, pageNum: 0 };
  ctx = startPage(ctx, 'Política de Privacidad');

  ctx = section(ctx, '1.', 'Identificación del responsable del tratamiento',
    'ZBS Gestión de Equipos, con domicilio en Zona Básica de Salud de Forcall, Castellón, es el responsable del tratamiento de los datos personales recabados a través de esta aplicación.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '2.', 'Marco normativo',
    'Esta política de privacidad se rige por la normativa vigente en materia de protección de datos, en particular:\n\n' +
    'Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos (RGPD).\n' +
    'Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).\n' +
    'Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '3.', 'Finalidad del tratamiento',
    'Los datos personales recabados a través de esta aplicación se tratan con las siguientes finalidades:\n\n' +
    '• Gestión de guardias médicas y de enfermería del equipo sanitario de la ZBS Forcall.\n' +
    '• Gestión de libranzas, refuerzos y vacaciones del personal.\n' +
    '• Comunicación interna entre los miembros del equipo sanitario.\n' +
    '• Gestión de alertas y emergencias sanitarias.\n' +
    '• Registro de actividad (auditoría) para garantizar la trazabilidad de los cambios.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '4.', 'Base jurídica del tratamiento',
    'La base jurídica para el tratamiento de los datos es:\n\n' +
    '• La ejecución de una misión realizada en interés público o en el ejercicio de poderes públicos conferidos al responsable del tratamiento (art. 6.1.e RGPD).\n' +
    '• El cumplimiento de una obligación legal aplicable al responsable del tratamiento (art. 6.1.c RGPD).\n' +
    '• El consentimiento explícito del usuario (art. 6.1.a RGPD) para funcionalidades específicas.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '5.', 'Categorías de datos tratados',
    'Se tratan las siguientes categorías de datos personales:\n\n' +
    '• Datos identificativos: nombre, apellidos, correo electrónico.\n' +
    '• Datos profesionales: categoría profesional, rol, grupo de trabajo.\n' +
    '• Datos de actividad: registro de acceso, modificaciones realizadas en el sistema.\n' +
    '• Datos de contacto: teléfono profesional.\n\n' +
    'No se tratan categorías especiales de datos (salud, datos biométricos, etc.) más allá de la información profesional sanitaria inherente a la función del usuario.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '6.', 'Destinatarios de cesiones',
    'Los datos no serán cedidos a terceros salvo obligación legal. No está prevista la transferencia internacional de datos fuera del Espacio Económico Europeo.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '7.', 'Plazo de conservación',
    'Los datos se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se recaban y, en todo caso, durante los plazos establecidos por la normativa aplicable en materia de documentación sanitaria y administrativa. Una vez finalizada la relación, se procederá a la supresión de los datos conforme a la política de conservación establecida.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '8.', 'Derechos del interesado',
    'El usuario tiene derecho a:\n\n' +
    '• Acceder a sus datos personales.\n' +
    '• Rectificar los datos inexactos.\n' +
    '• Solicitar la supresión de sus datos.\n' +
    '• Solicitar la limitación del tratamiento.\n' +
    '• Oponerse al tratamiento.\n' +
    '• Solicitar la portabilidad de sus datos.\n' +
    '• No ser objeto de decisiones individuales automatizadas.\n\n' +
    'Para ejercer estos derechos, el usuario puede dirigirse al responsable del tratamiento a través del correo electrónico: ignacio@digitalcode.es.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '9.', 'Medidas de seguridad',
    'Se han implementado las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado, de acuerdo con el estado de la técnica, los costes de implementación y la naturaleza, el alcance, el contexto y los fines del tratamiento.',
    'Política de Privacidad', docName);

  ctx = section(ctx, '10.', 'Modificaciones',
    'Esta política de privacidad puede ser actualizada periódicamente. Se recomienda al usuario revisarla cada cierto tiempo. El uso continuado de la aplicación tras la publicación de cambios constituye la aceptación de dichos cambios.',
    'Política de Privacidad', docName);

  endPage(ctx, docName);
  doc.save('Politica_Privacidad_ZBS_Gestion_Equipos.pdf');
}

function generateTermsPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const docName = 'Términos de Uso';
  let ctx: Ctx = { doc, pw, y: 0, pageNum: 0 };
  ctx = startPage(ctx, 'Términos de Uso');

  ctx = section(ctx, '1.', 'Aceptación de los términos',
    'El uso de esta aplicación (ZBS Gestión de Equipos) atribuye la condición de usuario e implica la aceptación plena y sin reservas de todos y cada uno de los términos y condiciones incluidos en este documento. Si el usuario no acepta la totalidad de los presentes términos, deberá abstenerse de utilizar la aplicación.',
    'Términos de Uso', docName);

  ctx = section(ctx, '2.', 'Descripción del servicio',
    'ZBS Gestión de Equipos es una aplicación web diseñada para la gestión interna del equipo sanitario de la Zona Básica de Salud de Forcall. Sus funcionalidades incluyen:\n\n' +
    '• Gestión de guardias médicas y de enfermería.\n' +
    '• Gestión de libranzas, refuerzos y vacaciones.\n' +
    '• Sistema de mensajería y comunicación interna.\n' +
    '• Calendario compartido de reuniones y eventos.\n' +
    '• Sistema de alertas y avisos.\n' +
    '• Herramientas de transcripción y dictado.\n' +
    '• Visualización de alertas meteorológicas y de protección civil.',
    'Términos de Uso', docName);

  ctx = section(ctx, '3.', 'Acceso y uso',
    'El acceso a la aplicación está restringido al personal sanitario y administrativo autorizado de la ZBS Forcall. Cada usuario dispondrá de credenciales de acceso personales e intransferibles. El usuario se compromete a:\n\n' +
    '• Mantener la confidencialidad de sus credenciales de acceso.\n' +
    '• No compartir su cuenta con terceros.\n' +
    '• Notificar inmediatamente cualquier uso no autorizado de su cuenta.\n' +
    '• Hacer un uso adecuado y responsable de la aplicación.',
    'Términos de Uso', docName);

  ctx = section(ctx, '4.', 'Responsabilidad del usuario',
    'El usuario es responsable de:\n\n' +
    '• La veracidad y exactitud de los datos introducidos.\n' +
    '• El uso adecuado de las funcionalidades de la aplicación.\n' +
    '• Cumplir con la normativa sanitaria y de protección de datos aplicable.\n' +
    '• No realizar modificaciones no autorizadas en la configuración del sistema.\n' +
    '• No introducir contenido ilegal, ofensivo o que pueda dañar el sistema.',
    'Términos de Uso', docName);

  ctx = section(ctx, '5.', 'Propiedad intelectual',
    'Todos los derechos de propiedad intelectual sobre la aplicación, su diseño, código fuente, logotipos y contenido son propiedad de los desarrolladores de la aplicación. Queda prohibida la reproducción, distribución, modificación o explotación no autorizada de la aplicación o cualquiera de sus componentes.',
    'Términos de Uso', docName);

  ctx = section(ctx, '6.', 'Limitación de responsabilidad',
    'La aplicación se proporciona "tal cual", sin garantías de ningún tipo, expresas o implícitas. Los desarrolladores no serán responsables de:\n\n' +
    '• Daños directos o indirectos derivados del uso de la aplicación.\n' +
    '• Pérdida de datos o interrupción del servicio.\n' +
    '• Decisiones clínicas basadas en la información contenida en la aplicación.\n' +
    '• La disponibilidad o continuidad del servicio.\n\n' +
    'La información farmacológica y las calculadoras incluidas en la aplicación tienen carácter meramente orientativo y no sustituyen el criterio clínico del profesional sanitario ni las fichas técnicas oficiales de los medicamentos.',
    'Términos de Uso', docName);

  ctx = section(ctx, '7.', 'Modificaciones',
    'Los desarrolladores se reservan el derecho de modificar los presentes términos de uso en cualquier momento, notificando los cambios a los usuarios a través de la propia aplicación o mediante correo electrónico.',
    'Términos de Uso', docName);

  ctx = section(ctx, '8.', 'Legislación aplicable',
    'Los presentes términos se rigen por la legislación española. Para cualquier controversia que pudiera derivarse del uso de la aplicación, las partes se someten a los juzgados y tribunales de la provincia de Castellón, renunciando a cualquier otro fuero que pudiera corresponderles.',
    'Términos de Uso', docName);

  ctx = section(ctx, '9.', 'Contacto',
    'Para cualquier consulta relacionada con estos términos de uso, el usuario puede contactar a través del correo electrónico: ignacio@digitalcode.es',
    'Términos de Uso', docName);

  endPage(ctx, docName);
  doc.save('Terminos_Uso_ZBS_Gestion_Equipos.pdf');
}

function generateVersionesPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const docName = 'Historial de Versiones';
  let ctx: Ctx = { doc, pw, y: 0, pageNum: 0 };
  ctx = startPage(ctx, 'Historial de Versiones');

  // Subtitle
  ctx.doc.setFontSize(8);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setTextColor(...GRAY);
  ctx.doc.text(`${VERSION_STRING} — Documento de versionado semántico`, MARGIN, ctx.y);
  ctx.y += 7;

  for (const entry of CHANGELOG) {
    const entryNeeded = 14 + entry.changes.length * 4;
    ctx = ensureSpace(ctx, entryNeeded, 'Historial de Versiones', docName);

    ctx.doc.setFillColor(...RED);
    ctx.doc.circle(MARGIN + 1.5, ctx.y + 2, 1.5, 'F');

    ctx.doc.setFontSize(12);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(...DARK);
    ctx.doc.text(`v${entry.version}`, MARGIN + 5, ctx.y + 3);

    ctx.doc.setFontSize(7.5);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(...GRAY);
    ctx.doc.text(entry.date, MARGIN + 32, ctx.y + 3);
    ctx.y += 6;

    ctx.doc.setFontSize(9);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(...RED);
    ctx.doc.text(entry.title, MARGIN + 5, ctx.y);
    ctx.y += 4.5;

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(...DARK);
    for (const change of entry.changes) {
      ctx = ensureSpace(ctx, 5, 'Historial de Versiones', docName);
      ctx.doc.text(`• ${change}`, MARGIN + 8, ctx.y);
      ctx.y += 4;
    }
    ctx.y += 3;
  }

  endPage(ctx, docName);
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
