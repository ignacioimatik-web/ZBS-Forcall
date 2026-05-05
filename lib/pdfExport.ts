declare var html2pdf: any;

export interface PDFExportOptions {
  elementId: string;
  filename: string;
}

/**
 * Exporta un elemento HTML a PDF en formato A4 vertical (portrait), optimizado para caber en 1 hoja.
 * Clona el elemento, aplica estilos reducidos y ejecuta html2pdf.
 *
 * El clon se inserta en el body con position:fixed + visibility:hidden (no -9999px)
 * para que html2canvas pueda renderizarlo correctamente.
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

  // Insertarlo de forma "visible" para html2canvas pero oculto al usuario.
  // Usar -9999px left o display:none provoca canvas vacio.
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.visibility = 'hidden';
  clone.style.zIndex = '-1';
  clone.style.width = '780px'; // A4 portrait util ~210mm a 96dpi ~ 794px
  clone.style.maxWidth = '780px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.overflow = 'hidden';

  // Aplicar clase especial para reducir tamaños
  clone.classList.add('pdf-export-scale');

  // Ocultar botones y controles interactivos
  const hidden = clone.querySelectorAll('button, select, input, .no-print');
  hidden.forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });

  // Reducir tamaño de celdas del calendario
  const cells = clone.querySelectorAll('.md\\:min-h-\\[180px\\], .min-h-\\[140px\\], .min-h-\\[160px\\]');
  cells.forEach(cell => {
    (cell as HTMLElement).style.minHeight = '45px';
    (cell as HTMLElement).style.fontSize = '7px';
  });

  // Reducir tamaños de texto de headers
  const texts = clone.querySelectorAll('.text-lg, .text-xl, .text-2xl');
  texts.forEach(txt => {
    (txt as HTMLElement).style.fontSize = '10px';
  });

  document.body.appendChild(clone);

  try {
    const opt = {
      margin: [3, 3, 3, 3],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 1.2,
        useCORS: true,
        windowWidth: 820,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all'] }
    };

    await html2pdf().set(opt).from(clone).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}
