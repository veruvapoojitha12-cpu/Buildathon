/**
 * SpecForge Specification & Blueprint Upload Intake Screen
 * 
 * Features:
 * - Dual file upload:
 *     1. Existing Course Specification (Required): .docx, .pdf, .html, .doc
 *     2. Question-Paper Blueprint (Optional): .docx, .pdf, .html, .doc
 * - Dispatches multipart/form-data to POST /api/v1/parse
 * - Extracts text & tables on server via mammoth, pdf-parse, cheerio, word-extractor
 * - Calls generateJson from server/llm.ts
 * - Validates result with Zod
 * - Collapsible JSON panel displaying verified AST
 * - Full editable form for main fields:
 *     Course Code, Title, Dept, Credits (L:T:P), Course Type,
 *     Course Outcomes (with leading verb & Bloom's level),
 *     Units (title, content, hours),
 *     CO-PO Map, Teaching-Hours Table, Assessment Table, Resources.
 */

import React, { useState, useRef } from 'react';
import {
  CourseMetadata,
  CourseOutcome,
  UnitModule,
  MatrixCellRationale,
  UserRole,
  ActiveScreen,
  BloomLevel,
} from '../types';
import { parseSyllabusFiles } from '../api';

interface SpecificationUploadIntakeScreenProps {
  metadata: CourseMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<CourseMetadata>>;
  outcomes: CourseOutcome[];
  setOutcomes: React.Dispatch<React.SetStateAction<CourseOutcome[]>>;
  units: UnitModule[];
  setUnits: React.Dispatch<React.SetStateAction<UnitModule[]>>;
  rationales: MatrixCellRationale[];
  currentRole: UserRole;
  onNavigate: (screen: ActiveScreen) => void;
}

export interface ParsedSpecData {
  courseCode: string;
  title: string;
  department: string;
  credits: string; // e.g. "3:1:0"
  courseType: string;
  courseOutcomes: Array<{
    id: string;
    verb: string;
    bloomLevel: string;
    description: string;
  }>;
  units: Array<{
    unit: number | string;
    title: string;
    content: string;
    hours: number | string;
  }>;
  coPoMap: Array<{
    coId: string;
    mappings: Record<string, number | string>;
  }>;
  teachingHoursTable: Array<{
    unit: string | number;
    lectureHours?: number | string;
    tutorialHours?: number | string;
    practicalHours?: number | string;
    totalHours: number | string;
  }>;
  assessmentTable: Array<{
    component: string;
    marksOrWeight: number | string;
    category?: string;
  }>;
  resources: string[];
  blueprintSummary?: string;
}

export default function SpecificationUploadIntakeScreen({
  metadata,
  setMetadata,
  outcomes,
  setOutcomes,
  units,
  setUnits,
  currentRole,
  onNavigate,
}: SpecificationUploadIntakeScreenProps) {
  // File upload state
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [specDragActive, setSpecDragActive] = useState<boolean>(false);
  const [blueprintDragActive, setBlueprintDragActive] = useState<boolean>(false);

  const specInputRef = useRef<HTMLInputElement>(null);
  const blueprintInputRef = useRef<HTMLInputElement>(null);

  // Parsing & UI state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    source: string;
    specName: string;
    blueprintName?: string;
    textChars: number;
  } | null>(null);

  // Parsed structured data
  const [parsedData, setParsedData] = useState<ParsedSpecData>(() => ({
    courseCode: metadata.courseCode || 'CS304',
    title: metadata.title || 'Advanced Algorithms and Complexity Analysis',
    department: metadata.department || 'Computer Science and Engineering',
    credits: `${metadata.credits.lecture}:${metadata.credits.tutorial}:${metadata.credits.practical}`,
    courseType: metadata.classification || 'Professional Core',
    courseOutcomes: outcomes.map((o) => ({
      id: o.id,
      verb: o.verb || 'Analyze',
      bloomLevel: o.bloom || 'L4',
      description: o.description,
    })),
    units: units.map((u) => ({
      unit: u.unit,
      title: u.title,
      content: u.topics,
      hours: u.hours,
    })),
    coPoMap: outcomes.map((o) => {
      const mapObj: Record<string, number> = {};
      for (let i = 1; i <= 12; i++) {
        mapObj[`PO${i}`] = i <= 3 ? 3 : i <= 5 ? 2 : 0;
      }
      mapObj['PSO1'] = 3;
      mapObj['PSO2'] = 2;
      mapObj['PSO3'] = 1;
      return { coId: o.id, mappings: mapObj };
    }),
    teachingHoursTable: units.map((u) => ({
      unit: u.unit,
      lectureHours: typeof u.hours === 'number' ? Math.max(1, u.hours - 2) : 7,
      tutorialHours: 2,
      practicalHours: 0,
      totalHours: u.hours,
    })),
    assessmentTable: [
      { component: 'Continuous Internal Assessment (CIA-1)', marksOrWeight: metadata.evaluation.cia / 2, category: 'CIA' },
      { component: 'Continuous Internal Assessment (CIA-2)', marksOrWeight: metadata.evaluation.cia / 2, category: 'CIA' },
      { component: 'End Semester Examination (ESE)', marksOrWeight: metadata.evaluation.ese, category: 'ESE' },
    ],
    resources: metadata.prescribedLiterature.map(
      (lit) => `${lit.title} - ${lit.authors} (${lit.publisher}, ${lit.year})`
    ),
    blueprintSummary: undefined,
  }));

  const [isJsonOpen, setIsJsonOpen] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<boolean>(false);

  const canEdit = currentRole === 'author' || currentRole === 'hod';

  // Allowed file extensions
  const ALLOWED_EXTS = ['.docx', '.pdf', '.html', '.htm', '.doc'];

  const isValidFile = (file: File) => {
    const name = file.name.toLowerCase();
    return ALLOWED_EXTS.some((ext) => name.endsWith(ext));
  };

  // Spec File selection
  const handleSpecFileSelect = (file: File) => {
    if (!isValidFile(file)) {
      setErrorMessage(`Invalid file format for "${file.name}". Please upload .docx, .pdf, .html, or .doc.`);
      return;
    }
    setSpecFile(file);
    setErrorMessage(null);
  };

  // Blueprint File selection
  const handleBlueprintFileSelect = (file: File) => {
    if (!isValidFile(file)) {
      setErrorMessage(`Invalid file format for "${file.name}". Please upload .docx, .pdf, .html, or .doc.`);
      return;
    }
    setBlueprintFile(file);
    setErrorMessage(null);
  };

  // Drag & drop handlers for Spec
  const handleSpecDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setSpecDragActive(true);
    } else if (e.type === 'dragleave') {
      setSpecDragActive(false);
    }
  };

  const handleSpecDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSpecDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSpecFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Drag & drop handlers for Blueprint
  const handleBlueprintDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setBlueprintDragActive(true);
    } else if (e.type === 'dragleave') {
      setBlueprintDragActive(false);
    }
  };

  const handleBlueprintDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBlueprintDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBlueprintFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Quick Sample Loader
  const handleLoadSample = () => {
    const sampleHtmlContent = `<!DOCTYPE html>
<html>
<head><title>CS304 Course Specification</title></head>
<body>
  <h1>CS304 Advanced Algorithms and Complexity Analysis</h1>
  <p><strong>Department:</strong> Department of Computer Science and Engineering</p>
  <p><strong>Credits:</strong> 3:1:0</p>
  <p><strong>Course Type:</strong> Professional Core</p>

  <h2>Course Outcomes (COs)</h2>
  <p><strong>CO1:</strong> Analyze asymptotic complexity and worst-case resource bounds of algorithmic paradigms.</p>
  <p><strong>CO2:</strong> Design divide-and-conquer, greedy, and dynamic programming algorithms for combinatorial problems.</p>
  <p><strong>CO3:</strong> Formulate network flow and bipartite matching formulations for real-world constraints.</p>
  <p><strong>CO4:</strong> Evaluate tractability of computational problems using NP-Completeness reductions.</p>
  <p><strong>CO5:</strong> Construct approximation and randomized algorithms for intractable optimization problems.</p>

  <h2>Units Breakdown</h2>
  <h3>Unit I: Divide & Conquer and Recurrences (9 Hours)</h3>
  <p>Master theorem, substitution methods, Akra-Bazzi method, median-of-medians linear selection.</p>

  <h3>Unit II: Dynamic Programming & Greedy Heuristics (9 Hours)</h3>
  <p>Optimal substructure, memoization, matrix chain multiplication, Huffman coding, matroid theory.</p>

  <h3>Unit III: Network Flow & Matching (9 Hours)</h3>
  <p>Ford-Fulkerson algorithm, Edmonds-Karp, max-flow min-cut theorem, bipartite matching, push-relabel.</p>

  <h3>Unit IV: NP-Completeness & Reductions (9 Hours)</h3>
  <p>Polynomial-time verifiers, Cook-Levin theorem, 3-SAT, Vertex Cover, Clique, and Hamiltonian Cycle reductions.</p>

  <h3>Unit V: Approximation & Randomized Algorithms (9 Hours)</h3>
  <p>Metric TSP, set cover approximation factor, randomized Quicksort, Las Vegas vs Monte Carlo algorithms.</p>

  <h2>Prescribed Literature</h2>
  <p>1. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2022). Introduction to Algorithms (4th ed.). MIT Press.</p>
  <p>2. Kleinberg, J., & Tardos, É. (2013). Algorithm Design. Pearson Education.</p>
  <p>3. Aho, A. V., Hopcroft, J. E., & Ullman, J. D. (1983). Data Structures and Algorithms. Addison-Wesley.</p>
</body>
</html>`;

    const blob = new Blob([sampleHtmlContent], { type: 'text/html' });
    const sampleFile = new File([blob], 'CS304_Advanced_Algorithms.html', { type: 'text/html' });
    setSpecFile(sampleFile);
    setErrorMessage(null);
  };

  // Execute Parse API Request
  const handleParseSubmit = async () => {
    if (!specFile) {
      setErrorMessage('Please upload a course specification document (.docx, .pdf, .html, or .doc). This field is required.');
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const res = await parseSyllabusFiles(specFile, blueprintFile);

      if (!res.success) {
        setErrorMessage(res.error || 'Parsing failed on the server.');
        setIsParsing(false);
        return;
      }

      if (res.data) {
        setParsedData(res.data);
        setSuccessInfo({
          source: res.source === 'ai' ? 'AI Inference Gateway (Zod Validated)' : 'Deterministic Parser (Zod Validated)',
          specName: res.meta?.specFilename || specFile.name,
          blueprintName: res.meta?.blueprintFilename,
          textChars: res.meta?.textChars || 0,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while communicating with /api/v1/parse.');
    } finally {
      setIsParsing(false);
    }
  };

  // Copy JSON handler
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(parsedData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${parsedData.courseCode || 'course'}_spec_ast.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Sync back to master app state
  const handleSyncToSpecBuilder = () => {
    // Parse credits L:T:P
    const creditParts = parsedData.credits.split(':').map((p) => parseInt(p, 10) || 0);
    const lectureCredits = creditParts[0] ?? 3;
    const tutorialCredits = creditParts[1] ?? 0;
    const practicalCredits = creditParts[2] ?? 0;
    const totalCredits = lectureCredits + tutorialCredits + practicalCredits;

    // Update metadata
    setMetadata((prev) => ({
      ...prev,
      courseCode: parsedData.courseCode,
      title: parsedData.title,
      department: parsedData.department,
      classification: parsedData.courseType,
      credits: {
        lecture: lectureCredits,
        tutorial: tutorialCredits,
        practical: practicalCredits,
        total: totalCredits,
      },
      evaluation: {
        cia: (parsedData.assessmentTable
          .filter((a) => a.category === 'CIA' || a.component.includes('CIA'))
          .reduce((sum, a) => sum + (Number(a.marksOrWeight) || 0), 0)) || 50,
        ese: (parsedData.assessmentTable
          .filter((a) => a.category === 'ESE' || a.component.includes('ESE'))
          .reduce((sum, a) => sum + (Number(a.marksOrWeight) || 0), 0)) || 50,
      },
    }));

    // Update outcomes
    if (parsedData.courseOutcomes && parsedData.courseOutcomes.length > 0) {
      const bloomTitleMap: Record<string, string> = {
        L1: 'L1 - Remember',
        L2: 'L2 - Understand',
        L3: 'L3 - Apply',
        L4: 'L4 - Analyze',
        L5: 'L5 - Evaluate',
        L6: 'L6 - Create',
      };
      setOutcomes(
        parsedData.courseOutcomes.map((co) => ({
          id: co.id,
          verb: co.verb,
          bloom: (co.bloomLevel as BloomLevel) || 'L4',
          bloomTitle: bloomTitleMap[co.bloomLevel] || `${co.bloomLevel} - ${co.verb}`,
          description: co.description,
        }))
      );
    }

    // Update units
    if (parsedData.units && parsedData.units.length > 0) {
      setUnits(
        parsedData.units.map((u, i) => ({
          unit: Number(u.unit) || i + 1,
          title: u.title,
          hours: Number(u.hours) || 9,
          topics: u.content,
        }))
      );
    }

    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2500);
  };

  // Editable form mutations
  const updateOutcome = (index: number, field: string, val: string) => {
    const updated = [...parsedData.courseOutcomes];
    updated[index] = { ...updated[index], [field]: val };
    setParsedData({ ...parsedData, courseOutcomes: updated });
  };

  const addOutcome = () => {
    const nextNum = parsedData.courseOutcomes.length + 1;
    const newCo = {
      id: `CO${nextNum}`,
      verb: 'Analyze',
      bloomLevel: 'L4',
      description: 'Analyze emerging computational complexity and optimization principles.',
    };
    setParsedData({
      ...parsedData,
      courseOutcomes: [...parsedData.courseOutcomes, newCo],
    });
  };

  const removeOutcome = (index: number) => {
    const updated = parsedData.courseOutcomes.filter((_, i) => i !== index);
    setParsedData({ ...parsedData, courseOutcomes: updated });
  };

  const updateUnit = (index: number, field: string, val: any) => {
    const updated = [...parsedData.units];
    updated[index] = { ...updated[index], [field]: val };
    setParsedData({ ...parsedData, units: updated });
  };

  const addUnit = () => {
    const nextNum = parsedData.units.length + 1;
    const newUnit = {
      unit: nextNum,
      title: `Unit ${nextNum}: Advanced Contemporary Topics`,
      content: 'Parallel algorithms, GPU computing models, distributed state machines.',
      hours: 9,
    };
    setParsedData({
      ...parsedData,
      units: [...parsedData.units, newUnit],
    });
  };

  const removeUnit = (index: number) => {
    const updated = parsedData.units.filter((_, i) => i !== index);
    setParsedData({ ...parsedData, units: updated });
  };

  const updateCoPoCell = (coIndex: number, poKey: string, val: number) => {
    const updated = [...parsedData.coPoMap];
    if (updated[coIndex]) {
      updated[coIndex] = {
        ...updated[coIndex],
        mappings: {
          ...updated[coIndex].mappings,
          [poKey]: val,
        },
      };
      setParsedData({ ...parsedData, coPoMap: updated });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* Title & Guide Banner */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-xs border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider font-mono-data">
              Intake & Parsing Engine
            </span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold">
              Zod AST Validated
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            Course Specification & Question-Paper Intake
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Upload an existing course specification document (required) and an optional question-paper blueprint.
            The server extracts text & tables using <code className="font-mono text-secondary">mammoth</code>,{' '}
            <code className="font-mono text-secondary">pdf-parse</code>,{' '}
            <code className="font-mono text-secondary">cheerio</code>, and{' '}
            <code className="font-mono text-secondary">word-extractor</code>, validates the generated AST via Zod, and hydrates the editable specification below.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 transition-colors border border-outline-variant/40"
            title="Load sample HTML syllabus for instant testing"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">description</span>
            <span>Load Sample Syllabus</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
          <div className="flex flex-col text-xs">
            <span className="font-bold">Extraction Error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-error hover:opacity-80"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successInfo && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 text-emerald-600">
            check_circle
          </span>
          <div className="flex flex-col text-xs leading-relaxed">
            <span className="font-bold">Document Successfully Parsed & Validated</span>
            <span>
              Extracted from <strong className="font-semibold">{successInfo.specName}</strong>
              {successInfo.blueprintName && (
                <> and blueprint <strong className="font-semibold">{successInfo.blueprintName}</strong></>
              )}
              {' '}via <span className="font-mono-data font-semibold">{successInfo.source}</span> ({successInfo.textChars.toLocaleString()} characters processed).
            </span>
          </div>
          <button
            onClick={() => setSuccessInfo(null)}
            className="ml-auto text-emerald-700 hover:opacity-80"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Upload Zone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Course Specification File (Required) */}
        <div
          onDragEnter={handleSpecDrag}
          onDragOver={handleSpecDrag}
          onDragLeave={handleSpecDrag}
          onDrop={handleSpecDrop}
          className={`relative rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
            specDragActive
              ? 'border-primary bg-primary/5'
              : specFile
              ? 'border-secondary/60 bg-surface-container-lowest'
              : 'border-dashed border-outline-variant hover:border-secondary/60 bg-surface-container-lowest'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono-data text-xs font-bold">
                1
              </span>
              <h3 className="text-sm font-bold text-on-surface">Course Specification Document</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
              Required
            </span>
          </div>

          <input
            ref={specInputRef}
            type="file"
            accept=".docx,.pdf,.html,.htm,.doc"
            onChange={(e) => e.target.files?.[0] && handleSpecFileSelect(e.target.files[0])}
            className="hidden"
          />

          {specFile ? (
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-secondary text-[24px] shrink-0">
                  article
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-on-surface truncate">
                    {specFile.name}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono-data">
                    {(specFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {specFile.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSpecFile(null)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                title="Remove file"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => specInputRef.current?.click()}
              className="py-8 flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary group-hover:scale-105 transition-transform mb-2">
                <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
              </div>
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Drop course syllabus here, or click to browse
              </span>
              <span className="text-[11px] text-on-surface-variant mt-1 font-mono-data">
                Accepts: .docx, .pdf, .html, .doc (up to 25MB)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-surface-container">
            <span>Parser: Mammoth (.docx), PDF-Parse (.pdf), Cheerio (.html), WordExtractor (.doc)</span>
            {specFile && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ready
              </span>
            )}
          </div>
        </div>

        {/* 2. Question-Paper Blueprint File (Optional) */}
        <div
          onDragEnter={handleBlueprintDrag}
          onDragOver={handleBlueprintDrag}
          onDragLeave={handleBlueprintDrag}
          onDrop={handleBlueprintDrop}
          className={`relative rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
            blueprintDragActive
              ? 'border-primary bg-primary/5'
              : blueprintFile
              ? 'border-secondary/60 bg-surface-container-lowest'
              : 'border-dashed border-outline-variant hover:border-secondary/60 bg-surface-container-lowest'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-surface-container text-on-surface-variant flex items-center justify-center font-mono-data text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-bold text-on-surface">Question-Paper Blueprint</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Optional
            </span>
          </div>

          <input
            ref={blueprintInputRef}
            type="file"
            accept=".docx,.pdf,.html,.htm,.doc"
            onChange={(e) => e.target.files?.[0] && handleBlueprintFileSelect(e.target.files[0])}
            className="hidden"
          />

          {blueprintFile ? (
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-secondary text-[24px] shrink-0">
                  assignment
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-on-surface truncate">
                    {blueprintFile.name}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono-data">
                    {(blueprintFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {blueprintFile.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlueprintFile(null)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                title="Remove file"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => blueprintInputRef.current?.click()}
              className="py-8 flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:scale-105 transition-transform mb-2">
                <span className="material-symbols-outlined text-[28px]">quiz</span>
              </div>
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Drop question-paper blueprint (optional)
              </span>
              <span className="text-[11px] text-on-surface-variant mt-1 font-mono-data">
                Accepts: .docx, .pdf, .html, .doc
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-surface-container">
            <span>Extracts Bloom level quotas & mark distributions</span>
            {blueprintFile && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Attached
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Parse Trigger Button */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-secondary">memory</span>
          <span>Calls <code className="font-mono font-semibold text-on-surface">POST /api/v1/parse</code> with multipart payload and transient LLM headers</span>
        </div>

        <button
          type="button"
          onClick={handleParseSubmit}
          disabled={isParsing || !specFile}
          className={`h-10 px-6 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm ${
            isParsing || !specFile
              ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-60'
              : 'bg-primary hover:bg-primary-container text-on-primary active:scale-98'
          }`}
        >
          {isParsing ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
              <span>Extracting & Validating AST...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Parse Course Specification</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible JSON Panel (Zod Validated) */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsJsonOpen(!isJsonOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-surface-container-low/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">data_object</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface">
                  Structured Specification AST Output
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono-data text-[10px] font-bold">
                  Zod Validated
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Full JSON payload conforming to CourseSpecZodSchema
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-on-surface-variant font-mono-data hidden sm:inline">
              ~{(JSON.stringify(parsedData).length / 1024).toFixed(1)} KB
            </span>
            <span
              className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                isJsonOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {isJsonOpen && (
          <div className="p-4 sm:p-5 pt-0 border-t border-surface-container flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 pt-3">
              <span className="text-xs font-mono-data text-on-surface-variant">
                Output Format: JSON Schema Object (Validated via Zod)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedJson ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono-data text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800 selection:bg-slate-700">
              <code>{JSON.stringify(parsedData, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Main Fields in an Editable Form */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">edit_document</span>
            <h3 className="text-base font-bold text-on-surface">Extracted Specification Form (Editable)</h3>
          </div>
          <span className="text-xs text-on-surface-variant">
            All fields below are fully editable and synchronize into the master SpecBuilder.
          </span>
        </div>

        {/* 1. Core Metadata Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
            1. Core Course Metadata
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                Course Code
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={parsedData.courseCode}
                onChange={(e) => setParsedData({ ...parsedData, courseCode: e.target.value })}
                className="h-9 px-3 rounded-lg bg-surface-container border border-surface-container-high text-xs font-mono-data font-bold text-on-surface focus:outline-none focus:border-secondary"
                placeholder="e.g. CS304"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                Course Title
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={parsedData.title}
                onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
                className="h-9 px-3 rounded-lg bg-surface-container border border-surface-container-high text-xs font-semibold text-on-surface focus:outline-none focus:border-secondary"
                placeholder="e.g. Advanced Algorithms and Complexity Analysis"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                Credits (L:T:P)
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={parsedData.credits}
                onChange={(e) => setParsedData({ ...parsedData, credits: e.target.value })}
                className="h-9 px-3 rounded-lg bg-surface-container border border-surface-container-high text-xs font-mono-data font-bold text-on-surface focus:outline-none focus:border-secondary text-center"
                placeholder="3:1:0"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                Department / School
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={parsedData.department}
                onChange={(e) => setParsedData({ ...parsedData, department: e.target.value })}
                className="h-9 px-3 rounded-lg bg-surface-container border border-surface-container-high text-xs font-medium text-on-surface focus:outline-none focus:border-secondary"
                placeholder="Department of Computer Science and Engineering"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                Course Type
              </label>
              <select
                disabled={!canEdit}
                value={parsedData.courseType}
                onChange={(e) => setParsedData({ ...parsedData, courseType: e.target.value })}
                className="h-9 px-3 rounded-lg bg-surface-container border border-surface-container-high text-xs font-medium text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
              >
                <option value="Professional Core">Professional Core</option>
                <option value="Professional Elective">Professional Elective</option>
                <option value="Open Elective">Open Elective</option>
                <option value="Laboratory Course">Laboratory Course</option>
                <option value="Project / Capstone">Project / Capstone</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Course Outcomes (COs) with Leading Verb and Bloom's Level */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
                2. Course Outcomes ({parsedData.courseOutcomes.length})
              </h4>
              <span className="text-[11px] text-on-surface-variant">
                Enforcing Bloom's taxonomy action verbs and cognitive levels
              </span>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={addOutcome}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Outcome</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {parsedData.courseOutcomes.map((co, idx) => (
              <div
                key={co.id || idx}
                className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex items-center gap-2 sm:w-48 shrink-0">
                  <span className="px-2.5 py-1 rounded-md bg-secondary text-on-secondary font-mono-data text-xs font-bold shrink-0">
                    {co.id}
                  </span>

                  <input
                    type="text"
                    disabled={!canEdit}
                    value={co.verb}
                    onChange={(e) => updateOutcome(idx, 'verb', e.target.value)}
                    className="w-24 h-8 px-2 rounded-md bg-surface-container border border-surface-container-high text-xs font-bold text-on-surface focus:outline-none focus:border-secondary"
                    placeholder="Verb"
                    title="Leading Bloom Verb"
                  />

                  <select
                    disabled={!canEdit}
                    value={co.bloomLevel}
                    onChange={(e) => updateOutcome(idx, 'bloomLevel', e.target.value)}
                    className="h-8 px-1.5 rounded-md bg-surface-container border border-surface-container-high text-xs font-mono-data font-bold text-on-surface focus:outline-none focus:border-secondary"
                    title="Bloom Cognitive Level"
                  >
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="L4">L4</option>
                    <option value="L5">L5</option>
                    <option value="L6">L6</option>
                  </select>
                </div>

                <textarea
                  disabled={!canEdit}
                  rows={2}
                  value={co.description}
                  onChange={(e) => updateOutcome(idx, 'description', e.target.value)}
                  className="flex-1 text-xs bg-surface-container-lowest border border-outline-variant/40 p-2.5 rounded-lg text-on-surface resize-none focus:outline-none focus:border-secondary font-sans leading-relaxed"
                  placeholder="Course outcome statement..."
                />

                {canEdit && parsedData.courseOutcomes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(idx)}
                    className="w-8 h-8 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center shrink-0 transition-colors self-center sm:self-start"
                    title="Remove Outcome"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Units Breakdown (Title, Content, Hours) */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
                3. Units Breakdown ({parsedData.units.length} Modules)
              </h4>
              <span className="text-[11px] text-on-surface-variant font-mono-data">
                Total:{' '}
                {parsedData.units.reduce((sum, u) => sum + (Number(u.hours) || 0), 0)} Contact Hours
              </span>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={addUnit}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Unit</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {parsedData.units.map((unit, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={unit.title}
                    onChange={(e) => updateUnit(idx, 'title', e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded-md bg-surface-container border border-surface-container-high text-xs font-bold text-on-surface focus:outline-none focus:border-secondary"
                    placeholder="Unit Title (e.g. Unit I: Algorithmic Foundations)"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={unit.hours}
                      onChange={(e) => updateUnit(idx, 'hours', parseInt(e.target.value) || 0)}
                      className="w-14 h-8 text-center rounded-md bg-surface-container border border-surface-container-high text-xs font-mono-data font-bold text-on-surface focus:outline-none focus:border-secondary"
                    />
                    <span className="text-xs font-medium text-on-surface-variant">hrs</span>
                  </div>

                  {canEdit && parsedData.units.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUnit(idx)}
                      className="w-8 h-8 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center shrink-0 transition-colors"
                      title="Remove Unit"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>

                <textarea
                  disabled={!canEdit}
                  rows={2}
                  value={unit.content}
                  onChange={(e) => updateUnit(idx, 'content', e.target.value)}
                  className="w-full text-xs bg-surface-container-lowest border border-outline-variant/40 p-2.5 rounded-lg text-on-surface resize-none focus:outline-none focus:border-secondary font-sans leading-relaxed"
                  placeholder="Syllabus topics and key competencies..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4. CO-PO Alignment Matrix Table */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
              4. CO-PO-PSO Alignment Correlation Table
            </h4>
            <span className="text-[11px] text-on-surface-variant font-mono-data">
              Strengths: 3 (Substantial), 2 (Moderate), 1 (Slight), 0 (No correlation)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-surface-container text-center">
              <thead className="bg-surface-container-low font-mono-data">
                <tr>
                  <th className="p-2 border border-surface-container text-left font-bold">CO</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                    <th key={p} className="p-1.5 border border-surface-container font-semibold">
                      PO{p}
                    </th>
                  ))}
                  <th className="p-1.5 border border-surface-container font-semibold">PSO1</th>
                  <th className="p-1.5 border border-surface-container font-semibold">PSO2</th>
                  <th className="p-1.5 border border-surface-container font-semibold">PSO3</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.coPoMap.map((row, rIdx) => (
                  <tr key={row.coId} className="hover:bg-surface-container-low/40">
                    <td className="p-2 border border-surface-container text-left font-mono-data font-bold text-secondary">
                      {row.coId}
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => {
                      const key = `PO${p}`;
                      const val = Number(row.mappings[key]) || 0;
                      return (
                        <td key={p} className="p-1 border border-surface-container">
                          <input
                            type="number"
                            min="0"
                            max="3"
                            disabled={!canEdit}
                            value={val}
                            onChange={(e) =>
                              updateCoPoCell(rIdx, key, Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))
                            }
                            className="w-8 h-7 text-center rounded bg-surface-container font-mono-data text-xs font-bold focus:outline-none focus:bg-surface-container-high"
                          />
                        </td>
                      );
                    })}
                    {['PSO1', 'PSO2', 'PSO3'].map((pso) => {
                      const val = Number(row.mappings[pso]) || 0;
                      return (
                        <td key={pso} className="p-1 border border-surface-container">
                          <input
                            type="number"
                            min="0"
                            max="3"
                            disabled={!canEdit}
                            value={val}
                            onChange={(e) =>
                              updateCoPoCell(rIdx, pso, Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))
                            }
                            className="w-8 h-7 text-center rounded bg-surface-container font-mono-data text-xs font-bold focus:outline-none focus:bg-surface-container-high"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Teaching-Hours Table & Assessment Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Teaching Hours Table */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
              5. Teaching-Hours Breakdown Table
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-surface-container text-center">
                <thead className="bg-surface-container-low font-mono-data">
                  <tr>
                    <th className="p-2 border border-surface-container text-left">Unit</th>
                    <th className="p-2 border border-surface-container">Lecture</th>
                    <th className="p-2 border border-surface-container">Tutorial</th>
                    <th className="p-2 border border-surface-container">Practical</th>
                    <th className="p-2 border border-surface-container font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.teachingHoursTable.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/40">
                      <td className="p-2 border border-surface-container text-left font-mono-data font-bold">
                        Unit {row.unit}
                      </td>
                      <td className="p-2 border border-surface-container font-mono-data">
                        {row.lectureHours || 7}h
                      </td>
                      <td className="p-2 border border-surface-container font-mono-data">
                        {row.tutorialHours || 2}h
                      </td>
                      <td className="p-2 border border-surface-container font-mono-data text-on-surface-variant">
                        {row.practicalHours || 0}h
                      </td>
                      <td className="p-2 border border-surface-container font-mono-data font-bold text-secondary">
                        {row.totalHours || 9}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assessment Table */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
              6. Assessment & Evaluation Table
            </h4>

            <div className="flex flex-col gap-2">
              {parsedData.assessmentTable.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">{item.component}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono-data uppercase">
                      Category: {item.category || 'CIA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono-data">
                    <span className="text-sm font-bold text-secondary">
                      {item.marksOrWeight}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Prescribed Resources */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wider font-mono-data">
            7. Prescribed Literature & Textbooks ({parsedData.resources.length})
          </h4>

          <div className="flex flex-col gap-2">
            {parsedData.resources.map((res, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                  menu_book
                </span>
                <span className="text-xs font-medium text-on-surface leading-relaxed">{res}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blueprint summary notice (if provided) */}
        {parsedData.blueprintSummary && (
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">assignment</span>
            <div className="flex flex-col text-xs leading-relaxed">
              <span className="font-bold">Question-Paper Blueprint Integrated</span>
              <span>{parsedData.blueprintSummary}</span>
            </div>
          </div>
        )}

        {/* Bottom Pinned Action Bar */}
        <div className="sticky bottom-4 z-30 bg-surface/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToSpecBuilder}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>Apply & Hydrate to SpecBuilder</span>
            </button>

            {syncToast && (
              <span className="text-xs text-emerald-600 font-semibold animate-in fade-in flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Specification Synchronized!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('matrix')}
              className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>CO-PO Alignment</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('export')}
              className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Export Dossier</span>
              <span className="material-symbols-outlined text-[16px]">print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
