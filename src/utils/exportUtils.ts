import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Waits for web fonts so the exported PDF/PNG never falls back to a default font.
 */
async function waitForFonts(): Promise<void> {
  try {
    await document.fonts.ready;
  } catch {
    // Older browsers do not expose the Font Loading API.
  }
}

/**
 * Downloads a file safely using a blob URL + anchor click.
 * Falls back to opening the blob in a new tab on browsers that ignore `download`.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    try {
      window.open(url, '_blank');
    } catch {
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  // Keep the URL alive long enough for the browser to start the download.
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore.
    }
  }, 10_000);
}

/**
 * Clones a node into a clean, untransformed host so parent scroll/transform/overflow
 * styles (the zoom wrapper, scrollable preview pane, etc.) cannot clip the capture.
 */
function prepareClonedElement(clonedDoc: Document, elementId: string): void {
  const clonedEl = clonedDoc.getElementById(elementId);
  if (!clonedEl) return;

  clonedEl.querySelectorAll('[contenteditable]').forEach((node) => {
    node.removeAttribute('contenteditable');
    (node as HTMLElement).style.outline = 'none';
  });

  clonedEl.style.transform = 'none';
  clonedEl.style.boxShadow = 'none';
  clonedEl.style.margin = '0';
  clonedEl.style.minHeight = '0';
  clonedEl.style.opacity = '1';
  clonedEl.style.visibility = 'visible';
  clonedEl.style.display = 'block';

  // Horizontal layout wraps boxes in an overflow container; expose all of it
  // before measuring, otherwise the extra boxes would be clipped in the export.
  clonedEl.querySelectorAll<HTMLElement>('.overflow-x-auto').forEach((node) => {
    node.style.overflow = 'visible';
    node.style.width = 'auto';
    node.style.maxWidth = 'none';
  });

  // Capture the full chart width, including horizontally scrollable chains.
  const sourceWidth = Math.max(
    clonedEl.scrollWidth || 0,
    Math.round(clonedEl.getBoundingClientRect().width) || 0,
    820
  );
  clonedEl.style.width = `${sourceWidth}px`;
  clonedEl.style.maxWidth = 'none';

  const host = clonedDoc.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = `${sourceWidth}px`;
  host.style.background = '#ffffff';
  host.style.padding = '0';
  host.style.margin = '0';
  host.style.zIndex = '0';
  host.style.pointerEvents = 'none';

  clonedDoc.body.appendChild(host);
  host.appendChild(clonedEl);
}

async function renderElementToCanvas(
  elementId: string,
  scale: number,
  allowTaint = false
): Promise<HTMLCanvasElement> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Flowchart canvas element not found. Switch to the preview panel and try again.');
  }

  await waitForFonts();

  return html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 15_000,
    removeContainer: true,
    onclone: (clonedDoc) => prepareClonedElement(clonedDoc, elementId),
  });
}

/**
 * Exports the flowchart as a crisp, single-page A4 PDF.
 *
 * The PDF is downloaded directly. If rendering fails and `printFallback` is enabled,
 * the browser print dialog is opened so the chart can still be saved as a PDF.
 */
export async function exportAsPdf(
  elementId: string,
  filename: string = 'Flowchart.pdf',
  printFallback: boolean = false
): Promise<'download' | 'print'> {
  const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    const canvas = await renderElementToCanvas(elementId, 2);

    const isLandscape = canvas.width > canvas.height * 1.15;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    let drawWidth = maxWidth;
    let drawHeight = (canvas.height * drawWidth) / canvas.width;

    if (drawHeight > maxHeight) {
      const ratio = maxHeight / drawHeight;
      drawWidth *= ratio;
      drawHeight *= ratio;
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    const imageData = canvas.toDataURL('image/png');
    pdf.addImage(imageData, 'PNG', x, y, drawWidth, drawHeight);

    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, cleanFilename);

    // Free the large canvas as soon as the PDF has been produced.
    canvas.width = 0;
    canvas.height = 0;

    return 'download';
  } catch (error) {
    console.error('PDF export failed:', error);
    if (printFallback) {
      window.print();
      return 'print';
    }
    throw error;
  }
}

/**
 * Exports the flowchart as a high-resolution PNG image.
 */
export async function exportAsPng(elementId: string, filename: string = 'Flowchart.png'): Promise<void> {
  const cleanFilename = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;

  const canvas = await renderElementToCanvas(elementId, 2.5);

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, cleanFilename);
        resolve();
        return;
      }

      try {
        const link = document.createElement('a');
        link.download = cleanFilename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 'image/png');
  });
}

/**
 * Copies the flowchart image directly to the system clipboard.
 */
export async function copyToClipboard(elementId: string): Promise<boolean> {
  if (!document.getElementById(elementId)) return false;

  try {
    const canvas = await renderElementToCanvas(elementId, 2, true);

    return await new Promise<boolean>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          resolve(true);
        } catch {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}
