/**
 * SpecForge HTML Export Dossier Modal
 * Compiles syllabus specification into formal printable accreditation HTML.
 */

import React, { useState } from 'react';
import { CourseMetadata, CourseOutcome, UnitModule, MatrixCellRationale, ValidationDefect } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: CourseMetadata;
  outcomes: CourseOutcome[];
  units: UnitModule[];
  rationales: MatrixCellRationale[];
  defects: ValidationDefect[];
  isApproved: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  metadata,
  outcomes,
  units,
  rationales,
  defects,
  isApproved,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateHTMLDossier = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${metadata.courseCode} - Course Specification Dossier</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1, h2, h3 { color: #091426; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e2e8f0; }
    .status { background: ${isApproved ? '#d1fae5; color: #065f46;' : '#fee2e2; color: #991b1b;'}; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 600; }
    .unit-box { margin-bottom: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .watermark { text-align: center; color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
  </style>
</head>
<body>
  ${!isApproved ? '<div class="watermark">[ DRAFT - PENDING FORMAL ACCREDITATION SEAL ]</div>' : ''}
  
  <header>
    <h1>${metadata.courseCode}: ${metadata.title}</h1>
    <p><strong>Department:</strong> ${metadata.department} | <strong>Standard:</strong> ${metadata.accreditationStandard}</p>
    <p><strong>Credits (L-T-P):</strong> ${metadata.credits.lecture}-${metadata.credits.tutorial}-${metadata.credits.practical} (${metadata.credits.total} Units) | <strong>Contact Hours:</strong> ${metadata.hours.totalContact}h</p>
    <p><strong>Prerequisites:</strong> ${metadata.prerequisites}</p>
  </header>

  <section>
    <h2>1. Course Learning Outcomes (CLOs)</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>Bloom Level</th><th>Action Verb</th><th>Outcome Statement</th></tr>
      </thead>
      <tbody>
        ${outcomes.map(o => `<tr><td><strong>${o.id}</strong></td><td><span class="badge">${o.bloom}</span></td><td>${o.verb}</td><td>${o.description}</td></tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section>
    <h2>2. Units of Instruction</h2>
    ${units.map(u => `
      <div class="unit-box">
        <h3>${u.title} <span class="badge">${u.hours} Hours</span></h3>
        <p>${u.topics}</p>
      </div>
    `).join('')}
  </section>

  <section>
    <h2>3. Examination & Assessment Breakdown</h2>
    <p><strong>Continuous Internal Assessment (CIA):</strong> ${metadata.evaluation.cia}%</p>
    <p><strong>End Semester Examination (ESE):</strong> ${metadata.evaluation.ese}%</p>
  </section>

  <section>
    <h2>4. Prescribed Literature</h2>
    <ul>
      ${metadata.prescribedLiterature.map(l => `<li><strong>${l.title}</strong> by ${l.authors} (${l.publisher}, ${l.year}) - <em>${l.type}</em></li>`).join('')}
    </ul>
  </section>

  <footer>
    <hr/>
    <p><small>Compiled via SpecForge Academic Workbench &bull; Deterministic Audit Hash: #SF-${metadata.courseCode}-2025</small></p>
  </footer>
</body>
</html>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateHTMLDossier());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateHTMLDossier()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.courseCode}_syllabus_spec.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">html</span>
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Accreditation Output Template
              </span>
              <h2 className="text-base font-semibold text-on-surface">Export Course Dossier HTML</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3 overflow-y-auto">
          <p className="text-xs text-on-surface-variant">
            Formatted in conformance with standard ABET / NBA accreditation curriculum formats. Clean, self-contained standalone HTML without external dependencies.
          </p>

          <div className="bg-primary text-surface-bright p-3 rounded-lg font-mono-data text-xs overflow-x-auto max-h-60 border border-primary-container">
            <pre className="text-surface-container-low">{generateHTMLDossier().slice(0, 1200)}... (truncated preview)</pre>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-container bg-surface-container-low">
          <span className="text-xs font-mono-data text-on-surface-variant">
            {metadata.courseCode}_specification.html
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-8 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download .html</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
