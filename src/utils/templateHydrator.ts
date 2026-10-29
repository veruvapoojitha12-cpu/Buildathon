/**
 * SpecForge Academic Workbench - Template Hydrator & Detection Engine
 * Loads official HTML templates from /templates, extracts sample strings,
 * and performs Cheerio-based AST hydration while preserving CSS and print controls.
 */

import * as cheerio from 'cheerio';
import { CourseMetadata, CourseOutcome, UnitModule } from '../types';

// Raw HTML imports from /templates
import integratedTemplateRaw from '../../templates/template-integrated.html?raw';
import nonLabTemplateRaw from '../../templates/template-nonlab.html?raw';

export type TemplateType = 'integrated' | 'nonlab';

export interface DetectionSignal {
  condition: string;
  detail: string;
  triggerBadge: string;
  matched: boolean;
}

export interface TemplateDetectionResult {
  detectedType: TemplateType;
  badgeLabel: 'Detected: Integrated' | 'Detected: Non-Lab';
  signals: DetectionSignal[];
  ruleSummary: string;
}

export interface TemplateSampleString {
  tokenCategory: 'Title Token' | 'Code Token' | 'Department Token' | 'Module Token' | 'Outcome Token';
  sampleValue: string;
  selector: string;
}

/**
 * Deterministic detection rule:
 * A non-zero Practical value in the credit structure (P > 0),
 * OR a course type containing 'laboratory' (case-insensitive) = Integrated template;
 * otherwise Non-Lab template.
 */
export function detectTemplate(metadata: CourseMetadata): TemplateDetectionResult {
  const practicalCredits = Number(metadata.credits?.practical ?? 0);
  const classification = String(metadata.classification || '').toLowerCase();
  const title = String(metadata.title || '').toLowerCase();

  const practicalTriggered = practicalCredits > 0;
  const lexiconTriggered =
    classification.includes('laboratory') ||
    classification.includes('lab') ||
    title.includes('laboratory');

  const isIntegrated = practicalTriggered || lexiconTriggered;

  const signals: DetectionSignal[] = [
    {
      condition: 'Credit Vector Condition',
      detail: `L:T:P = ${metadata.credits.lecture}:${metadata.credits.tutorial}:${metadata.credits.practical} → Practical (P) = ${practicalCredits}${
        practicalTriggered ? ' > 0' : ' = 0'
      }`,
      triggerBadge: practicalTriggered ? 'P > 0 Triggered' : 'P = 0 Standby',
      matched: practicalTriggered,
    },
    {
      condition: 'Course Lexicon Condition',
      detail: lexiconTriggered
        ? 'Classification or title contains keyword "laboratory" / "lab"'
        : 'Pure theory lecture curriculum (no "laboratory" keyword found)',
      triggerBadge: lexiconTriggered ? 'Lexicon Matched' : 'Lexicon Standby',
      matched: lexiconTriggered,
    },
  ];

  const ruleSummary = isIntegrated
    ? `Rule Matched: ${practicalTriggered ? `Practical Credits = ${practicalCredits} > 0.` : ''} ${
        lexiconTriggered ? 'Course type contains "laboratory".' : ''
      } Dispatched template-integrated.html.`
    : `Rule Matched: Practical Credits = 0 and no laboratory keyword. Dispatched template-nonlab.html.`;

  return {
    detectedType: isIntegrated ? 'integrated' : 'nonlab',
    badgeLabel: isIntegrated ? 'Detected: Integrated' : 'Detected: Non-Lab',
    signals,
    ruleSummary,
  };
}

/**
 * Returns raw template HTML based on selected template type.
 */
export function getRawTemplateHtml(type: TemplateType): string {
  return type === 'integrated' ? integratedTemplateRaw : nonLabTemplateRaw;
}

/**
 * Collects sample placeholder strings (course title, code, department, sample units, outcomes)
 * from the loaded official HTML template into a registry for the validation step.
 */
export function extractTemplateSampleStrings(type: TemplateType): TemplateSampleString[] {
  const rawHtml = getRawTemplateHtml(type);
  const $ = cheerio.load(rawHtml);
  const samples: TemplateSampleString[] = [];

  // 1. Title Token
  const titleText = $('#course-title-heading').text().trim();
  if (titleText) {
    samples.push({
      tokenCategory: 'Title Token',
      sampleValue: titleText,
      selector: '#course-title-heading',
    });
  }

  // 2. Code Token
  const codeText = $('#spec-course-code').text().trim();
  if (codeText) {
    samples.push({
      tokenCategory: 'Code Token',
      sampleValue: codeText,
      selector: '#spec-course-code',
    });
  }

  // 3. Department Token
  const deptText = $('#department-line').text().trim();
  if (deptText) {
    samples.push({
      tokenCategory: 'Department Token',
      sampleValue: deptText,
      selector: '#department-line',
    });
  }

  // 4. Module Tokens
  $('#units-container .unit-card').each((_, el) => {
    const unitTitle = $(el).find('.unit-title').text().trim();
    if (unitTitle) {
      samples.push({
        tokenCategory: 'Module Token',
        sampleValue: unitTitle,
        selector: '#units-container .unit-title',
      });
    }
  });

  // 5. Outcome Tokens
  $('#table-course-outcomes tbody tr').each((_, el) => {
    const coDesc = $(el).find('td').last().text().trim();
    if (coDesc) {
      samples.push({
        tokenCategory: 'Outcome Token',
        sampleValue: coDesc,
        selector: '#table-course-outcomes td:last-child',
      });
    }
  });

  return samples;
}

export interface HydrationOptions {
  templateType: TemplateType;
  metadata: CourseMetadata;
  outcomes: CourseOutcome[];
  units: UnitModule[];
  blueprintOutcomes?: CourseOutcome[];
  blueprintUnits?: UnitModule[];
}

/**
 * Fills official university HTML template from parsed data using Cheerio:
 * - Keeps headings, numbering, table layout, CSS, and the Download as PDF button.
 * - Replaces sample content.
 * - Enforces source priority: Course Outcomes and units come from the blueprint when
 *   one is provided; everything else from the existing spec.
 */
export function hydrateTemplateWithCheerio({
  templateType,
  metadata,
  outcomes,
  units,
  blueprintOutcomes,
  blueprintUnits,
}: HydrationOptions): string {
  const rawHtml = getRawTemplateHtml(templateType);
  const $ = cheerio.load(rawHtml);

  // Source priority rule:
  // Course Outcomes and units come from blueprint when there is one; everything else from existing spec.
  const activeOutcomes = blueprintOutcomes && blueprintOutcomes.length > 0 ? blueprintOutcomes : outcomes;
  const activeUnits = blueprintUnits && blueprintUnits.length > 0 ? blueprintUnits : units;

  // 1. Document Title & Headings
  $('title').text(`${metadata.courseCode} - ${metadata.title}`);

  $('#course-type-tag').text(
    metadata.classification ||
      (templateType === 'integrated'
        ? 'Integrated Course (Theory + Laboratory Studio)'
        : 'Non-Lab Course (Pure Theory & Tutorial Colloquium)')
  );

  $('#course-title-heading').text(`${metadata.courseCode} - ${metadata.title}`);

  $('#department-line').text(
    `${metadata.department} | Academic Year 2025-26 | Standard: ${metadata.accreditationStandard}`
  );

  // 2. Metadata Grid
  $('#spec-course-code').text(metadata.courseCode);

  $('#spec-credit-structure').text(
    `${metadata.credits.lecture}:${metadata.credits.tutorial}:${metadata.credits.practical} (${metadata.credits.total} Credits)`
  );

  $('#spec-total-hours').text(
    `${metadata.hours.totalContact} Hours (${metadata.hours.lecture} Theory + ${metadata.hours.tutorial} Tutorial + ${metadata.hours.practical} Lab)`
  );

  $('#spec-accreditation').text(metadata.accreditationStandard);

  // 3. Course Outcomes (COs) Table
  const $outcomesBody = $('#table-course-outcomes tbody');
  $outcomesBody.empty();

  activeOutcomes.forEach((co) => {
    const row = `
      <tr>
        <td><strong>${co.id}</strong></td>
        <td><span class="badge">${co.bloom} - ${co.bloomTitle || co.verb}</span></td>
        <td>${co.verb}</td>
        <td>${co.description}</td>
      </tr>
    `;
    $outcomesBody.append(row);
  });

  // 4. Units Breakdown Container
  const $unitsContainer = $('#units-container');
  $unitsContainer.empty();

  activeUnits.forEach((u) => {
    const unitCard = `
      <div class="unit-card">
        <div class="unit-header">
          <span class="unit-title">Unit ${u.unit}: ${u.title}</span>
          <span class="badge">${u.hours} Hours</span>
        </div>
        <p class="unit-content">${u.topics}</p>
      </div>
    `;
    $unitsContainer.append(unitCard);
  });

  // 5. Integrated Laboratory Stream (if applicable)
  if (templateType === 'integrated') {
    const practicalHrs = metadata.hours.practical || 30;
    $('#lab-component-card .badge').text(`${practicalHrs} Practical Hours`);
  }

  // 6. Assessment & Evaluation Scheme
  $('#cia-weight').html(`<strong>${metadata.evaluation?.cia ?? 40}%</strong>`);
  $('#ese-weight').html(`<strong>${metadata.evaluation?.ese ?? 60}%</strong>`);

  // 7. Prescribed Literature & References
  const $literatureList = $('#literature-list');
  if ($literatureList.length > 0 && metadata.prescribedLiterature && metadata.prescribedLiterature.length > 0) {
    $literatureList.empty();
    metadata.prescribedLiterature.forEach((lit) => {
      const item = `<li><strong>${lit.title}</strong> by ${lit.authors} (${lit.publisher}, ${lit.year}) - <em>${lit.type}</em></li>`;
      $literatureList.append(item);
    });
  }

  // 8. Footer Timestamp & Source Attribution
  $('.footer-stamp span:first-child').text(
    `SpecForge Academic Workbench &bull; Hydrated via Cheerio Engine &bull; Ref: SF-${metadata.courseCode}`
  );

  return $.html();
}

/**
 * Downloads filled specification as 'spec.html' (self-contained HTML blob)
 */
export function downloadSpecHtml(htmlContent: string, filename = 'spec.html'): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
