/**
 * Server-Side Template Hydrator using Cheerio
 * Used by POST /api/v1/generate to produce the filled spec document as one HTML string.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { CourseSpecDTO } from './schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function hydrateSpecHtmlServer(
  specData: CourseSpecDTO,
  templateType: 'integrated' | 'nonlab' = 'integrated'
): string {
  const filename = templateType === 'integrated' ? 'template-integrated.html' : 'template-nonlab.html';
  const templatePath = path.resolve(__dirname, '../templates', filename);

  let rawHtml = '';
  if (fs.existsSync(templatePath)) {
    rawHtml = fs.readFileSync(templatePath, 'utf-8');
  } else {
    // Secondary fallback to public/templates
    const fallbackPath = path.resolve(__dirname, '../public/templates', filename);
    if (fs.existsSync(fallbackPath)) {
      rawHtml = fs.readFileSync(fallbackPath, 'utf-8');
    }
  }

  const $ = cheerio.load(rawHtml);

  // 1. Headings & Title
  $('title').text(`${specData.courseCode} - ${specData.title}`);
  $('#course-type-tag').text(
    specData.courseType ||
      (templateType === 'integrated'
        ? 'Integrated Course (Theory + Laboratory Studio)'
        : 'Non-Lab Course (Pure Theory & Tutorial Colloquium)')
  );
  $('#course-title-heading').text(`${specData.courseCode} - ${specData.title}`);
  $('#department-line').text(
    `${specData.department} | Academic Year 2025-26 | Accreditation: ABET / NBA Tier-1`
  );

  // 2. Metadata Grid
  $('#spec-course-code').text(specData.courseCode);
  $('#spec-credit-structure').text(specData.credits);
  $('#spec-accreditation').text('ABET CAC-201 / NBA Tier-1 Standard');

  // Compute total hours
  const totalHrs = specData.units.reduce((acc, u) => acc + (Number(u.hours) || 0), 0);
  $('#spec-total-hours').text(`${totalHrs || 60} Total Contact Hours`);

  // 3. Course Outcomes Table
  const $coTbody = $('#table-course-outcomes tbody');
  $coTbody.empty();
  specData.courseOutcomes.forEach((co) => {
    $coTbody.append(`
      <tr>
        <td><strong>${co.id}</strong></td>
        <td><span class="badge">${co.bloomLevel} - ${co.verb}</span></td>
        <td>${co.verb}</td>
        <td>${co.description}</td>
      </tr>
    `);
  });

  // 4. Units Breakdown Container
  const $unitsContainer = $('#units-container');
  $unitsContainer.empty();
  specData.units.forEach((u) => {
    $unitsContainer.append(`
      <div class="unit-card">
        <div class="unit-header">
          <span class="unit-title">Unit ${u.unit}: ${u.title}</span>
          <span class="badge">${u.hours} Hours</span>
        </div>
        <p class="unit-content">${u.content}</p>
      </div>
    `);
  });

  // 5. Preserved elements: Embedded "Download as PDF" button is kept intact.
  return $.html();
}
