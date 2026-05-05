declare var html2pdf: any;

export interface PDFExportOptions {
  elementId: string;
  filename: string;
}

/**
 * Exporta un elemento HTML a PDF en formato A4 landscape, optimizado para caber en 1 hoja.
 * Clona el elemento, aplica estilos de escala temporal y ejecuta html2pdf.
 */
export async function exportCalendarToPDF(options: PDFExportOptions): Promise<void> {
  const { elementId, filename } = options;
  
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  // Clonar el elemento para no afectar la UI
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.width = '1050px'; // A4 landscape útil ~297mm a 96dpi
  clone.style.maxHeight = '700px';
  clone.style.overflow = 'hidden';
  
  // Aplicar clase especial para reducir tamaños
  clone.classList.add('pdf-export-scale');
  
  // Ocultar botones y controles interactivos
  const buttons = clone.querySelectorAll('button, select, input, .no-print');
  buttons.forEach(btn => {
    (btn as HTMLElement).style.display = 'none';
  });

  // Reducir tamaño de celdas del calendario
  const cells = clone.querySelectorAll('.md\\:min-h-\\[180px\\], .min-h-\\[140px\\], .min-h-\\[160px\\]');
  cells.forEach(cell => {
    (cell as HTMLElement).style.minHeight = '65px';
    (cell as HTMLElement).style.fontSize = '9px';
  });

  // Reducir tamaños de texto
  const texts = clone.querySelectorAll('.text-lg, .text-xl, .text-2xl');
  texts.forEach(txt => {
    (txt as HTMLElement).style.fontSize = '12px';
  });

  document.body.appendChild(clone);

  try {
    const opt = {
      margin: [5, 5, 5, 5],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 1.4, 
        useCORS: true, 
        windowWidth: 1100,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape',
        compress: true
      },
      pagebreak: { mode: ['avoid-all'] }
    };

    await html2pdf().set(opt).from(clone).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    document.body.removeChild(clone);
  }
}
