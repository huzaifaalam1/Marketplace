// Polyfill DOMMatrix for Node.js environment
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      // Basic polyfill to prevent ReferenceError
    }
  } as any;
}

export interface PDFExtractionResult {
  text: string
  length: number
}

/**
 * Extract plain text from a PDF buffer using pdf-parse
 * @param fileBuffer - Buffer containing PDF data
 * @returns Promise<PDFExtractionResult>
 */
export async function extractText(fileBuffer: Buffer): Promise<PDFExtractionResult> {
  if (!fileBuffer) {
    throw new Error('No file buffer provided.')
  }

  try {
    // Use pdf-parse for server-side PDF text extraction
    const pdfParse = require('pdf-parse') as any
    const data = await pdfParse(fileBuffer)

    const cleanedText = data.text
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim()

    return {
      text: cleanedText,
      length: cleanedText.length
    }

  } catch (error) {
    throw new Error('PDF extraction failed: ' + (error as Error).message)
  }
}
