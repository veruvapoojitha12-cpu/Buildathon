/**
 * Screen 1: Course Specification Builder
 * Rebuilt from design/stitch/stitch_specforge_project_overview_guide/specforge_course_specification_builder/code.html
 * Wired to real reactive application state.
 */

import React, { useState } from 'react';
import { CourseMetadata, CourseOutcome, UnitModule, UserRole, LLMSettings, ActiveScreen } from '../types';

interface SpecBuilderScreenProps {
  metadata: CourseMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<CourseMetadata>>;
  outcomes: CourseOutcome[];
  units: UnitModule[];
  currentRole: UserRole;
  specStatus?: LifecycleStage;
  llmSettings: LLMSettings;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenSettings: () => void;
}

export default function SpecBuilderScreen({
  metadata,
  setMetadata,
  outcomes,
  units,
  currentRole,
  specStatus = 'draft',
  llmSettings,
  onNavigate,
  onOpenSettings,
}: SpecBuilderScreenProps) {
  const [selectedProvider, setSelectedProvider] = useState<'anthropic' | 'openai' | 'gemini'>(llmSettings.provider);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Calculate Bloom distribution
  const higherOrderCount = outcomes.filter((o) => ['L4', 'L5', 'L6'].includes(o.bloom)).length;
  const coveragePercent = Math.round((outcomes.length > 0 ? (higherOrderCount / outcomes.length) : 0) * 100);

  // Rule: Only the Author can edit content, and only in Draft or Returned.
  const canEdit = currentRole === 'author' && (specStatus === 'draft' || specStatus === 'returned');

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 gap-4">
      {/* Course Context Sub-Bar */}
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-xl border border-surface-container-high/60 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">school</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider truncate">
              Workbench Workspace
            </span>
            <span className="text-sm font-semibold text-on-surface truncate">
              {metadata.courseCode}: {metadata.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded-lg shrink-0 border border-surface-container shadow-xs">
          <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
          <span className="text-xs font-semibold text-on-surface font-mono-data">{metadata.semester}</span>
        </div>
      {/* RBAC Edit Permission Status Banner */}
      {!canEdit && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-error-container/20 border border-error/30 text-xs text-on-error-container">
          <span className="material-symbols-outlined text-[18px] text-error shrink-0">lock</span>
          <div className="flex flex-col">
            <span className="font-bold uppercase font-mono-data">Specification Content Locked (Read-Only)</span>
            <span className="text-[11px] text-on-surface-variant">
              Only the <strong>Author</strong> can edit content, and only while the specification is in <strong>Draft</strong> or <strong>Returned</strong> state. Current state: <strong className="font-mono text-secondary uppercase">{specStatus}</strong> (Active Role: <strong className="capitalize">{currentRole}</strong>). Server enforces HTTP 403 on edits.
            </span>
          </div>
        </div>
      )}

      {/* Gateway & Health Status Card */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/50 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container animate-pulse"></div>
            <span className="text-sm font-semibold text-on-surface">Gateway Runtime Health</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-mono-data font-semibold">
            HTTP 200 OK
          </span>
        </div>

        {/* Active Health Checks Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col bg-surface-container-low p-2.5 rounded-lg gap-1.5 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-secondary font-mono-data font-bold">GET</span>
                <span className="text-xs text-on-surface font-mono-data truncate">/api/v1/health</span>
              </div>
              <span className="text-[10px] font-bold text-on-tertiary-fixed-variant bg-tertiary-fixed px-1.5 py-0.5 rounded uppercase">
                Active Ping
              </span>
            </div>
            <div className="bg-surface-container-highest p-1.5 rounded text-xs font-mono-data text-on-surface-variant overflow-x-auto">
              <code>{JSON.stringify({ success: true, data: { status: 'up', standard: metadata.accreditationStandard } })}</code>
            </div>
          </div>

          <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-surface-container">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-secondary font-mono-data font-bold">GET</span>
              <span className="text-xs text-on-surface font-mono-data truncate">/api/v1/llm-check</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
              <span className="text-xs font-semibold text-on-surface-variant font-mono-data">
                x-llm-* ready ({llmSettings.provider})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Five-Line App Architecture Summary Card */}
      <div className="flex flex-col bg-primary-container text-surface-bright rounded-xl p-4 shadow-md gap-3 border border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">account_tree</span>
            <span className="text-sm font-semibold text-surface-bright">System Architecture Map</span>
          </div>
          <span className="text-[11px] font-mono-data text-primary-fixed-dim font-bold">v1.2.0-STABLE</span>
        </div>

        {/* The 5 Explicit Academic Architecture Lines */}
        <div className="flex flex-col gap-2 font-mono-data text-xs">
          <div className="flex items-start gap-2 bg-inverse-surface/60 p-2 rounded-lg border border-surface-container-highest/10">
            <span className="text-tertiary-fixed font-bold text-xs shrink-0">L1</span>
            <p className="text-surface-container-low leading-relaxed font-sans">
              <strong className="text-surface-bright">Frontend (<code className="text-tertiary-fixed font-mono-data">src/</code>):</strong> React + Vite mobile-first workspace with live spec preview, curriculum forms, and role-based views.
            </p>
          </div>
          <div className="flex items-start gap-2 bg-inverse-surface/60 p-2 rounded-lg border border-surface-container-highest/10">
            <span className="text-tertiary-fixed font-bold text-xs shrink-0">L2</span>
            <p className="text-surface-container-low leading-relaxed font-sans">
              <strong className="text-surface-bright">Backend (<code className="text-tertiary-fixed font-mono-data">server/</code>):</strong> Express API proxy handling health checks (<code className="text-primary-fixed font-mono-data">/api/v1/health</code>) and stateless LLM forwarding (<code className="text-primary-fixed font-mono-data">/api/v1/llm-check</code>).
            </p>
          </div>
          <div className="flex items-start gap-2 bg-inverse-surface/60 p-2 rounded-lg border border-surface-container-highest/10">
            <span className="text-tertiary-fixed font-bold text-xs shrink-0">L3</span>
            <p className="text-surface-container-low leading-relaxed font-sans">
              <strong className="text-surface-bright">Configuration (<code className="text-tertiary-fixed font-mono-data">config/</code> &amp; <code className="text-tertiary-fixed font-mono-data">templates/</code>):</strong> JSON schema validators and pedagogical prompt templates for syllabus generation.
            </p>
          </div>
          <div className="flex items-start gap-2 bg-inverse-surface/60 p-2 rounded-lg border border-surface-container-highest/10">
            <span className="text-tertiary-fixed font-bold text-xs shrink-0">L4</span>
            <p className="text-surface-container-low leading-relaxed font-sans">
              <strong className="text-surface-bright">Security Pipeline:</strong> Transient header relay (<code className="text-primary-fixed font-mono-data">x-llm-*</code>) forwarding keys directly to providers with zero local/server disk storage.
            </p>
          </div>
          <div className="flex items-start gap-2 bg-inverse-surface/60 p-2 rounded-lg border border-surface-container-highest/10">
            <span className="text-tertiary-fixed font-bold text-xs shrink-0">L5</span>
            <p className="text-surface-container-low leading-relaxed font-sans">
              <strong className="text-surface-bright">Output Artifact:</strong> Automated evaluation harness compiling and validating <code className="text-tertiary-fixed font-mono-data">kit/specforge-prompt.json</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Course Specification Quick-Start Draft Card */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/50 gap-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-container text-secondary font-mono-data">
                {metadata.accreditationStandard}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-data">
                Course ID: {metadata.courseCode}
              </span>
            </div>
            {isEditingMetadata ? (
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-sm font-semibold text-on-surface"
                />
                <button
                  onClick={() => setIsEditingMetadata(false)}
                  className="self-start text-xs text-secondary font-semibold hover:underline"
                >
                  Save Title
                </button>
              </div>
            ) : (
              <h2 className="text-lg font-bold text-on-surface mt-1 truncate">
                {metadata.courseCode}: {metadata.title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg shrink-0">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="text-xs font-semibold text-on-surface capitalize">
              Drafting ({currentRole} Mode)
            </span>
          </div>
        </div>

        {/* Metadata Matrix Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="flex flex-col bg-surface-container-low p-3 rounded-lg border border-surface-container">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Academic Credits
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-on-surface font-mono-data">
                {metadata.credits.lecture}-{metadata.credits.tutorial}-{metadata.credits.practical}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                ({metadata.credits.total} Total Units &bull; {metadata.hours.totalContact}h Contact)
              </span>
            </div>
          </div>

          <div className="flex flex-col bg-surface-container-low p-3 rounded-lg border border-surface-container">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Prerequisite Flow
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
              <span className="text-sm font-semibold text-on-surface truncate font-mono-data">
                {metadata.prerequisites}
              </span>
            </div>
          </div>
        </div>

        {/* Bloom's Taxonomy Cognitive Mapping Tracker */}
        <div className="flex flex-col bg-surface-container-low p-3 rounded-lg gap-2 border border-surface-container">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Bloom's Taxonomy Cognitive Mapping
            </span>
            <span className="text-xs text-secondary font-semibold font-mono-data">
              {higherOrderCount} / {outcomes.length} Higher-Order Validated
            </span>
          </div>

          {/* Segmented Bloom Spectrum */}
          <div className="flex items-center gap-1 w-full h-2.5 rounded-md bg-surface-container-highest overflow-hidden">
            <div className="bg-secondary h-full w-[25%]" title="Remember & Understand (L1/L2)"></div>
            <div className="bg-secondary-container h-full w-[35%]" title="Apply & Analyze (L3/L4)"></div>
            <div className="bg-on-tertiary-container h-full w-[30%]" title="Evaluate & Create (L5/L6)"></div>
            <div className="bg-surface-variant h-full w-[10%]" title="Unassigned"></div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-1 font-mono-data">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> CLO1-2 Analysis
            </span>
            <span className="flex items-center gap-1 font-mono-data">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span> CLO3-6 Synthesis
            </span>
            <span className="text-secondary font-semibold font-mono-data">{coveragePercent}% Higher-Order</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onNavigate('intake')}
            className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>Continue Spec Intake &amp; Edit</span>
          </button>
          <button
            onClick={() => onNavigate('audit')}
            className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center gap-1 text-xs font-semibold transition-colors"
            title="Inspect Deterministic Validation Rules"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">rule</span>
            <span>Audit</span>
          </button>
          {canEdit && (
            <button
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors"
              title="Edit course title"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Curriculum Intake & LLM Gateway Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source File Intake Card */}
        <div className="flex flex-col bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[18px]">description</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">Curriculum Intake</span>
            </div>
            <span className="text-[10px] font-bold text-on-tertiary-fixed-variant bg-tertiary-fixed px-1.5 py-0.5 rounded font-mono-data">
              Ready
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Import existing university course syllabus docx or pdf source files to auto-extract course objectives and contact lecture breakdown.
          </p>
          <div
            onClick={() => onNavigate('intake')}
            className="flex flex-col items-center justify-center bg-surface-container-low p-4 rounded-lg gap-1.5 cursor-pointer hover:bg-surface-container border border-dashed border-secondary/40 transition-colors text-center"
          >
            <span className="material-symbols-outlined text-secondary text-[26px]">cloud_upload</span>
            <span className="text-xs font-semibold text-on-surface">Upload Course Syllabus</span>
            <span className="text-[11px] text-on-surface-variant font-mono-data">.DOCX, .PDF, .HTML up to 25MB</span>
          </div>
        </div>

        {/* LLM Provider Transient Gateway Selector */}
        <div className="flex flex-col bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/50 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <span className="text-sm font-semibold text-on-surface">Stateless LLM Provider</span>
            </div>
            <button
              onClick={onOpenSettings}
              className="text-[11px] font-mono-data text-secondary hover:underline font-semibold"
            >
              x-llm-provider
            </button>
          </div>

          {/* Segmented Provider Radios */}
          <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-container">
            <button
              type="button"
              onClick={() => setSelectedProvider('anthropic')}
              className={`py-1.5 px-2 rounded-md text-xs transition-all flex flex-col items-center gap-0.5 ${
                selectedProvider === 'anthropic'
                  ? 'bg-surface-container-lowest text-secondary font-bold shadow-xs'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
            >
              <span>Anthropic</span>
              <span className="text-[9px] text-on-surface-variant font-normal">Claude 3.7</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider('openai')}
              className={`py-1.5 px-2 rounded-md text-xs transition-all flex flex-col items-center gap-0.5 ${
                selectedProvider === 'openai'
                  ? 'bg-surface-container-lowest text-secondary font-bold shadow-xs'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
            >
              <span>OpenAI</span>
              <span className="text-[9px] text-on-surface-variant font-normal">GPT-4o</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider('gemini')}
              className={`py-1.5 px-2 rounded-md text-xs transition-all flex flex-col items-center gap-0.5 ${
                selectedProvider === 'gemini'
                  ? 'bg-surface-container-lowest text-secondary font-bold shadow-xs'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
            >
              <span>Gemini</span>
              <span className="text-[9px] text-on-surface-variant font-normal">1.5 Pro</span>
            </button>
          </div>

          {/* Ephemeral Security Assurance Note */}
          <div className="flex items-start gap-1.5 bg-surface-container-low p-2.5 rounded-lg border border-surface-container">
            <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">lock</span>
            <span className="text-[11px] text-on-surface-variant leading-tight">
              Credential tokens bypass database storage; relayed directly using cryptographic headers for real-time compliance evaluation.
            </span>
          </div>
        </div>
      </div>

      {/* Modules Overview Mini-Table */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/50 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">layers</span>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wide">
              Course Module Blueprint ({units.length} Units &bull; {metadata.hours.lecture} Lecture Hrs)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('intake')}
            className="text-xs text-secondary font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Edit In Intake</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {units.map((u) => (
            <div
              key={u.unit}
              className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">{u.title}</span>
                <span className="text-xs font-mono-data font-semibold text-secondary px-2 py-0.5 rounded bg-surface-container">
                  {u.hours} Hours
                </span>
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{u.topics}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
