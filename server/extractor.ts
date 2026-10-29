/**
 * SpecForge Document Extractor
 * Extracts plain text, structural sections, and tabular data from:
 * - .docx via mammoth
 * - .pdf via pdf-parse
 * - .html via cheerio
 * - .doc via word-extractor
 */

import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import WordExtractor from 'word-extractor';
import { PDFParse } from 'pdf-parse';

export interface ExtractedDocument {
  filename: string;
  extension: string;
  rawText: string;
  tableText?: string;
  sizeBytes: number;
}

/**
 * Extracts text and tables from an uploaded file buffer.
 * Throws an informative Error if the file cannot be parsed or has an unsupported format.
 */
export async function extractDocumentContent(
  buffer: Buffer,
  filename: string
): Promise<ExtractedDocument> {
  const lowerName = filename.toLowerCase();
  const extMatch = lowerName.match(/\.(docx|pdf|html|htm|doc)$/);

  if (!extMatch) {
    throw new Error(
      `Unsupported file type for "${filename}". Allowed formats are: .docx, .pdf, .html, .doc`
    );
  }

  const ext = extMatch[1];
  let rawText = '';
  let tableText = '';

  try {
    switch (ext) {
      case 'docx': {
        // Mammoth for .docx
        const textRes = await mammoth.extractRawText({ buffer });
        rawText = textRes.value || '';

        // Also convert to HTML to grab table rows cleanly
        try {
          const htmlRes = await mammoth.convertToHtml({ buffer });
          if (htmlRes.value) {
            const $ = cheerio.load(htmlRes.value);
            const tables: string[] = [];
            $('table').each((tableIdx, table) => {
              const rows: string[] = [];
              $(table)
                .find('tr')
                .each((_, tr) => {
                  const cells: string[] = [];
                  $(tr)
                    .find('th, td')
                    .each((_, cell) => {
                      cells.push($(cell).text().trim().replace(/\s+/g, ' '));
                    });
                  if (cells.length > 0) {
                    rows.push(cells.join(' | '));
                  }
                });
              if (rows.length > 0) {
                tables.push(`[Table ${tableIdx + 1}]\n` + rows.join('\n'));
              }
            });
            tableText = tables.join('\n\n');
          }
        } catch (tableErr) {
          console.warn('Docx table extraction warning:', tableErr);
        }
        break;
      }

      case 'pdf': {
        // pdf-parse for .pdf
        const parser = new PDFParse({ data: buffer });
        try {
          const textRes = await parser.getText();
          rawText = textRes.text || '';

          // Attempt table extraction if available
          try {
            const tableRes = await (parser as any).getTable?.();
            if (tableRes?.pages) {
              const tableLines: string[] = [];
              for (const page of tableRes.pages) {
                if (page.tables && Array.isArray(page.tables)) {
                  for (const tbl of page.tables) {
                    if (Array.isArray(tbl.rows)) {
                      tableLines.push(
                        tbl.rows
                          .map((r: any) =>
                            Array.isArray(r) ? r.join(' | ') : String(r)
                          )
                          .join('\n')
                      );
                    }
                  }
                }
              }
              if (tableLines.length > 0) {
                tableText = tableLines.join('\n\n');
              }
            }
          } catch {
            // pdf table parse is optional enhancement
          }
        } finally {
          await parser.destroy().catch(() => {});
        }
        break;
      }

      case 'html':
      case 'htm': {
        // cheerio for .html
        const htmlContent = buffer.toString('utf-8');
        const $ = cheerio.load(htmlContent);

        // Strip scripts and styles
        $('script, style, noscript').remove();

        // Ensure block elements have newlines
        $('p, h1, h2, h3, h4, h5, h6, li, tr, div, br').each((_, el) => {
          $(el).append('\n');
        });

        const tables: string[] = [];
        $('table').each((i, table) => {
          const rows: string[] = [];
          $(table)
            .find('tr')
            .each((_, tr) => {
              const cells: string[] = [];
              $(tr)
                .find('th, td')
                .each((_, cell) => {
                  cells.push($(cell).text().trim().replace(/\s+/g, ' '));
                });
              if (cells.length > 0) {
                rows.push(cells.join(' | '));
              }
            });
          if (rows.length > 0) {
            tables.push(`[Table ${i + 1}]\n` + rows.join('\n'));
          }
        });
        tableText = tables.join('\n\n');

        // Extract body text
        const bodyText = $('body').length > 0 ? $('body').text() : $.text();
        rawText = bodyText
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s*\n+/g, '\n\n')
          .trim();
        break;
      }

      case 'doc': {
        // word-extractor for .doc
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(buffer);
        rawText = extracted.getBody() || '';
        const headers = extracted.getHeaders() || '';
        const footers = extracted.getFooters() || '';
        if (headers || footers) {
          rawText = `${headers}\n\n${rawText}\n\n${footers}`.trim();
        }
        break;
      }

      default:
        throw new Error(`Unsupported extension: ${ext}`);
    }
  } catch (err: any) {
    throw new Error(
      `Unable to parse document "${filename}" (${ext}): ${err.message || 'File corrupted or invalid structure'}`
    );
  }

  if (!rawText.trim() && !tableText.trim()) {
    throw new Error(
      `File "${filename}" was read, but no readable text or tables could be extracted.`
    );
  }

  return {
    filename,
    extension: ext,
    rawText: rawText.trim(),
    tableText: tableText.trim(),
    sizeBytes: buffer.length,
  };
}
