import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFCalendarData {
  title: string;
  subtitle?: string;
  month: number;
  year: number;
  entries: Array<{
    date: Date;
    personnel: string[];
    type?: string;
    kind?: string;
  }>;
}

/**
 * Genera un PDF de calendario mensual en A4 vertical, 1 hoja,
 * con grid de días y entradas. Optimizado para imprimir.
 */
export function generateCalendarPDF(data: PDFCalendarData): jsPDF {
  const { title, subtitle, month, year, entries } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Colores corporativos
  const primary = [234, 88, 12]; // naranja Forcall
  const dark = [31, 41, 55];
  const light = [249, 250, 251];

  // Header
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 10, 13);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 10, 19);
  }

  // Fecha de generación
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageW - 10, 19, { align: 'right' });

  // Nombres de días
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const startY = 28;
  const cellW = (pageW - 20) / 7;
  const cellH = 6;

  doc.setFillColor(dark[0], dark[1], dark[2]);
  doc.rect(10, startY, pageW - 20, cellH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  dayNames.forEach((d, i) => {
    doc.text(d, 10 + i * cellW + cellW / 2, startY + 4.2, { align: 'center' });
  });

  // Calcular días del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startDayOfWeek = firstDay.getDay() - 1; // Lunes=0
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const calendarStartY = startY + cellH;
  const availableH = pageH - calendarStartY - 10;
  const rowH = Math.min(availableH / 6, 22);

  // Dibujar grid
  let currentDay = 1;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 10 + col * cellW;
      const y = calendarStartY + row * rowH;

      // Fondo alternado
      if ((row + col) % 2 === 0) {
        doc.setFillColor(light[0], light[1], light[2]);
        doc.rect(x, y, cellW, rowH, 'F');
      }

      // Borde
      doc.setDrawColor(220, 220, 220);
      doc.rect(x, y, cellW, rowH);

      const dayIndex = row * 7 + col;
      if (dayIndex >= startDayOfWeek && currentDay <= daysInMonth) {
        // Número del día
        const isWeekend = col >= 5;
        doc.setTextColor(isWeekend ? 200 : dark[0], isWeekend ? 50 : dark[1], isWeekend ? 50 : dark[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(String(currentDay), x + 1.5, y + 4.5);

        // Entradas del día
        const dayEntries = entries.filter(e => {
          const d = new Date(e.date);
          return d.getDate() === currentDay && d.getMonth() === month && d.getFullYear() === year;
        });

        if (dayEntries.length > 0) {
          doc.setFontSize(4.8);
          doc.setFont('helvetica', 'normal');
          let textY = y + 7.5;
          const maxVisible = 4;
          dayEntries.forEach((entry, idx) => {
            if (idx >= maxVisible) {
              if (idx === maxVisible) {
                doc.setTextColor(primary[0], primary[1], primary[2]);
                doc.text(`+${dayEntries.length - maxVisible} más`, x + 1.5, textY);
              }
              return;
            }
            const kindMap: Record<string, { label: string; color: number[] }> = {
              M: { label: 'M', color: [37, 99, 235] },
              E: { label: 'E', color: [220, 38, 38] },
              L: { label: 'L', color: [22, 163, 74] },
              R: { label: 'R', color: [234, 88, 12] },
              MT: { label: 'MT', color: [14, 165, 233] },
            };
            const info = kindMap[entry.kind || ''];
            const names = entry.personnel.join(', ');
            const truncated = names.length > 12 ? names.substring(0, 11) + '…' : names;
            if (info) {
              doc.setTextColor(info.color[0], info.color[1], info.color[2]);
              doc.setFont('helvetica', 'bold');
              doc.text(info.label, x + 1.5, textY);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(dark[0], dark[1], dark[2]);
              doc.text(truncated, x + 4.5, textY);
            } else {
              doc.setTextColor(dark[0], dark[1], dark[2]);
              doc.text(truncated, x + 1.5, textY);
            }
            textY += 2.8;
          });
        }

        currentDay++;
      }
    }
  }

  // Footer
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.5);
  doc.line(10, pageH - 12, pageW - 10, pageH - 12);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('ZBS Forcall - Gestión Sanitaria', 10, pageH - 7);
  doc.text(`Página 1 de 1`, pageW - 10, pageH - 7, { align: 'right' });

  return doc;
}

/**
 * Descarga un calendario como PDF con nombre de archivo.
 */
export function downloadCalendarPDF(data: PDFCalendarData, filename: string) {
  const doc = generateCalendarPDF(data);
  doc.save(filename);
}

/**
 * Legacy wrapper: mantiene compatibilidad con componentes que usan elementId.
 * Ahora genera PDF real a partir de datos en lugar de capturar DOM.
 */
export interface PDFExportOptions {
  elementId: string;
  filename: string;
}

export async function exportCalendarToPDF(options: PDFExportOptions): Promise<void> {
  // Legacy: no-op. Los componentes deben migrar a downloadCalendarPDF.
  console.warn('exportCalendarToPDF (DOM-based) is deprecated. Use downloadCalendarPDF with data.');
}
