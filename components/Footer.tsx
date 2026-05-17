import React from 'react';
import { jsPDF } from 'jspdf';
import { VERSION_STRING, CHANGELOG } from '../lib/version';
import { useT } from '../lib/i18n';

type RGB = [number, number, number];

const RED: RGB = [139, 0, 0];
const DARK: RGB = [51, 51, 51];
const GRAY: RGB = [140, 140, 140];
const LIGHT_GRAY: RGB = [210, 210, 210];

const MM = 25;
const PW = 210;
const CONTENT = PW - MM * 2;
const FOOTER_Y = 272;

interface Ctx {
  doc: jsPDF;
  y: number;
  pageNum: number;
}

function startPage(ctx: Ctx, title: string): Ctx {
  const doc = ctx.doc;
  const pageNum = ctx.pageNum + 1;

  doc.setFillColor(...RED);
  doc.rect(MM, 14, CONTENT, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...RED);
  doc.text('ZBS Gesti\u00f3n de Equipos', MM, 22);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(today, MM, 29);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(title, MM, 43);

  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(MM, 48, PW - MM, 48);

  return { ...ctx, pageNum, y: 54 };
}

function endPage(ctx: Ctx, docName: string) {
  const doc = ctx.doc;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(MM, FOOTER_Y, PW - MM, FOOTER_Y);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(docName, MM, FOOTER_Y + 5);
  doc.text(`${ctx.pageNum}`, PW - MM, FOOTER_Y + 5, { align: 'right' });
}

function ensureSpace(ctx: Ctx, needed: number, title: string, docName: string): Ctx {
  if (ctx.y + needed > FOOTER_Y) {
    endPage(ctx, docName);
    ctx.doc.addPage();
    return startPage(ctx, title);
  }
  return ctx;
}

function generatePrivacyPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const docName = 'Pol\u00edtica de Privacidad';
  let ctx: Ctx = { doc, y: 0, pageNum: 0 };
  ctx = startPage(ctx, 'Pol\u00edtica de Privacidad');

  ctx = section(ctx, '1.', 'Identificaci\u00f3n del responsable del tratamiento',
    'ZBS Gesti\u00f3n de Equipos, con domicilio en la Zona B\u00e1sica de Salud de Forcall, Castell\u00f3n, es el responsable del tratamiento de los datos personales recabados a trav\u00e9s de esta aplicaci\u00f3n.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '2.', 'Marco normativo',
    'Esta pol\u00edtica de privacidad se rige por la normativa vigente en materia de protecci\u00f3n de datos, en particular:\n\n' +
    'Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protecci\u00f3n de las personas f\u00edsicas en lo que respecta al tratamiento de datos personales y a la libre circulaci\u00f3n de estos datos (RGPD).\n' +
    'Ley Org\u00e1nica 3/2018, de 5 de diciembre, de Protecci\u00f3n de Datos Personales y garant\u00eda de los derechos digitales (LOPDGDD).\n' +
    'Ley 41/2002, de 14 de noviembre, b\u00e1sica reguladora de la autonom\u00eda del paciente y de derechos y obligaciones en materia de informaci\u00f3n y documentaci\u00f3n cl\u00ednica.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '3.', 'Finalidad del tratamiento',
    'Los datos personales recabados a trav\u00e9s de esta aplicaci\u00f3n se tratan con las siguientes finalidades:\n\n' +
    '\u2022 Gesti\u00f3n de guardias m\u00e9dicas y de enfermer\u00eda del equipo sanitario de la ZBS Forcall.\n' +
    '\u2022 Gesti\u00f3n de libranzas, refuerzos y vacaciones del personal.\n' +
    '\u2022 Comunicaci\u00f3n interna entre los miembros del equipo sanitario.\n' +
    '\u2022 Gesti\u00f3n de alertas y emergencias sanitarias.\n' +
    '\u2022 Registro de actividad (auditor\u00eda) para garantizar la trazabilidad de los cambios.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '4.', 'Base jur\u00eddica del tratamiento',
    'La base jur\u00eddica para el tratamiento de los datos es:\n\n' +
    '\u2022 La ejecuci\u00f3n de una misi\u00f3n realizada en inter\u00e9s p\u00fablico o en el ejercicio de poderes p\u00fablicos conferidos al responsable del tratamiento (art. 6.1.e RGPD).\n' +
    '\u2022 El cumplimiento de una obligaci\u00f3n legal aplicable al responsable del tratamiento (art. 6.1.c RGPD).\n' +
    '\u2022 El consentimiento expl\u00edcito del usuario (art. 6.1.a RGPD) para funcionalidades espec\u00edficas.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '5.', 'Categor\u00edas de datos tratados',
    'Se tratan las siguientes categor\u00edas de datos personales:\n\n' +
    '\u2022 Datos identificativos: nombre, apellidos, correo electr\u00f3nico.\n' +
    '\u2022 Datos profesionales: categor\u00eda profesional, rol, grupo de trabajo.\n' +
    '\u2022 Datos de actividad: registro de acceso, modificaciones realizadas en el sistema.\n' +
    '\u2022 Datos de contacto: tel\u00e9fono profesional.\n\n' +
    'No se tratan categor\u00edas especiales de datos (salud, datos biom\u00e9tricos, etc.) m\u00e1s all\u00e1 de la informaci\u00f3n profesional sanitaria inherente a la funci\u00f3n del usuario.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '6.', 'Destinatarios de cesiones',
    'Los datos no ser\u00e1n cedidos a terceros salvo obligaci\u00f3n legal. No est\u00e1 prevista la transferencia internacional de datos fuera del Espacio Econ\u00f3mico Europeo.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '7.', 'Plazo de conservaci\u00f3n',
    'Los datos se conservar\u00e1n durante el tiempo necesario para cumplir con la finalidad para la que se recaban y, en todo caso, durante los plazos establecidos por la normativa aplicable en materia de documentaci\u00f3n sanitaria y administrativa. Una vez finalizada la relaci\u00f3n, se proceder\u00e1 a la supresi\u00f3n de los datos conforme a la pol\u00edtica de conservaci\u00f3n establecida.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '8.', 'Derechos del interesado',
    'El usuario tiene derecho a:\n\n' +
    '\u2022 Acceder a sus datos personales.\n' +
    '\u2022 Rectificar los datos inexactos.\n' +
    '\u2022 Solicitar la supresi\u00f3n de sus datos.\n' +
    '\u2022 Solicitar la limitaci\u00f3n del tratamiento.\n' +
    '\u2022 Oponerse al tratamiento.\n' +
    '\u2022 Solicitar la portabilidad de sus datos.\n' +
    '\u2022 No ser objeto de decisiones individuales automatizadas.\n\n' +
    'Para ejercer estos derechos, el usuario puede dirigirse al responsable del tratamiento a trav\u00e9s del correo electr\u00f3nico: ignacio@digitalcode.es.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '9.', 'Medidas de seguridad',
    'Se han implementado las medidas t\u00e9cnicas y organizativas necesarias para garantizar la seguridad de los datos personales y evitar su alteraci\u00f3n, p\u00e9rdida, tratamiento o acceso no autorizado, de acuerdo con el estado de la t\u00e9cnica, los costes de implementaci\u00f3n y la naturaleza, el alcance, el contexto y los fines del tratamiento.',
    'Pol\u00edtica de Privacidad', docName);

  ctx = section(ctx, '10.', 'Modificaciones',
    'Esta pol\u00edtica de privacidad puede ser actualizada peri\u00f3dicamente. Se recomienda al usuario revisarla peri\u00f3dicamente. El uso continuado de la aplicaci\u00f3n tras la publicaci\u00f3n de cambios constituye la aceptaci\u00f3n de dichos cambios.',
    'Pol\u00edtica de Privacidad', docName);

  endPage(ctx, docName);
  doc.save('Politica_Privacidad_ZBS_Gestion_Equipos.pdf');
}

function generateTermsPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const docName = 'T\u00e9rminos de Uso';
  let ctx: Ctx = { doc, y: 0, pageNum: 0 };
  ctx = startPage(ctx, 'T\u00e9rminos de Uso');

  ctx = section(ctx, '1.', 'Aceptaci\u00f3n de los t\u00e9rminos',
    'El uso de esta aplicaci\u00f3n (ZBS Gesti\u00f3n de Equipos) atribuye la condici\u00f3n de usuario e implica la aceptaci\u00f3n plena y sin reservas de todos y cada uno de los t\u00e9rminos y condiciones incluidos en este documento. Si el usuario no acepta la totalidad de los presentes t\u00e9rminos, deber\u00e1 abstenerse de utilizar la aplicaci\u00f3n.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '2.', 'Descripci\u00f3n del servicio',
    'ZBS Gesti\u00f3n de Equipos es una aplicaci\u00f3n web dise\u00f1ada para la gesti\u00f3n interna del equipo sanitario de la Zona B\u00e1sica de Salud de Forcall. Sus funcionalidades incluyen:\n\n' +
    '\u2022 Gesti\u00f3n de guardias m\u00e9dicas y de enfermer\u00eda.\n' +
    '\u2022 Gesti\u00f3n de libranzas, refuerzos y vacaciones.\n' +
    '\u2022 Sistema de mensajer\u00eda y comunicaci\u00f3n interna.\n' +
    '\u2022 Calendario compartido de reuniones y eventos.\n' +
    '\u2022 Sistema de alertas y avisos.\n' +
    '\u2022 Herramientas de transcripci\u00f3n y dictado.\n' +
    '\u2022 Visualizaci\u00f3n de alertas meteorol\u00f3gicas y de protecci\u00f3n civil.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '3.', 'Acceso y uso',
    'El acceso a la aplicaci\u00f3n est\u00e1 restringido al personal sanitario y administrativo autorizado de la ZBS Forcall. Cada usuario dispondr\u00e1 de credenciales de acceso personales e intransferibles. El usuario se compromete a:\n\n' +
    '\u2022 Mantener la confidencialidad de sus credenciales de acceso.\n' +
    '\u2022 No compartir su cuenta con terceros.\n' +
    '\u2022 Notificar inmediatamente cualquier uso no autorizado de su cuenta.\n' +
    '\u2022 Hacer un uso adecuado y responsable de la aplicaci\u00f3n.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '4.', 'Responsabilidad del usuario',
    'El usuario es responsable de:\n\n' +
    '\u2022 La veracidad y exactitud de los datos introducidos.\n' +
    '\u2022 El uso adecuado de las funcionalidades de la aplicaci\u00f3n.\n' +
    '\u2022 Cumplir con la normativa sanitaria y de protecci\u00f3n de datos aplicable.\n' +
    '\u2022 No realizar modificaciones no autorizadas en la configuraci\u00f3n del sistema.\n' +
    '\u2022 No introducir contenido ilegal, ofensivo o que pueda da\u00f1ar el sistema.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '5.', 'Propiedad intelectual',
    'Todos los derechos de propiedad intelectual sobre la aplicaci\u00f3n, su dise\u00f1o, c\u00f3digo fuente, logotipos y contenido son propiedad de los desarrolladores de la aplicaci\u00f3n. Queda prohibida la reproducci\u00f3n, distribuci\u00f3n, modificaci\u00f3n o explotaci\u00f3n no autorizada de la aplicaci\u00f3n o cualquiera de sus componentes.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '6.', 'Limitaci\u00f3n de responsabilidad',
    'La aplicaci\u00f3n se proporciona "tal cual", sin garant\u00edas de ning\u00fan tipo, expresas o impl\u00edcitas. Los desarrolladores no ser\u00e1n responsables de:\n\n' +
    '\u2022 Da\u00f1os directos o indirectos derivados del uso de la aplicaci\u00f3n.\n' +
    '\u2022 P\u00e9rdida de datos o interrupci\u00f3n del servicio.\n' +
    '\u2022 Decisiones cl\u00ednicas basadas en la informaci\u00f3n contenida en la aplicaci\u00f3n.\n' +
    '\u2022 La disponibilidad o continuidad del servicio.\n\n' +
    'La informaci\u00f3n farmacol\u00f3gica y las calculadoras incluidas en la aplicaci\u00f3n tienen car\u00e1cter meramente orientativo y no sustituyen el criterio cl\u00ednico del profesional sanitario ni las fichas t\u00e9cnicas oficiales de los medicamentos.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '7.', 'Modificaciones',
    'Los desarrolladores se reservan el derecho de modificar los presentes t\u00e9rminos de uso en cualquier momento, notificando los cambios a los usuarios a trav\u00e9s de la propia aplicaci\u00f3n o mediante correo electr\u00f3nico.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '8.', 'Legislaci\u00f3n aplicable',
    'Los presentes t\u00e9rminos se rigen por la legislaci\u00f3n espa\u00f1ola. Para cualquier controversia que pudiera derivarse del uso de la aplicaci\u00f3n, las partes se someten a los juzgados y tribunales de la provincia de Castell\u00f3n, renunciando a cualquier otro fuero que pudiera corresponderles.',
    'T\u00e9rminos de Uso', docName);

  ctx = section(ctx, '9.', 'Contacto',
    'Para cualquier consulta relacionada con estos t\u00e9rminos de uso, el usuario puede contactar a trav\u00e9s del correo electr\u00f3nico: ignacio@digitalcode.es',
    'T\u00e9rminos de Uso', docName);

  endPage(ctx, docName);
  doc.save('Terminos_Uso_ZBS_Gestion_Equipos.pdf');
}

function section(ctx: Ctx, num: string, heading: string, bodyText: string, title: string, docName: string): Ctx {
  const bodyLines = bodyText.split('\n').length;
  const sectionNeeded = 16 + bodyLines * 4.5;

  if (sectionNeeded > FOOTER_Y - MM) {
    let c = ensureSpace(ctx, 10, title, docName);

    c.doc.setFillColor(...RED);
    c.doc.rect(MM, c.y, 3, 12, 'F');

    c.doc.setFontSize(12);
    c.doc.setFont('helvetica', 'bold');
    c.doc.setTextColor(...DARK);
    c.doc.text(`${num}  ${heading}`, MM + 7, c.y + 4);
    c.y += 10;

    c.doc.setFontSize(9);
    c.doc.setFont('helvetica', 'normal');
    c.doc.setTextColor(...DARK);

    const paragraphs = bodyText.split('\n');
    for (const para of paragraphs) {
      const lines = c.doc.splitTextToSize(para, CONTENT - 14);
      for (const l of lines) {
        c = ensureSpace(c, 5, title, docName);
        c.doc.text(l, MM + 14, c.y);
        c.y += 4.5;
      }
    }
    c.y += 3;
    return c;
  }

  let c = ensureSpace(ctx, Math.min(sectionNeeded, 90), title, docName);

  c.doc.setFillColor(...RED);
  c.doc.rect(MM, c.y, 3, 12, 'F');

  c.doc.setFontSize(12);
  c.doc.setFont('helvetica', 'bold');
  c.doc.setTextColor(...DARK);
  c.doc.text(`${num}  ${heading}`, MM + 7, c.y + 4);
  c.y += 10;

  c.doc.setFontSize(9);
  c.doc.setFont('helvetica', 'normal');
  c.doc.setTextColor(...DARK);

  const paragraphs = bodyText.split('\n');
  for (const para of paragraphs) {
    const lines = c.doc.splitTextToSize(para, CONTENT - 14);
    for (const l of lines) {
      c = ensureSpace(c, 5, title, docName);
      c.doc.text(l, MM + 14, c.y);
      c.y += 4.5;
    }
  }
  c.y += 3;
  return c;
}

function generateVersionesPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const docName = 'Historial de Versiones';
  let ctx: Ctx = { doc, y: 0, pageNum: 0 };
  ctx = startPage(ctx, 'Historial de Versiones');

  ctx.doc.setFontSize(8);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setTextColor(...GRAY);
  ctx.doc.text(`${VERSION_STRING} \u2014 Documento de versionado sem\u00e1ntico`, MM, ctx.y);
  ctx.y += 10;

  for (const entry of CHANGELOG) {
    const entryNeeded = 22 + entry.changes.length * 4.8 + 6;

    const blockStartY = ctx.y;

    ctx = ensureSpace(ctx, 10, 'Historial de Versiones', docName);

    if (ctx.y - blockStartY > 3) {
      ctx.y += 2;
    }

    ctx.doc.setFillColor(...RED);
    ctx.doc.roundedRect(MM, ctx.y, 16, 7, 1.5, 1.5, 'F');
    ctx.doc.setFontSize(9);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(255, 255, 255);
    ctx.doc.text(`v${entry.version}`, MM + 8, ctx.y + 4.5, { align: 'center' });

    ctx.doc.setFontSize(8);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(...GRAY);
    ctx.doc.text(entry.date, MM + 21, ctx.y + 4.5);

    ctx.y += 9;

    ctx.doc.setFontSize(10);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(...RED);
    const titleLines = ctx.doc.splitTextToSize(entry.title, CONTENT - 21);
    ctx.doc.text(titleLines, MM + 21, ctx.y);
    ctx.y += titleLines.length * 4.5 + 1.5;

    ctx.doc.setDrawColor(...LIGHT_GRAY);
    ctx.doc.line(MM + 21, ctx.y, PW - MM, ctx.y);
    ctx.y += 3.5;

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(...DARK);
    ctx.doc.setFontSize(8.5);
    for (let i = 0; i < entry.changes.length; i++) {
      const change = entry.changes[i];
      const changeText = `\u2022 ${change}`;
      ctx = ensureSpace(ctx, 5, 'Historial de Versiones', docName);
      const changeLines = ctx.doc.splitTextToSize(changeText, CONTENT - 26);
      ctx.doc.text(changeLines, MM + 24, ctx.y);
      ctx.y += changeLines.length * 4.2 + 0.8;
    }

    ctx.y += 5;

    ctx.doc.setDrawColor(...LIGHT_GRAY);
    ctx.doc.setLineDashPattern([1.5, 2.5], 0);
    ctx.doc.line(MM, ctx.y, PW - MM, ctx.y);
    ctx.doc.setLineDashPattern([], 0);
    ctx.y += 4;
  }

  endPage(ctx, docName);
  doc.save('Versiones_ZBS_Gestion_Equipos.pdf');
}

export const Footer: React.FC = () => {
  const { t } = useT();
  return (
  <footer className="print-hide border-t border-gray-200 mt-12 py-6">
    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-bold text-gray-500">
      <span>{t('footer.copyright')}</span>
      <div className="flex items-center gap-3">
        <button onClick={generateVersionesPDF} className="hover:text-gray-800 transition-colors underline underline-offset-2">{t('footer.versions')}</button>
        <span className="text-gray-300">·</span>
        <button onClick={generatePrivacyPDF} className="hover:text-gray-800 transition-colors underline underline-offset-2">{t('footer.privacy')}</button>
        <span className="text-gray-300">·</span>
        <button onClick={generateTermsPDF} className="hover:text-gray-800 transition-colors underline underline-offset-2">{t('footer.terms')}</button>
        <span className="text-gray-300">·</span>
        <a href="mailto:ignacio@digitalcode.es" className="hover:text-gray-800 transition-colors underline underline-offset-2">{t('footer.contact')}</a>
      </div>
    </div>
  </footer>
  );
};
