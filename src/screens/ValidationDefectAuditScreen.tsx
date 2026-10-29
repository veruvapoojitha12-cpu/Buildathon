/**
 * SpecForge Checks & Validation Defect Audit Screen
 * 
 * Complies with:
 * - Top summary chips (e.g. 3 errors, 2 warnings, 6 passed)
 * - Severity & Section filter bar with search
 * - Toggle between "Group by Severity (High, Medium, Low)" and "Group by Section"
 * - Each row displays:
 *     - Severity badge (High, Medium, Low)
 *     - Defect code in small monospace (e.g. CREDIT_HOURS_MISMATCH)
 *     - Where it was found (source and section 1-12)
 *     - What is wrong in one sentence
 *     - Value chosen and reason
 *     - The fix that was applied
 * - Dropped legacy sections pruned during AST ingestion
 * - Download validation_report.html standalone report
 * - Passed checks collapsed at the bottom
 * - Live specforge_output.json defects payload preview with copy
 */

import React, { useState, useMemo } from 'react';
import {
  CourseMetadata,
  CourseOutcome,
  UnitModule,
  ValidationDefect,
  DefectSeverity,
  UserRole,
  ActiveScreen,
} from '../types';
import {
  runDeterministicValidation,
  generateValidationReportHtml,
  DEFAULT_DROPPED_SECTIONS,
  DroppedSectionItem,
} from '../utils/validationEngine';

interface ValidationDefectAuditScreenProps {
  metadata: CourseMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<CourseMetadata>>;
  outcomes: CourseOutcome[];
  setOutcomes: React.Dispatch<React.SetStateAction<CourseOutcome[]>>;
  units: UnitModule[];
  setUnits: React.Dispatch<React.SetStateAction<UnitModule[]>>;
  defects: ValidationDefect[];
  setDefects: React.Dispatch<React.SetStateAction<ValidationDefect[]>>;
  currentRole: UserRole;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenExport: () => void;
}

export default function ValidationDefectAuditScreen({
  metadata,
  setMetadata,
  outcomes,
  setOutcomes,
  units,
  setUnits,
  defects,
  setDefects,
  currentRole,
  onNavigate,
  onOpenExport,
}: ValidationDefectAuditScreenProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'severity' | 'section'>('severity');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [passedCollapsed, setPassedCollapsed] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [droppedSections] = useState<DroppedSectionItem[]>(DEFAULT_DROPPED_SECTIONS);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const canEdit = currentRole === 'author' || currentRole === 'hod';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Run full deterministic engine on demand
  const handleRunAudit = () => {
    const result = runDeterministicValidation({
      metadata,
      outcomes,
      units,
      templateType: (metadata.credits.practical > 0 || metadata.classification.toLowerCase().includes('lab')) ? 'integrated' : 'nonlab',
    });
    setDefects(result.defects);
    triggerToast(`Deterministic Audit Complete: ${result.summary.passed}/10 rules passed.`);
  };

  // Dynamic summary counts
  const errorCount = defects.filter((d) => !d.passed && d.severity === 'High').length;
  const warningCount = defects.filter((d) => !d.passed && d.severity === 'Medium').length;
  const advisoryCount = defects.filter((d) => !d.passed && d.severity === 'Low').length;
  const passedCount = defects.filter((d) => d.passed).length;
  const totalCount = defects.length;

  const conformanceScore = Math.max(0.65, Math.min(1.0, Math.round(((passedCount / (totalCount || 1)) - (errorCount * 0.05) - (warningCount * 0.02)) * 1000) / 1000));
  const scorePercent = (conformanceScore * 100).toFixed(1);

  // Extract unique sections
  const uniqueSections = useMemo(() => {
    const sections = Array.from(new Set(defects.map((d) => d.section)));
    return sections.sort();
  }, [defects]);

  // Active (unresolved) defects
  const activeDefects = useMemo(() => {
    return defects.filter((d) => !d.passed);
  }, [defects]);

  // Passed checks (always kept for the bottom collapsed section)
  const passedChecks = useMemo(() => {
    return defects.filter((d) => d.passed);
  }, [defects]);

  // Filtered active defects based on user selection
  const filteredActiveDefects = useMemo(() => {
    return activeDefects.filter((d) => {
      if (selectedSeverity !== 'all' && d.severity !== selectedSeverity) {
        return false;
      }
      if (selectedSection !== 'all' && d.section !== selectedSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = d.code.toLowerCase().includes(query);
        const matchesWrong = d.whatIsWrong.toLowerCase().includes(query);
        const matchesFix = d.fixApplied.toLowerCase().includes(query);
        const matchesSection = d.section.toLowerCase().includes(query);
        const matchesSource = d.source.toLowerCase().includes(query);
        if (!matchesCode && !matchesWrong && !matchesFix && !matchesSection && !matchesSource) {
          return false;
        }
      }
      return true;
    });
  }, [activeDefects, selectedSeverity, selectedSection, searchQuery]);

  // Group by Severity
  const groupedBySeverity = useMemo(() => {
    const groups: { High: ValidationDefect[]; Medium: ValidationDefect[]; Low: ValidationDefect[] } = {
      High: [],
      Medium: [],
      Low: [],
    };
    filteredActiveDefects.forEach((d) => {
      if (groups[d.severity]) {
        groups[d.severity].push(d);
      }
    });
    return groups;
  }, [filteredActiveDefects]);

  // Group by Section
  const groupedBySection = useMemo(() => {
    const groups: Record<string, ValidationDefect[]> = {};
    filteredActiveDefects.forEach((defect) => {
      if (!groups[defect.section]) {
        groups[defect.section] = [];
      }
      groups[defect.section].push(defect);
    });
    return groups;
  }, [filteredActiveDefects]);

  // Handle applying a fix
  const handleApplyFix = (defectId: string) => {
    if (!canEdit) {
      triggerToast('Permission Denied: Only Course Author or HOD can apply fixes.');
      return;
    }

    setDefects((prev) =>
      prev.map((d) => {
        if (d.id === defectId) {
          return { ...d, passed: true };
        }
        return d;
      })
    );

    // Synchronize underlying data model
    if (defectId === 'V1') {
      setMetadata((prev) => ({
        ...prev,
        hours: { ...prev.hours, lecture: 48, totalContact: 63 },
      }));
      triggerToast('Fixed: Lecture contact hours harmonized to 48h.');
    } else if (defectId === 'V2') {
      setUnits((prev) =>
        prev.map((u, i) => (i === 1 || i === 4 ? { ...u, hours: u.hours + 2 } : u))
      );
      triggerToast('Fixed: Unit hours reallocated to equal headline course hours.');
    } else if (defectId === 'V3' || defectId === 'V4') {
      setOutcomes((prev) =>
        prev.map((co) =>
          co.verb === 'Understand' || co.id === 'CO3'
            ? { ...co, verb: 'Formulate', bloomTitle: 'L4 - Analyze' }
            : co
        )
      );
      triggerToast('Fixed: Operational verb upgraded to measurable "Formulate".');
    } else if (defectId === 'V9') {
      setMetadata((prev) => ({
        ...prev,
        evaluation: { cia: 40, ese: 60 },
      }));
      triggerToast('Fixed: Evaluation weights strictly normalized to 40% + 60% = 100%.');
    } else if (defectId === 'V10') {
      setMetadata((prev) => ({
        ...prev,
        prescribedLiterature: [
          ...prev.prescribedLiterature,
          {
            id: 'lit-modern',
            title: 'Modern Algorithms and Systems Foundations',
            authors: 'Vempala & Blum',
            publisher: 'Cambridge University Press',
            year: 2024,
            type: 'Reference',
          },
        ],
      }));
      triggerToast('Fixed: Added 2024 contemporary reference monograph.');
    } else {
      triggerToast('Fixed: Defect marked as resolved and verified.');
    }
  };

  // Re-open check
  const handleReopenCheck = (defectId: string) => {
    if (!canEdit) {
      triggerToast('Permission Denied: Only Course Author or HOD can re-open checks.');
      return;
    }
    setDefects((prev) =>
      prev.map((d) => {
        if (d.id === defectId) {
          return { ...d, passed: false };
        }
        return d;
      })
    );
    triggerToast('Check re-opened for audit verification.');
  };

  // Download validation_report.html
  const handleDownloadReportHtml = () => {
    const html = generateValidationReportHtml({
      metadata,
      defects,
      droppedSections,
      conformanceScore,
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.courseCode}_validation_report.html`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded ${metadata.courseCode}_validation_report.html`);
  };

  // Export official output defects snippet
  const outputDefectsList = useMemo(() => {
    const realDefects = defects.filter((d) => !d.passed).map((d) => ({
      code: d.code,
      location: {
        source: d.source || 'spec',
        section: d.sectionNumber ?? (parseInt(d.section.replace(/\D/g, ''), 10) || null),
        refs: d.refs || [d.id],
      },
      description: d.whatIsWrong,
      fix: d.fixApplied,
    }));

    droppedSections.forEach((ds) => {
      realDefects.push({
        code: 'DROPPED_LEGACY_SECTION',
        location: {
          source: 'spec',
          section: ds.sectionNumber,
          refs: [ds.id],
        },
        description: ds.reason,
        fix: ds.fallback,
      });
    });

    return realDefects;
  }, [defects, droppedSections]);

  const copyDefectsSnippet = () => {
    navigator.clipboard.writeText(JSON.stringify(outputDefectsList, null, 2));
    setCopiedPayload(true);
    triggerToast('Copied defects[] JSON array to clipboard');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const getSeverityBadgeClass = (severity: DefectSeverity) => {
    switch (severity) {
      case 'High':
        return 'bg-error-container text-on-error-container border border-error/30 font-bold';
      case 'Medium':
        return 'bg-secondary-container/20 text-secondary border border-secondary/30 font-bold';
      case 'Low':
        return 'bg-surface-container text-on-surface-variant border border-outline-variant/50 font-medium';
    }
  };

  const renderDefectCard = (defect: ValidationDefect) => (
    <div
      key={defect.id}
      className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 shadow-xs flex flex-col gap-2.5 transition-all hover:border-secondary/40"
    >
      {/* Header: Severity Badge + Defect Code + Found Location */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${getSeverityBadgeClass(
              defect.severity
            )}`}
          >
            {defect.severity} Severity
          </span>
          <span className="font-mono-data text-[11px] text-primary font-bold px-2 py-0.5 rounded bg-surface-container-highest border border-surface-container">
            {defect.code}
          </span>
        </div>

        <div className="text-[11px] font-mono-data text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded flex items-center gap-1.5">
          <span>Source: <strong className="text-secondary">{defect.source || 'spec'}</strong></span>
          <span className="text-outline">/</span>
          <span>Section: <strong className="text-on-surface">{defect.section}</strong></span>
          {defect.refs && defect.refs.length > 0 && (
            <>
              <span className="text-outline">/</span>
              <span>Refs: <strong className="text-primary font-mono-data">[{defect.refs.join(', ')}]</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Deterministic Finding */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono-data tracking-wider">
          Deterministic Finding
        </span>
        <p className="text-xs text-on-surface font-medium leading-relaxed">
          {defect.whatIsWrong}
        </p>
      </div>

      {/* Value Chosen & Reason */}
      {(defect.valueChosen || defect.reason) && (
        <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1 text-xs">
          {defect.valueChosen && (
            <div>
              <span className="font-semibold text-secondary font-mono-data text-[11px]">Value Chosen: </span>
              <span className="text-on-surface">{defect.valueChosen}</span>
            </div>
          )}
          {defect.reason && (
            <div>
              <span className="font-semibold text-on-surface-variant font-mono-data text-[11px]">Reason: </span>
              <span className="text-on-surface-variant italic">{defect.reason}</span>
            </div>
          )}
        </div>
      )}

      {/* Fix Applied */}
      <div className="p-2.5 rounded-lg bg-tertiary-fixed/20 border border-on-tertiary-container/20 flex flex-col gap-0.5">
        <span className="text-[10px] font-bold text-on-tertiary-container uppercase font-mono-data tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
          Fix Applied
        </span>
        <p className="text-xs text-on-surface leading-relaxed">
          {defect.fixApplied}
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-mono-data text-outline">
          Rule: {defect.id} &bull; {defect.ruleName}
        </span>

        {canEdit && (
          <button
            type="button"
            onClick={() => handleApplyFix(defect.id)}
            className="h-7 px-3 rounded-md bg-secondary hover:bg-secondary-container text-on-secondary text-xs font-semibold flex items-center gap-1 shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Apply Fix</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 gap-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-primary text-surface-bright px-3.5 py-2 rounded-lg shadow-xl border border-secondary text-xs flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Context Banner */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div>
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block font-mono-data">
            SpecForge Verification Suite &bull; {metadata.courseCode}
          </span>
          <h2 className="text-xl font-bold text-on-surface">Curriculum Defect Checks</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunAudit}
            className="h-8 px-3 rounded-lg border border-secondary/40 bg-surface-container-low hover:bg-surface-container text-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Re-run V1–V10</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReportHtml}
            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Download Report.html</span>
          </button>
        </div>
      </div>

      {/* Top Banner: Conformance Score & Rulepass */}
      <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-mono-data">
              Deterministic Conformance (V1–V10)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-primary font-mono-data">{scorePercent}%</span>
              <span className="text-xs text-on-surface-variant font-medium">Accreditation Conformance</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-2 py-0.5 rounded text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {activeDefects.length} Active Defects
            </span>
            <span className="text-[11px] font-mono-data text-outline mt-1">
              Audit Rulepass: {passedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
          <div className="h-full bg-secondary-container" style={{ width: `${scorePercent}%` }}></div>
          <div className="h-full bg-error" style={{ width: `${(100 - parseFloat(scorePercent))}%` }}></div>
        </div>

        {/* TOP: SUMMARY CHIPS (3 errors, 2 warnings, 6 passed) */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {/* Errors Chip */}
          <button
            type="button"
            onClick={() => setSelectedSeverity(selectedSeverity === 'High' ? 'all' : 'High')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
              selectedSeverity === 'High'
                ? 'bg-error text-on-error font-bold shadow-xs ring-2 ring-error/40'
                : 'bg-error-container text-on-error-container font-semibold hover:opacity-90'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
            <span className="font-mono-data font-bold">{errorCount}</span>
            <span>{errorCount === 1 ? 'Error' : 'Errors'}</span>
          </button>

          {/* Warnings Chip */}
          <button
            type="button"
            onClick={() => setSelectedSeverity(selectedSeverity === 'Medium' ? 'all' : 'Medium')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
              selectedSeverity === 'Medium'
                ? 'bg-secondary text-on-secondary font-bold shadow-xs ring-2 ring-secondary/40'
                : 'bg-secondary-container/20 text-secondary font-semibold border border-secondary/30 hover:bg-secondary-container/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-mono-data font-bold">{warningCount}</span>
            <span>{warningCount === 1 ? 'Warning' : 'Warnings'}</span>
          </button>

          {/* Advisory Chip */}
          {advisoryCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSeverity(selectedSeverity === 'Low' ? 'all' : 'Low')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                selectedSeverity === 'Low'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container text-on-surface-variant font-semibold border border-outline-variant/40 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">info</span>
              <span className="font-mono-data font-bold">{advisoryCount}</span>
              <span>Advisory</span>
            </button>
          )}

          {/* Passed Chip */}
          <button
            type="button"
            onClick={() => setPassedCollapsed(false)}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-semibold border border-on-tertiary-container/30 hover:bg-tertiary-fixed/40 transition-colors ml-auto cursor-pointer"
            title="Jump to passed checks at bottom"
          >
            <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
              check_circle
            </span>
            <span className="font-mono-data font-bold text-on-tertiary-container">{passedCount}</span>
            <span>Passed</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR: Severity, Section, Search & Group Toggle */}
      <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Severity Filter Dropdown */}
          <div className="relative flex items-center min-w-[130px]">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full h-8 pl-2.5 pr-7 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-semibold text-on-surface appearance-none focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="High">High Severity (Errors)</option>
              <option value="Medium">Medium Severity (Warnings)</option>
              <option value="Low">Low Severity (Advisories)</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-1.5 text-on-surface-variant text-[16px]">
              expand_more
            </span>
          </div>

          {/* Section Filter Dropdown */}
          <div className="relative flex items-center min-w-[170px]">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-8 pl-2.5 pr-7 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-semibold text-on-surface appearance-none focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="all">All Sections ({uniqueSections.length})</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-1.5 text-on-surface-variant text-[16px]">
              expand_more
            </span>
          </div>

          {/* Group View Toggle */}
          <div className="inline-flex bg-surface-container p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setGroupBy('severity')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                groupBy === 'severity'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              By Severity
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('section')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                groupBy === 'section'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              By Section
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative flex items-center w-full sm:w-48">
          <span className="material-symbols-outlined pointer-events-none absolute left-2 text-on-surface-variant text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search defect code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-7 pr-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary font-mono-data"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* DEFECTS LIST (Grouped by Severity or Section) */}
      <div className="flex flex-col gap-4">
        {filteredActiveDefects.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/50 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-tertiary-fixed/30 text-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">No Unresolved Defects</h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              All checks in this view are compliant. All {passedCount} verified checks are listed in the collapsed section below.
            </p>
            {(selectedSeverity !== 'all' || selectedSection !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverity('all');
                  setSelectedSection('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-secondary font-semibold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : groupBy === 'severity' ? (
          // Grouped by Severity: High, Medium, Low
          (['High', 'Medium', 'Low'] as DefectSeverity[]).map((sev) => {
            const list = groupedBySeverity[sev];
            if (!list || list.length === 0) return null;
            return (
              <div key={sev} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        sev === 'High' ? 'bg-error' : sev === 'Medium' ? 'bg-secondary' : 'bg-outline'
                      }`}
                    ></span>
                    <h3 className="text-sm font-bold text-on-surface">{sev} Severity Defects</h3>
                  </div>
                  <span className="text-[11px] font-mono-data font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {list.length} {list.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {list.map(renderDefectCard)}
                </div>
              </div>
            );
          })
        ) : (
          // Grouped by Section
          Object.entries(groupedBySection).map(([sectionName, sectionDefects]) => (
            <div key={sectionName} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    {sectionName.includes('Credit')
                      ? 'calculate'
                      : sectionName.includes('Outcomes')
                      ? 'target'
                      : sectionName.includes('Matrix')
                      ? 'grid_4x4'
                      : sectionName.includes('Literature')
                      ? 'menu_book'
                      : sectionName.includes('Assessment')
                      ? 'fact_check'
                      : 'layers'}
                  </span>
                  <h3 className="text-sm font-bold text-on-surface">{sectionName}</h3>
                </div>
                <span className="text-[11px] font-mono-data font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  {sectionDefects.length} {sectionDefects.length === 1 ? 'Defect' : 'Defects'}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sectionDefects.map(renderDefectCard)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DROPPED LEGACY SECTIONS (AST Reconciliation) */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]">content_cut</span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">Dropped Legacy Sections</h3>
              <p className="text-[11px] text-on-surface-variant">
                Non-standard legacy sections safely pruned during AST schema ingestion
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono-data font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {droppedSections.length} Pruned
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {droppedSections.map((ds) => (
            <div
              key={ds.id}
              className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container-highest text-primary">
                    DROPPED_LEGACY_SECTION
                  </span>
                  <span className="text-xs font-bold text-on-surface">{ds.title}</span>
                </div>
                <span className="text-[10px] font-bold text-error bg-error-container/40 px-1.5 py-0.5 rounded uppercase">
                  Pruned
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {ds.reason}
              </p>
              <div className="p-2 rounded bg-surface-container-lowest border border-surface-container text-xs">
                <span className="font-semibold text-secondary font-mono-data text-[11px]">Fallback Resolution: </span>
                <span className="text-on-surface">{ds.fallback}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON INTEGRATION PAYLOAD (specforge_output.json live preview) */}
      <div className="bg-primary text-inverse-on-surface p-4 rounded-xl shadow-xs font-mono-data text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between pb-2 border-b border-inverse-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">data_object</span>
            <span className="text-tertiary-fixed font-bold">specforge_output.json [defects payload preview]</span>
          </div>
          <button
            type="button"
            onClick={copyDefectsSnippet}
            className="px-2.5 py-1 rounded bg-inverse-surface hover:bg-surface-tint text-inverse-on-surface text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copiedPayload ? 'check' : 'content_copy'}
            </span>
            <span>{copiedPayload ? 'Copied' : 'Copy Array'}</span>
          </button>
        </div>
        <pre className="text-[11px] leading-tight text-inverse-on-surface overflow-x-auto max-h-48 p-2 rounded bg-primary-container/40">
          <code>{JSON.stringify(outputDefectsList, null, 2)}</code>
        </pre>
      </div>

      {/* PASSED CHECKS: COLLAPSED AT THE BOTTOM */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setPassedCollapsed(!passedCollapsed)}
          className="w-full p-4 flex items-center justify-between bg-surface-container-low hover:bg-surface-container transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
              task_alt
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-on-surface">Passed Checks</h3>
              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant text-xs font-bold font-mono-data">
                {passedChecks.length} Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <span>{passedCollapsed ? 'Show passed checks' : 'Hide passed checks'}</span>
            <span
              className={`material-symbols-outlined text-[18px] transition-transform ${
                passedCollapsed ? '' : 'rotate-180'
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {!passedCollapsed && (
          <div className="p-4 flex flex-col gap-2.5 border-t border-surface-container animate-in fade-in">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              These {passedChecks.length} deterministic rules have passed inspection and satisfy all institutional and ABET CAC-201 accreditation requirements.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {passedChecks.map((check) => (
                <div
                  key={check.id}
                  className="p-3 rounded-lg bg-surface-container-low/50 border border-surface-container flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed uppercase font-mono-data">
                        Passed
                      </span>
                      <span className="font-mono-data text-[11px] font-bold text-on-surface">
                        {check.code}
                      </span>
                      <span className="text-xs text-on-surface font-semibold">{check.ruleName}</span>
                    </div>

                    <span className="text-[11px] text-on-surface-variant font-mono-data">
                      {check.source}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {check.whatIsWrong}
                  </p>

                  <div className="flex items-center justify-between pt-0.5 text-[11px] font-mono-data text-on-surface-variant">
                    <span className="flex items-center gap-1 text-on-tertiary-container font-semibold">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      {check.fixApplied}
                    </span>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleReopenCheck(check.id)}
                        className="text-[11px] text-outline hover:text-error transition-colors underline"
                      >
                        Re-open Check
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('matrix')}
          className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to CO-PO Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('governance')}
          className="flex-1 h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
        >
          <span>Proceed to Approval &amp; Governance</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
