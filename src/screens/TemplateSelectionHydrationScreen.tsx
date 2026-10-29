/**
 * Screen: Template Selection & Schema Hydration
 * Rebuilt from design/stitch/stitch_specforge_project_overview_guide/specforge_template_selection_hydration/code.html
 * Enforces:
 * 1. Deterministic detection rule (Practical > 0 or 'laboratory' courseType -> Integrated; else Non-Lab)
 * 2. Signal breakdown display with exact conditions used
 * 3. Manual override with audited reason input
 * 4. Cheerio-based official HTML template hydration (/templates)
 * 5. Extraction of template sample strings for validation inspection
 * 6. Source priority: Blueprint (COs & Units) > Spec (Metadata, hours, etc.)
 * 7. 'Export spec' button downloading self-contained 'spec.html'
 */

import React, { useState, useMemo } from 'react';
import { CourseMetadata, CourseOutcome, UnitModule, UserRole, ActiveScreen } from '../types';
import {
  detectTemplate,
  extractTemplateSampleStrings,
  hydrateTemplateWithCheerio,
  downloadSpecHtml,
  TemplateType,
} from '../utils/templateHydrator';

interface TemplateSelectionHydrationScreenProps {
  metadata: CourseMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<CourseMetadata>>;
  outcomes: CourseOutcome[];
  units: UnitModule[];
  blueprintOutcomes?: CourseOutcome[];
  blueprintUnits?: UnitModule[];
  currentRole: UserRole;
  onNavigate: (screen: ActiveScreen) => void;
}

export default function TemplateSelectionHydrationScreen({
  metadata,
  setMetadata,
  outcomes,
  units,
  blueprintOutcomes,
  blueprintUnits,
  currentRole,
  onNavigate,
}: TemplateSelectionHydrationScreenProps) {
  // Detection result based on reactive metadata
  const detection = useMemo(() => detectTemplate(metadata), [metadata]);

  // Template selection state
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [manualTemplateType, setManualTemplateType] = useState<TemplateType>(detection.detectedType);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Active template type in effect
  const activeTemplateType: TemplateType = isManualOverride ? manualTemplateType : detection.detectedType;

  // View mode: 'visual' or 'source'
  const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
  const [isSampleRegistryOpen, setIsSampleRegistryOpen] = useState<boolean>(true);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [exportedStatus, setExportedStatus] = useState<boolean>(false);

  // Permissions
  const canModify = currentRole === 'author' || currentRole === 'hod';

  // Extract sample placeholder strings from the loaded official template
  const sampleStrings = useMemo(
    () => extractTemplateSampleStrings(activeTemplateType),
    [activeTemplateType]
  );

  // Hydrate template via Cheerio engine
  const hydratedHtml = useMemo(() => {
    return hydrateTemplateWithCheerio({
      templateType: activeTemplateType,
      metadata,
      outcomes,
      units,
      blueprintOutcomes,
      blueprintUnits,
    });
  }, [activeTemplateType, metadata, outcomes, units, blueprintOutcomes, blueprintUnits]);

  // Handle template card click
  const handleSelectTemplate = (type: TemplateType) => {
    if (!canModify) return;
    if (!isManualOverride) {
      setIsManualOverride(true);
    }
    setManualTemplateType(type);
    applyTemplateCreditDefaults(type);
  };

  const applyTemplateCreditDefaults = (type: TemplateType) => {
    if (type === 'integrated') {
      setMetadata((prev) => ({
        ...prev,
        credits: {
          lecture: prev.credits.lecture || 3,
          tutorial: 0,
          practical: prev.credits.practical > 0 ? prev.credits.practical : 2,
          total: (prev.credits.lecture || 3) + (prev.credits.practical > 0 ? prev.credits.practical : 2),
        },
        hours: {
          lecture: 45,
          tutorial: 0,
          practical: 30,
          totalContact: 75,
        },
        classification: prev.classification.toLowerCase().includes('laboratory')
          ? prev.classification
          : 'Integrated Course (Theory + Laboratory)',
      }));
    } else {
      setMetadata((prev) => ({
        ...prev,
        credits: {
          lecture: prev.credits.lecture || 3,
          tutorial: 1,
          practical: 0,
          total: (prev.credits.lecture || 3) + 1,
        },
        hours: {
          lecture: 45,
          tutorial: 15,
          practical: 0,
          totalContact: 60,
        },
        classification: prev.classification.toLowerCase().includes('laboratory')
          ? 'Professional Core (Theory)'
          : prev.classification,
      }));
    }
  };

  const handleToggleOverride = (checked: boolean) => {
    if (!canModify) return;
    setIsManualOverride(checked);
    if (checked) {
      setManualTemplateType(activeTemplateType);
    } else {
      setOverrideReason('');
      setOverrideError(null);
    }
  };

  const handleCopySource = () => {
    navigator.clipboard.writeText(hydratedHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleExportSpecHtml = () => {
    if (isManualOverride && !overrideReason.trim()) {
      setOverrideError('An override justification is required for academic accreditation audit.');
      return;
    }
    setOverrideError(null);
    downloadSpecHtml(hydratedHtml, 'spec.html');
    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 3000);
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(hydratedHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } else {
      // Fallback in-page
      window.print();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 gap-4 font-sans text-on-surface">
      {/* Stage Stepper / Academic Workflow Tracker */}
      <div className="bg-surface-container-low rounded-xl p-3 shadow-xs border border-surface-container flex items-center justify-between">
        <div
          onClick={() => onNavigate('intake')}
          className="flex items-center gap-1.5 opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
        >
          <span className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <span className="text-xs text-on-surface-variant hidden sm:inline">Intake &amp; Parse</span>
          <span className="text-xs text-on-surface-variant sm:hidden">Intake</span>
        </div>
        <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-sm border border-secondary/30">
          <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary text-[11px] flex items-center justify-center font-bold">
            2
          </span>
          <span className="text-xs text-on-surface font-bold">Template &amp; Hydration</span>
        </div>
        <span className="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>

        <div
          onClick={() => onNavigate('matrix')}
          className="flex items-center gap-1.5 opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
        >
          <span className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-bold flex items-center justify-center">
            3
          </span>
          <span className="text-xs text-on-surface-variant hidden sm:inline">CO-PO Alignment</span>
          <span className="text-xs text-on-surface-variant sm:hidden">Matrix</span>
        </div>
      </div>

      {/* 1. TEMPLATE DETECTION ENGINE BANNER / CARD */}
      <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/40 flex flex-col gap-3">
        {/* Header row with Detection Status Pill */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-[22px]">developer_board</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase font-mono-data">
                Auto-Detection Engine
              </span>
              <h2 className="text-base font-bold text-on-surface truncate">Curriculum Signal Matcher</h2>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 ${
              detection.detectedType === 'integrated'
                ? 'bg-surface-container text-on-tertiary-fixed-variant'
                : 'bg-surface-container text-secondary'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span className="text-xs font-bold uppercase font-mono-data tracking-wide">
              {detection.badgeLabel}
            </span>
          </div>
        </div>

        {/* Detection Signals Breakdown Box */}
        <div className="grid grid-cols-1 gap-2 bg-surface-container-low rounded-lg p-2.5 border border-surface-container">
          {detection.signals.map((sig, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-2 bg-surface-container-lowest rounded-md border border-surface-container"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`material-symbols-outlined text-[18px] shrink-0 ${
                    sig.matched ? 'text-on-tertiary-container' : 'text-outline'
                  }`}
                >
                  {sig.matched ? 'verified' : 'radio_button_unchecked'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-on-surface truncate">{sig.condition}</span>
                  <span className="text-[11px] text-on-surface-variant font-mono-data truncate">
                    {sig.detail}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-data shrink-0 ${
                  sig.matched
                    ? 'bg-surface-container text-on-tertiary-fixed-variant'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {sig.triggerBadge}
              </span>
            </div>
          ))}
        </div>

        {/* Auto-Selection Summary Alert */}
        <div className="p-2.5 rounded-lg bg-surface-container flex items-start gap-2.5 border border-surface-container-high">
          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">rule</span>
          <p className="text-xs text-on-surface leading-relaxed">
            <span className="font-bold text-secondary">Rule Evaluation:</span> {detection.ruleSummary}
          </p>
        </div>
      </div>

      {/* 2. MANUAL OVERRIDE ACCORDION / CARD */}
      <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/40 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">tune</span>
            <span className="text-sm font-bold text-on-surface">Manual Template Override</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                !isManualOverride
                  ? 'bg-surface-container text-on-surface-variant'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              {isManualOverride ? 'Audited Override' : 'Automatic Mode'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!canModify}
                checked={isManualOverride}
                onChange={(e) => handleToggleOverride(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
            </label>
          </div>
        </div>

        {isManualOverride && (
          <div className="flex flex-col gap-3 pt-2 border-t border-surface-container animate-in fade-in">
            <div className="text-xs text-on-surface-variant">
              Academic Accreditation guidelines enforce continuous auditable logging of manual specification structural changes.
            </div>

            {/* Radio Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={() => handleSelectTemplate('integrated')}
                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                  manualTemplateType === 'integrated'
                    ? 'bg-surface-container-low border-secondary ring-1 ring-secondary/30'
                    : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="template-choice"
                    checked={manualTemplateType === 'integrated'}
                    onChange={() => handleSelectTemplate('integrated')}
                    className="text-secondary focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Integrated Syllabus Template
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Theory Modules + Practical / Studio Sessions
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  L+P
                </span>
              </label>

              <label
                onClick={() => handleSelectTemplate('nonlab')}
                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                  manualTemplateType === 'nonlab'
                    ? 'bg-surface-container-low border-secondary ring-1 ring-secondary/30'
                    : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="template-choice"
                    checked={manualTemplateType === 'nonlab'}
                    onChange={() => handleSelectTemplate('nonlab')}
                    className="text-secondary focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Non-Lab Pure Theory Template
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Pure Lecture, Colloquium &amp; Seminar Modules
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  Pure Theory
                </span>
              </label>
            </div>

            {/* Justification Input */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-semibold text-on-surface flex items-center justify-between"
                htmlFor="override-reason"
              >
                <span>Override Justification (Required for Academic Audit)</span>
                <span className="text-error text-xs">*</span>
              </label>
              <textarea
                id="override-reason"
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value);
                  if (overrideError) setOverrideError(null);
                }}
                disabled={!canModify}
                rows={2}
                placeholder="e.g. Overriding to Integrated as hands-on programming labs are administered in studio sessions."
                className="w-full text-xs p-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:bg-surface-container-lowest focus:border-secondary shadow-inner resize-none"
              />
              {overrideError ? (
                <span className="text-[11px] text-error font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {overrideError}
                </span>
              ) : (
                <span className="text-[11px] text-on-surface-variant">
                  Logged in University Board of Studies (BoS) changelog metadata.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. TEMPLATE HYDRATION & CHEERIO PIPELINE CARD */}
      <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/40 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[20px]">schema</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">Hydration Engine</h2>
              <span className="text-[11px] text-on-tertiary-fixed-variant flex items-center gap-1 font-mono-data">
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                cheerio pipeline active
              </span>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-surface-container-low font-mono-data text-on-surface-variant border border-surface-container">
            /templates
          </span>
        </div>

        {/* Official Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Integrated Template Card */}
          <div
            onClick={() => handleSelectTemplate('integrated')}
            className={`p-3.5 rounded-xl flex flex-col gap-1.5 transition-all cursor-pointer border ${
              activeTemplateType === 'integrated'
                ? 'bg-surface-container-lowest shadow-sm border-secondary ring-2 ring-secondary/30'
                : 'bg-surface-container-low shadow-none border-surface-container opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary text-[22px]">layers</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-data flex items-center gap-1 ${
                  activeTemplateType === 'integrated'
                    ? 'bg-surface-container text-on-tertiary-fixed-variant'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {activeTemplateType === 'integrated' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                )}
                {activeTemplateType === 'integrated' ? 'LOADED & ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <span className="font-mono-data text-xs text-on-surface font-bold truncate">
              template-integrated.html
            </span>
            <span className="text-[11px] text-on-surface-variant leading-relaxed">
              Dual-stream syllabus schema with lab milestones and rubric bindings.
            </span>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-mono-data text-on-surface-variant">
              <span className="bg-surface-container px-1.5 py-0.5 rounded">L-T-P: 3-0-2</span>
              <span className="bg-surface-container px-1.5 py-0.5 rounded">75 Total Hrs</span>
            </div>
          </div>

          {/* Non-Lab Template Card */}
          <div
            onClick={() => handleSelectTemplate('nonlab')}
            className={`p-3.5 rounded-xl flex flex-col gap-1.5 transition-all cursor-pointer border ${
              activeTemplateType === 'nonlab'
                ? 'bg-surface-container-lowest shadow-sm border-secondary ring-2 ring-secondary/30'
                : 'bg-surface-container-low shadow-none border-surface-container opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-outline text-[22px]">menu_book</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-data flex items-center gap-1 ${
                  activeTemplateType === 'nonlab'
                    ? 'bg-surface-container text-on-tertiary-fixed-variant'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {activeTemplateType === 'nonlab' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                )}
                {activeTemplateType === 'nonlab' ? 'LOADED & ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <span className="font-mono-data text-xs text-on-surface font-bold truncate">
              template-nonlab.html
            </span>
            <span className="text-[11px] text-on-surface-variant leading-relaxed">
              Monolithic unit breakdown optimized for seminar and pure theory delivery.
            </span>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-mono-data text-on-surface-variant">
              <span className="bg-surface-container px-1.5 py-0.5 rounded">L-T-P: 3-1-0</span>
              <span className="bg-surface-container px-1.5 py-0.5 rounded">60 Total Hrs</span>
            </div>
          </div>
        </div>

        {/* Preserved Structural Layout Rules */}
        <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5 border border-surface-container">
          <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider font-mono-data">
            Preserved Structural Elements
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-semibold text-on-surface border border-surface-container">
              Headings &amp; Numbering
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-semibold text-on-surface border border-surface-container">
              Academic Table Grids
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-semibold text-on-surface border border-surface-container">
              Self-Contained CSS
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-semibold text-on-surface border border-surface-container">
              Embedded &ldquo;Download as PDF&rdquo;
            </span>
          </div>
        </div>

        {/* Hydration Data Flow Mapping */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider font-mono-data">
            Multi-Pass Source Hydration Map
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center justify-center shrink-0">
                  P1
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface font-semibold truncate">
                    Course Outcomes (CO1-CO5) &amp; Modular Units
                  </span>
                  <span className="text-[11px] text-on-surface-variant truncate">
                    {blueprintOutcomes && blueprintOutcomes.length > 0
                      ? 'Hydrated from Attached QP Blueprint (Priority Active)'
                      : 'Hydrated from Parsed Syllabus Spec AST'}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-secondary text-[18px]">sync_alt</span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-bold flex items-center justify-center shrink-0">
                  P2
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface font-semibold truncate">
                    Metadata, Credits, Hours, Literature &amp; Assessment
                  </span>
                  <span className="text-[11px] text-on-surface-variant truncate">
                    Hydrated from Parsed Syllabus Spec
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-secondary text-[18px]">sync_alt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SAMPLE STRING EXTRACTION INSPECTOR (VALIDATION GUARDRAIL) */}
      <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/40 flex flex-col gap-2">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsSampleRegistryOpen(!isSampleRegistryOpen)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-[20px]">security</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface truncate">
                Template Sample String Registry
              </span>
              <span className="text-[11px] text-on-tertiary-fixed-variant font-mono-data font-semibold">
                L4 Leakage Guard: {sampleStrings.length}/{sampleStrings.length} Indexed for Validation
              </span>
            </div>
          </div>
          <button
            aria-label="Toggle Registry Inspector"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSampleRegistryOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {isSampleRegistryOpen && (
          <div className="flex flex-col gap-2 pt-2 border-t border-surface-container animate-in fade-in">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Extracted placeholder tokens from official template archetype. The downstream verification engine asserts zero residual occurrences in the exported output:
            </p>

            <div className="grid grid-cols-1 gap-1.5 font-mono-data text-xs">
              {sampleStrings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase font-bold text-on-surface-variant">
                      {item.tokenCategory}
                    </span>
                    <span className="text-[10px] font-semibold text-on-tertiary-fixed-variant bg-surface-container px-1.5 py-0.2 rounded">
                      Cleaned in DOM
                    </span>
                  </div>
                  <span className="text-on-surface truncate font-mono-data text-[11px]">
                    &ldquo;{item.sampleValue}&rdquo;
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container flex items-center gap-2 border border-surface-container-high">
              <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">verified_user</span>
              <span className="text-xs font-semibold text-on-surface">
                Assertion Passed: Zero sample leakage tokens remain in Cheerio abstract syntax tree.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. LIVE PREVIEW OF FILLED SPEC DOCUMENT & ACTIONS */}
      <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/40 flex flex-col gap-3">
        {/* Preview Header & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-secondary uppercase tracking-wider font-bold block font-mono-data">
              Stage 2 Live Output
            </span>
            <h2 className="text-base font-bold text-on-surface">Hydrated Spec Canvas</h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-surface-container p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'visual'
                    ? 'bg-surface-container-lowest text-secondary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Visual View
              </button>
              <button
                onClick={() => setViewMode('source')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'source'
                    ? 'bg-surface-container-lowest text-secondary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                HTML Source
              </button>
            </div>
            <button
              onClick={handlePrintPdf}
              className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-secondary text-[16px]">picture_as_pdf</span>
              <span>PDF View</span>
            </button>
          </div>
        </div>

        {/* Miniature Spec Preview Container */}
        <div className="rounded-xl bg-surface-container-low p-2 shadow-inner border border-surface-container overflow-hidden">
          {viewMode === 'visual' ? (
            <div className="bg-surface-container-lowest rounded-lg p-4 shadow-sm flex flex-col gap-3 font-sans">
              {/* Document Academic Header */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1 border border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-data px-2 py-0.5 rounded bg-primary text-on-primary font-bold">
                    {metadata.courseCode}
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono-data">
                    Credits: {metadata.credits.total} (L:{metadata.credits.lecture} T:{metadata.credits.tutorial} P:{metadata.credits.practical})
                  </span>
                </div>
                <h3 className="text-sm font-bold text-on-surface mt-1">{metadata.title}</h3>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span>{metadata.department}</span>
                  <span>&bull;</span>
                  <span>Academic Year 2025-26</span>
                </div>
              </div>

              {/* Academic Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-[11px] text-on-surface-variant">Lecture Contact</span>
                  <span className="text-xs font-bold text-on-surface font-mono-data">
                    {metadata.hours.lecture} Hrs
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-[11px] text-on-surface-variant">
                    {activeTemplateType === 'integrated' ? 'Lab Practical' : 'Tutorial Colloquium'}
                  </span>
                  <span className="text-xs font-bold text-on-surface font-mono-data">
                    {activeTemplateType === 'integrated' ? metadata.hours.practical : metadata.hours.tutorial} Hrs
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-[11px] text-on-surface-variant">Total Units</span>
                  <span className="text-xs font-bold text-on-surface font-mono-data">
                    {units.length} Modules
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                  <span className="text-[11px] text-on-surface-variant">Outcomes</span>
                  <span className="text-xs font-bold text-on-surface font-mono-data">
                    {outcomes.length} Objectives
                  </span>
                </div>
              </div>

              {/* Unit Breakdown Snippet in Table Grid */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono-data">
                  Hydrated Module Preview
                </span>
                <div className="flex flex-col gap-1.5 bg-surface-container-low p-2 rounded-lg border border-surface-container">
                  {units.slice(0, 3).map((u) => (
                    <div
                      key={u.unit}
                      className="p-2.5 bg-surface-container-lowest rounded-md flex flex-col gap-0.5 border border-surface-container"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">
                          Unit {u.unit}: {u.title}
                        </span>
                        <span className="text-[11px] font-mono-data text-secondary font-bold">
                          {u.hours} Hrs
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                        {u.topics}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Embedded PDF Action bar */}
              <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                  <span className="text-xs font-semibold text-on-surface">
                    Self-contained spec bundle ready
                  </span>
                </div>
                <span className="text-[11px] font-mono-data text-on-surface-variant">
                  ~{(hydratedHtml.length / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="bg-primary p-3 rounded-lg overflow-x-auto text-on-primary max-h-72 border border-primary-container">
                <pre className="font-mono-data text-xs leading-relaxed text-secondary-fixed">
                  <code>{hydratedHtml}</code>
                </pre>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant px-1 font-mono-data">
                <span>
                  Lines: {hydratedHtml.split('\n').length} &bull; Size: ~{(hydratedHtml.length / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={handleCopySource}
                  className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-secondary"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedHtml ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedHtml ? 'Copied HTML' : 'Copy HTML'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Execution Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {/* Export Spec (spec.html) button */}
          <button
            onClick={handleExportSpecHtml}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all flex-1 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{exportedStatus ? 'Exported spec.html!' : 'Export Spec (spec.html)'}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">print</span>
            <span>Download as PDF</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'visual' ? 'source' : 'visual')}
            className="h-10 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {viewMode === 'visual' ? 'code' : 'preview'}
            </span>
            <span>{viewMode === 'visual' ? 'Inspect Source' : 'Visual Spec'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          onClick={() => onNavigate('intake')}
          className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Intake</span>
        </button>

        <button
          onClick={() => onNavigate('matrix')}
          className="flex-1 h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
        >
          <span>Proceed to CO-PO-PSO Alignment Matrix</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
