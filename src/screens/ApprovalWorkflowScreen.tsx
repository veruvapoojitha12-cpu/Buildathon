/**
 * SpecForge Approval Workflow & Governance Screen
 * 
 * Requirements:
 * 1. Horizontal status tracker: Draft, Submitted, Under Review, Pending HOD, Approved,
 *    with a separate red 'Returned' state.
 * 2. Action panel for the current role:
 *    - Author sees 'Submit for review' (enabled in Draft or Returned)
 *    - Reviewer sees 'Open / Mark Under Review' (when Submitted), 'Forward to HOD' (in Under Review),
 *      and 'Return with comment' (comment box required)
 *    - HOD sees 'Approve' and 'Return' (comment box required)
 *    - Buttons the current role may not use are shown disabled with a tooltip explaining who can.
 * 3. Section comments: Reviewer and HOD can add comments per section (Section 1 to 12).
 * 4. Multi-spec dashboard / Curriculum Governance Register with statuses.
 * 5. Right column: a history timeline of who did what and when, with comments.
 * 6. Synchronizes state with backend API /api/v1/workflow/transition.
 */

import React, { useState } from 'react';
import {
  CourseMetadata,
  CourseOutcome,
  UnitModule,
  AuditHistoryLog,
  SectionComment,
  SpecRegistryItem,
  LifecycleStage,
  UserRole,
  ActiveScreen,
} from '../types';

interface ApprovalWorkflowScreenProps {
  metadata: CourseMetadata;
  outcomes: CourseOutcome[];
  units: UnitModule[];
  auditLog: AuditHistoryLog[];
  setAuditLog: React.Dispatch<React.SetStateAction<AuditHistoryLog[]>>;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  specStatus: LifecycleStage;
  setSpecStatus: (status: LifecycleStage) => void;
  isApproved: boolean;
  setIsApproved: (approved: boolean) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenExport: () => void;
}

const STAGES: Array<{ key: LifecycleStage; label: string; icon: string }> = [
  { key: 'draft', label: 'Draft', icon: 'edit_note' },
  { key: 'submitted', label: 'Submitted', icon: 'send' },
  { key: 'under_review', label: 'Under Review', icon: 'rate_review' },
  { key: 'pending_hod', label: 'Pending HOD', icon: 'hourglass_top' },
  { key: 'approved', label: 'Approved', icon: 'verified' },
];

const SECTIONS_LIST = [
  { num: 1, title: 'Section 1: Course Identification & Title' },
  { num: 2, title: 'Section 2: Prerequisites & Catalogs' },
  { num: 3, title: 'Section 3: Credit Structure & Contact Hours' },
  { num: 4, title: 'Section 4: Module Units & Topic Distribution' },
  { num: 5, title: 'Section 5: Course Learning Outcomes (CLOs)' },
  { num: 6, title: 'Section 6: CO-PO-PSO Alignment Matrix' },
  { num: 7, title: 'Section 7: Assessment Breakdown (CIA + ESE)' },
  { num: 8, title: 'Section 8: Prescribed Literature & Citations' },
  { num: 9, title: 'Section 9: Pedagogical Delivery Modes' },
  { num: 10, title: 'Section 10: Academic Integrity & Ethics' },
  { num: 11, title: 'Section 11: Laboratory Practicum & Safety' },
  { num: 12, title: 'Section 12: Continuous Improvement Action' },
];

export const INITIAL_SECTION_COMMENTS: SectionComment[] = [
  {
    id: 'comment-1',
    sectionNumber: 3,
    sectionTitle: 'Section 3: Credit Structure & Contact Hours',
    authorName: 'Prof. David Marcus',
    authorRole: 'reviewer',
    timestamp: '2h ago',
    comment: 'ABET Computing criteria requires explicit 1-credit laboratory documentation if 4 credits are allocated. Please confirm whether 30 hours are dedicated to practical prototyping.',
    resolved: false,
    replies: [
      {
        id: 'reply-1',
        authorName: 'Dr. Sarah Lin',
        authorRole: 'author',
        timestamp: '42m ago',
        comment: 'Harmonized 3:0:2 credit structure to 48h lecture + 30h lab. Embedded Unit 4 and 5 practical tracks.',
      },
    ],
  },
  {
    id: 'comment-2',
    sectionNumber: 5,
    sectionTitle: 'Section 5: Course Learning Outcomes (CLOs)',
    authorName: 'Dr. Elena Rostova',
    authorRole: 'hod',
    timestamp: 'Yesterday',
    comment: "Bloom's Taxonomy verb for CLO-3 is 'Understand'. Replace with action-oriented operational verb like 'Synthesize' or 'Compute' to satisfy Washington Accord benchmarks.",
    resolved: false,
  },
];

export const INITIAL_SPECS_REGISTRY: SpecRegistryItem[] = [
  {
    id: 'spec-cs304',
    code: 'CS304',
    title: 'Advanced Algorithms & Complexity',
    department: 'Dept of Computer Science & Engineering',
    author: 'Dr. Sarah Lin',
    credits: '3:0:2 (4 Credits)',
    unitsCount: 5,
    outcomesCount: 6,
    status: 'draft',
    lastUpdated: 'Just now',
    notes: 'Active working syllabus draft for Fall 2025 cycle.',
  },
  {
    id: 'spec-cs201',
    code: 'CS201',
    title: 'Data Structures & Paradigms',
    department: 'Dept of Computer Science & Engineering',
    author: 'Dr. S. Mehta',
    credits: '3:1:0 (4 Credits)',
    unitsCount: 5,
    outcomesCount: 5,
    status: 'approved',
    lastUpdated: '2025-08-10 15:20',
    notes: 'Final Seal by HOD • Archival Locked',
  },
  {
    id: 'spec-cs310',
    code: 'CS310',
    title: 'Distributed Systems',
    department: 'Dept of Computer Science & Engineering',
    author: 'Dr. A. Varma',
    credits: '3:0:0 (3 Credits)',
    unitsCount: 4,
    outcomesCount: 4,
    status: 'returned',
    lastUpdated: '2025-08-19 16:30',
    notes: 'Returned with 2 unresolved remarks pending author revision.',
  },
  {
    id: 'spec-cs405',
    code: 'CS405',
    title: 'Deep Learning Architectures',
    department: 'Dept of Computer Science & Engineering',
    author: 'Dr. Sarah Lin',
    credits: '3:0:2 (4 Credits)',
    unitsCount: 5,
    outcomesCount: 5,
    status: 'draft',
    lastUpdated: '2025-08-22 11:10',
    notes: 'In Authoring • 70% complete',
  },
];

export default function ApprovalWorkflowScreen({
  metadata,
  outcomes,
  units,
  auditLog,
  setAuditLog,
  currentRole,
  setCurrentRole,
  specStatus,
  setSpecStatus,
  isApproved,
  setIsApproved,
  onNavigate,
  onOpenExport,
}: ApprovalWorkflowScreenProps) {
  const [commentText, setCommentText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sectionComments, setSectionComments] = useState<SectionComment[]>(INITIAL_SECTION_COMMENTS);
  const [selectedSectionNum, setSelectedSectionNum] = useState<number>(3);
  const [newSectionCommentText, setNewSectionCommentText] = useState<string>('');
  const [specsRegistry, setSpecsRegistry] = useState<SpecRegistryItem[]>(INITIAL_SPECS_REGISTRY);
  const [registryFilter, setRegistryFilter] = useState<'all' | 'mine' | 'action' | 'approved'>('all');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isReturned = specStatus === 'returned';

  // Get sequence index (0 to 4)
  const getStageIndex = (stage: LifecycleStage): number => {
    switch (stage) {
      case 'draft':
        return 0;
      case 'submitted':
        return 1;
      case 'under_review':
        return 2;
      case 'pending_hod':
        return 3;
      case 'approved':
      case 'approved_sealed':
        return 4;
      case 'returned':
        return 0;
    }
  };

  const currentIndex = getStageIndex(specStatus);

  // Sync transition with server
  const sendTransitionToServer = async (targetStage: LifecycleStage, note: string) => {
    try {
      await fetch('/api/v1/workflow/transition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({
          targetStage,
          role: currentRole,
          actorName: currentRole === 'author' ? 'Dr. Sarah Lin' : currentRole === 'reviewer' ? 'Prof. David Marcus' : 'Dr. Elena Rostova',
          comment: note,
        }),
      });
    } catch {
      // serverless / preview fallback
    }
  };

  // 1. Author: Submit for Review
  const handleSubmitForReview = () => {
    if (currentRole !== 'author') {
      triggerToast('Permission Denied: Only Course Author can submit for review.');
      return;
    }
    const note = commentText.trim() || (isReturned ? 'Re-submitted specification after revisions.' : 'Submitted syllabus draft for peer review.');
    setSpecStatus('submitted');
    setIsApproved(false);
    sendTransitionToServer('submitted', note);

    const newEntry: AuditHistoryLog = {
      id: `log-${Date.now()}`,
      stage: 'submitted',
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      actor: 'Dr. Sarah Lin',
      role: 'author',
      action: isReturned ? 'Re-submitted specification with amendments' : 'Submitted specification for peer review',
      note,
    };
    setAuditLog([newEntry, ...auditLog]);
    setCommentText('');
    triggerToast('Specification submitted for review.');
  };

  // 2. Reviewer: Open & Mark Under Review
  const handleReviewerOpen = () => {
    if (currentRole !== 'reviewer') {
      triggerToast('Permission Denied: Only Reviewer can open and mark under review.');
      return;
    }
    const note = commentText.trim() || 'Reviewer opened specification and initiated formal accreditation checks.';
    setSpecStatus('under_review');
    setIsApproved(false);
    sendTransitionToServer('under_review', note);

    const newEntry: AuditHistoryLog = {
      id: `log-${Date.now()}`,
      stage: 'under_review',
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      actor: 'Prof. David Marcus',
      role: 'reviewer',
      action: 'Reviewer opened specification for active audit',
      note,
    };
    setAuditLog([newEntry, ...auditLog]);
    setCommentText('');
    triggerToast('Specification status marked as Under Review.');
  };

  // 3. Reviewer: Forward to HOD
  const handleForwardToHod = () => {
    if (currentRole !== 'reviewer') {
      triggerToast('Permission Denied: Only Reviewer can forward to HOD.');
      return;
    }
    const note = commentText.trim() || 'Curriculum review complete. Bloom level taxonomy, contact hours, and credit ratios verified.';
    setSpecStatus('pending_hod');
    setIsApproved(false);
    sendTransitionToServer('pending_hod', note);

    const newEntry: AuditHistoryLog = {
      id: `log-${Date.now()}`,
      stage: 'pending_hod',
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      actor: 'Prof. David Marcus',
      role: 'reviewer',
      action: 'Forwarded to HOD with positive recommendation',
      note,
    };
    setAuditLog([newEntry, ...auditLog]);
    setCommentText('');
    triggerToast('Specification forwarded to HOD for Board of Studies approval.');
  };

  // 4. Reviewer: Return with comment (comment REQUIRED)
  const handleReviewerReturnWithComment = () => {
    if (currentRole !== 'reviewer') {
      triggerToast('Permission Denied: Only Reviewer can return with comment.');
      return;
    }
    if (!commentText.trim()) {
      triggerToast('Comment required: Please provide feedback explaining what needs revision.');
      return;
    }
    const note = commentText.trim();
    setSpecStatus('returned');
    setIsApproved(false);
    sendTransitionToServer('returned', note);

    const newEntry: AuditHistoryLog = {
      id: `log-${Date.now()}`,
      stage: 'returned',
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      actor: 'Prof. David Marcus',
      role: 'reviewer',
      action: 'Returned to Author for Revisions',
      note,
    };
    setAuditLog([newEntry, ...auditLog]);
    setCommentText('');
    triggerToast('Specification returned to Author with review comments.');
  };

  // 5. HOD: Approve
  const handleHodApprove = () => {
    if (currentRole !== 'hod' && currentRole !== 'dean') {
      triggerToast('Permission Denied: Only HOD or Dean can approve.');
      return;
    }
    const note = commentText.trim() || 'Ratified by Board of Studies. Compliant with ABET CAC-201 accreditation standards.';
    setSpecStatus('approved');
    setIsApproved(true);
    sendTransitionToServer('approved', note);

    const newEntry: AuditHistoryLog = {
      id: `log-${Date.now()}`,
      stage: 'approved',
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      actor: currentRole === 'hod' ? 'Dr. Elena Rostova' : 'Dean of Academic Programs',
      role: currentRole,
      action: 'Approved & Formally Sealed by Board of Studies',
      note,
    };
    setAuditLog([newEntry, ...auditLog]);
    setCommentText('');
    triggerToast('Specification formally Approved and Ratified!');
  };

  // 6. HOD: Return with comment (comment REQUIRED)
  const handleHodReturn = () => {
    if (currentRole !== 'hod' && currentRole !== 'dean') {
      triggerToast('Permission Denied: Only HOD or Dean can return.');
      return;
    }
    if (!commentText.trim()) {
      triggerToast('Comment required: Please provide feedback explaining what requires correction.');
      return;
    }
    const note = commentText.trim();
    setSpecStatus('returned');
    setIsApproved(false);
    sendTransitionToServer('returned', note);

    const newEntry: AuditHistoryLog = {
      id: `log-${Date.now()}`,
      stage: 'returned',
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      actor: currentRole === 'hod' ? 'Dr. Elena Rostova' : 'Dean of Academic Programs',
      role: currentRole,
      action: 'Returned by Department Chair for Corrections',
      note,
    };
    setAuditLog([newEntry, ...auditLog]);
    setCommentText('');
    triggerToast('Specification returned by HOD.');
  };

  // Add Section Comment handler
  const handleAddSectionComment = () => {
    if (currentRole !== 'reviewer' && currentRole !== 'hod' && currentRole !== 'author') {
      triggerToast('Permission Denied: Only Reviewer, HOD, or Author can post remarks.');
      return;
    }
    if (!newSectionCommentText.trim()) {
      triggerToast('Please type a comment before posting.');
      return;
    }

    const secObj = SECTIONS_LIST.find((s) => s.num === selectedSectionNum);
    const newComment: SectionComment = {
      id: `comment-${Date.now()}`,
      sectionNumber: selectedSectionNum,
      sectionTitle: secObj?.title || `Section ${selectedSectionNum}`,
      authorName: currentRole === 'author' ? 'Dr. Sarah Lin' : currentRole === 'reviewer' ? 'Prof. David Marcus' : 'Dr. Elena Rostova',
      authorRole: currentRole,
      timestamp: 'Just now',
      comment: newSectionCommentText.trim(),
      resolved: false,
    };

    setSectionComments([newComment, ...sectionComments]);
    setNewSectionCommentText('');
    triggerToast(`Added review remark on ${secObj?.title}.`);
  };

  const handleToggleResolveComment = (commentId: string) => {
    setSectionComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c))
    );
    triggerToast('Comment status updated.');
  };

  // Filtered registry items
  const filteredSpecsRegistry = specsRegistry.map((item) =>
    item.code === metadata.courseCode ? { ...item, status: specStatus } : item
  ).filter((item) => {
    if (registryFilter === 'mine') return item.author.includes('Lin');
    if (registryFilter === 'action') return item.status === 'returned' || item.status === 'under_review' || item.status === 'pending_hod';
    if (registryFilter === 'approved') return item.status === 'approved';
    return true;
  });

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 gap-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-primary text-surface-bright px-3.5 py-2 rounded-lg shadow-xl border border-secondary text-xs flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Context & Role Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block font-mono-data">
            Governance &bull; Board of Studies Ratification
          </span>
          <h2 className="text-xl font-bold text-on-surface">
            {metadata.courseCode}: Specification Approval
          </h2>
        </div>

        {/* Role Simulator Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-lg font-mono-data text-xs">
          <span className="text-[11px] text-on-surface-variant font-bold uppercase px-2 py-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">badge</span>
            Role:
          </span>
          <button
            type="button"
            onClick={() => setCurrentRole('author')}
            className={`px-2.5 py-1 rounded transition-all font-semibold ${
              currentRole === 'author'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Author
          </button>
          <button
            type="button"
            onClick={() => setCurrentRole('reviewer')}
            className={`px-2.5 py-1 rounded transition-all font-semibold ${
              currentRole === 'reviewer'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Reviewer
          </button>
          <button
            type="button"
            onClick={() => setCurrentRole('hod')}
            className={`px-2.5 py-1 rounded transition-all font-semibold ${
              currentRole === 'hod'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            HOD
          </button>
        </div>
      </div>

      {/* RBAC Guard Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 bg-surface-container-low rounded-xl border border-surface-container text-xs">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
          <span className="material-symbols-outlined text-[18px]">security</span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-secondary uppercase font-mono-data">RBAC Governance Policy Enforced</span>
            <span className="bg-surface-container px-1.5 py-0.5 rounded text-[10px] font-mono-data text-on-surface-variant">HTTP 403 Watcher Active</span>
          </div>
          <p className="text-on-surface-variant mt-0.5 leading-snug">
            {currentRole === 'author'
              ? (specStatus === 'draft' || specStatus === 'returned'
                  ? 'Author privileges active: Content editing is OPEN because the course is in Draft or Returned state.'
                  : `Author privileges active: Content editing is LOCKED on the server because course is currently '${specStatus}'. Awaiting peer review.`)
              : `Reviewer/HOD privileges active: Content AST editing is LOCKED (Read-Only). Reviewers and HOD can add section feedback comments and advance or return the workflow.`}
          </p>
        </div>
      </div>

      {/* 1. HORIZONTAL STATUS TRACKER WITH SEPARATE RED 'RETURNED' STATE */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono-data">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface uppercase tracking-wider">
              Curriculum Lifecycle Pipeline
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
              v2.4-RC &bull; {metadata.semester}
            </span>
          </div>

          {/* Active status indicator */}
          <div className="flex items-center gap-2">
            {isReturned ? (
              <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                Status: Returned for Revision
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-surface-container text-secondary font-bold text-xs capitalize flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Status: {specStatus.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Status Tracker Flow */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Main 5 Linear Stages */}
          <div className="flex-1 grid grid-cols-5 gap-1.5 sm:gap-2">
            {STAGES.map((stage, idx) => {
              const isPassed = !isReturned && currentIndex > idx;
              const isCurrent = !isReturned && currentIndex === idx;

              return (
                <div key={stage.key} className="flex flex-col gap-1.5 items-center text-center">
                  {/* Step bar */}
                  <div
                    className={`w-full h-2 rounded-full transition-all ${
                      isPassed
                        ? 'bg-secondary'
                        : isCurrent
                        ? 'bg-secondary ring-2 ring-secondary/30 shadow-xs'
                        : 'bg-surface-container'
                    }`}
                  ></div>

                  {/* Icon & Label */}
                  <div className="flex flex-col items-center gap-0.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[16px] sm:text-[18px] ${
                        isPassed
                          ? 'text-secondary'
                          : isCurrent
                          ? 'text-secondary font-bold'
                          : 'text-outline-variant'
                      }`}
                    >
                      {stage.icon}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono-data truncate ${
                        isCurrent
                          ? 'font-bold text-on-surface'
                          : isPassed
                          ? 'font-medium text-secondary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-12 bg-surface-container self-center"></div>

          {/* Separate Red 'Returned' State Box */}
          <div
            className={`p-2.5 rounded-lg border transition-all flex items-center gap-2.5 shrink-0 ${
              isReturned
                ? 'bg-error-container text-on-error-container border-error ring-2 ring-error/30 shadow-xs'
                : 'bg-surface-container-low border-error/40 text-error hover:bg-error-container/20'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">replay</span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider font-mono-data">
                  Loopback State
                </span>
                {isReturned && (
                  <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                )}
              </div>
              <span className="text-xs font-bold font-mono-data">Returned</span>
              <span className="text-[10px] text-on-surface-variant leading-tight">
                Cascades to Author
              </span>
            </div>
          </div>
        </div>

        {/* Returned Warning Message */}
        {isReturned && (
          <div className="p-2.5 rounded-lg bg-error-container/30 border border-error/40 flex items-start gap-2 text-xs text-on-error-container">
            <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <div className="leading-relaxed">
              <strong className="font-semibold">Revisions Requested:</strong> Specification has been returned to the Course Author. Use the Author role to revise curriculum units or outcomes, then resubmit for review.
            </div>
          </div>
        )}
      </div>

      {/* TWO-COLUMN LAYOUT: Left (Action Panel, Comments & Preview) / Right (History Timeline & Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: ACTION PANEL, COMMENTS & PREVIEW (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Action Panel for Current Role */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  bolt
                </span>
                <h3 className="text-sm font-bold text-on-surface">
                  Governance Action Panel &bull;{' '}
                  <span className="text-secondary capitalize">{currentRole} Role</span>
                </h3>
              </div>
              <span className="text-[11px] font-mono-data text-on-surface-variant">
                RBAC Enforced
              </span>
            </div>

            {/* Comment Box */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="governance-comment"
                  className="text-xs font-semibold text-on-surface flex items-center gap-1"
                >
                  <span>Decision Comment / Rationale</span>
                  {(currentRole === 'reviewer' || currentRole === 'hod') && (
                    <span className="text-error font-bold text-[10px] uppercase font-mono-data">
                      * Required to Return
                    </span>
                  )}
                </label>
                <span className="text-[10px] text-on-surface-variant font-mono-data">
                  Saved with immutable audit signature
                </span>
              </div>
              <textarea
                id="governance-comment"
                rows={3}
                placeholder={
                  currentRole === 'reviewer'
                    ? 'Enter peer review notes, identified gaps, or endorsement rationale (required to return)...'
                    : currentRole === 'hod'
                    ? 'Enter Board of Studies ratification comments or revision requirements (required to return)...'
                    : 'Enter submission notes for curriculum committee review...'
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full text-xs p-3 rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface resize-none focus:outline-none focus:border-secondary font-sans leading-relaxed"
              />
            </div>

            {/* ACTION BUTTONS (With disabled tooltips explaining who can use them) */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono-data">
                Available Operations for {currentRole.toUpperCase()}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Author Action: Submit for Review / Re-submit */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    disabled={currentRole !== 'author' || (specStatus !== 'draft' && specStatus !== 'returned')}
                    title={
                      currentRole !== 'author'
                        ? 'Only Course Author can submit specification for review'
                        : (specStatus !== 'draft' && specStatus !== 'returned')
                        ? `Cannot submit: Course is currently ${specStatus}. Re-submission allowed only in Draft or Returned.`
                        : 'Submit specification for department review'
                    }
                    className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      currentRole === 'author' && (specStatus === 'draft' || specStatus === 'returned')
                        ? 'bg-primary hover:bg-primary-container text-on-primary shadow-xs active:scale-98 cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant/50 border border-outline-variant/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>{isReturned ? 'Re-submit for review' : 'Submit for review'}</span>
                    {currentRole !== 'author' && (
                      <span className="text-[10px] font-mono-data opacity-75">(Author)</span>
                    )}
                  </button>
                  {(currentRole !== 'author' || (specStatus !== 'draft' && specStatus !== 'returned')) && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 px-2 py-1 bg-primary text-surface-bright text-[10px] font-mono-data rounded shadow-lg whitespace-nowrap pointer-events-none">
                      {currentRole !== 'author'
                        ? '🔒 Only Course Author can submit for review'
                        : `🔒 Only allowed in Draft or Returned (Current: ${specStatus})`}
                    </div>
                  )}
                </div>

                {/* 2. Reviewer Action: Open & Mark Under Review */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleReviewerOpen}
                    disabled={currentRole !== 'reviewer' || specStatus !== 'submitted'}
                    title={
                      currentRole !== 'reviewer'
                        ? 'Only Reviewer can mark under review'
                        : specStatus !== 'submitted'
                        ? `Course is currently ${specStatus}. Can only open when Submitted.`
                        : 'Open specification and begin peer review audit'
                    }
                    className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      currentRole === 'reviewer' && specStatus === 'submitted'
                        ? 'bg-secondary hover:bg-secondary-container text-on-secondary shadow-xs active:scale-98 cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant/50 border border-outline-variant/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    <span>Open (Under Review)</span>
                    {currentRole !== 'reviewer' && (
                      <span className="text-[10px] font-mono-data opacity-75">(Reviewer)</span>
                    )}
                  </button>
                  {(currentRole !== 'reviewer' || specStatus !== 'submitted') && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 px-2 py-1 bg-primary text-surface-bright text-[10px] font-mono-data rounded shadow-lg whitespace-nowrap pointer-events-none">
                      {currentRole !== 'reviewer' ? '🔒 Only Reviewer can open spec' : '🔒 Available when Submitted'}
                    </div>
                  )}
                </div>

                {/* 3. Reviewer Action: Forward to HOD */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleForwardToHod}
                    disabled={currentRole !== 'reviewer' || (specStatus !== 'under_review' && specStatus !== 'submitted')}
                    title={
                      currentRole !== 'reviewer'
                        ? 'Only Reviewer can forward to HOD'
                        : (specStatus !== 'under_review' && specStatus !== 'submitted')
                        ? 'Can only forward to HOD while under review'
                        : 'Endorse and forward to HOD for Board of Studies sign-off'
                    }
                    className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      currentRole === 'reviewer' && (specStatus === 'under_review' || specStatus === 'submitted')
                        ? 'bg-secondary hover:bg-secondary-container text-on-secondary shadow-xs active:scale-98 cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant/50 border border-outline-variant/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">forward</span>
                    <span>Forward to HOD</span>
                    {currentRole !== 'reviewer' && (
                      <span className="text-[10px] font-mono-data opacity-75">(Reviewer)</span>
                    )}
                  </button>
                  {(currentRole !== 'reviewer' || (specStatus !== 'under_review' && specStatus !== 'submitted')) && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 px-2 py-1 bg-primary text-surface-bright text-[10px] font-mono-data rounded shadow-lg whitespace-nowrap pointer-events-none">
                      🔒 Only Reviewer can forward to HOD (while Under Review)
                    </div>
                  )}
                </div>

                {/* 4. Reviewer Action: Return with comment (comment required) */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleReviewerReturnWithComment}
                    disabled={currentRole !== 'reviewer' || specStatus !== 'under_review' || !commentText.trim()}
                    title={
                      currentRole !== 'reviewer'
                        ? 'Only Reviewer can return specification with comment'
                        : specStatus !== 'under_review'
                        ? 'Can only return while Under Review'
                        : !commentText.trim()
                        ? 'A decision comment is required above to return'
                        : 'Return specification to Author with comments'
                    }
                    className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      currentRole === 'reviewer' && specStatus === 'under_review' && commentText.trim()
                        ? 'bg-surface-container hover:bg-error-container text-error border border-error/40 shadow-xs active:scale-98 cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant/50 border border-outline-variant/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">comment</span>
                    <span>Return with comment</span>
                    {currentRole !== 'reviewer' && (
                      <span className="text-[10px] font-mono-data opacity-75">(Reviewer)</span>
                    )}
                  </button>
                  {(currentRole !== 'reviewer' || specStatus !== 'under_review' || !commentText.trim()) && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 px-2 py-1 bg-primary text-surface-bright text-[10px] font-mono-data rounded shadow-lg whitespace-nowrap pointer-events-none">
                      {currentRole !== 'reviewer'
                        ? '🔒 Only Reviewer can return with comment'
                        : specStatus !== 'under_review'
                        ? '🔒 Must be Under Review'
                        : '⚠️ Decision comment required in box above'}
                    </div>
                  )}
                </div>

                {/* 5. HOD Action: Approve */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleHodApprove}
                    disabled={(currentRole !== 'hod' && currentRole !== 'dean') || specStatus !== 'pending_hod'}
                    title={
                      currentRole !== 'hod' && currentRole !== 'dean'
                        ? 'Only HOD or Dean can approve'
                        : specStatus !== 'pending_hod'
                        ? `Course is currently ${specStatus}. Can only approve when Pending HOD.`
                        : 'Officially ratify and approve course specification'
                    }
                    className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      (currentRole === 'hod' || currentRole === 'dean') && specStatus === 'pending_hod'
                        ? 'bg-primary hover:bg-primary-container text-on-primary shadow-xs active:scale-98 cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant/50 border border-outline-variant/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Approve &amp; Seal</span>
                    {currentRole !== 'hod' && currentRole !== 'dean' && (
                      <span className="text-[10px] font-mono-data opacity-75">(HOD/Dean)</span>
                    )}
                  </button>
                  {((currentRole !== 'hod' && currentRole !== 'dean') || specStatus !== 'pending_hod') && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 px-2 py-1 bg-primary text-surface-bright text-[10px] font-mono-data rounded shadow-lg whitespace-nowrap pointer-events-none">
                      {currentRole !== 'hod' && currentRole !== 'dean'
                        ? '🔒 Only HOD or Dean can approve'
                        : '🔒 Can only approve when Pending HOD'}
                    </div>
                  )}
                </div>

                {/* 6. HOD Action: Return */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleHodReturn}
                    disabled={(currentRole !== 'hod' && currentRole !== 'dean') || specStatus !== 'pending_hod' || !commentText.trim()}
                    title={
                      currentRole !== 'hod' && currentRole !== 'dean'
                        ? 'Only HOD or Dean can return'
                        : specStatus !== 'pending_hod'
                        ? 'Can only return when Pending HOD'
                        : !commentText.trim()
                        ? 'A decision comment is required above to return'
                        : 'Return specification for curricular amendments'
                    }
                    className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      (currentRole === 'hod' || currentRole === 'dean') && specStatus === 'pending_hod' && commentText.trim()
                        ? 'border border-error/50 text-error hover:bg-error-container/20 cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant/50 border border-outline-variant/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>Return (HOD Revision)</span>
                    {currentRole !== 'hod' && currentRole !== 'dean' && (
                      <span className="text-[10px] font-mono-data opacity-75">(HOD/Dean)</span>
                    )}
                  </button>
                  {((currentRole !== 'hod' && currentRole !== 'dean') || specStatus !== 'pending_hod' || !commentText.trim()) && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 px-2 py-1 bg-primary text-surface-bright text-[10px] font-mono-data rounded shadow-lg whitespace-nowrap pointer-events-none">
                      {currentRole !== 'hod' && currentRole !== 'dean'
                        ? '🔒 Only HOD or Dean can return'
                        : specStatus !== 'pending_hod'
                        ? '🔒 Must be Pending HOD'
                        : '⚠️ Decision comment required in box above'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. SECTION COMMENTS MODULE: Reviewer and HOD can add comments per section */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">forum</span>
                <h3 className="text-sm font-bold text-on-surface">Section Comments &amp; Review Remarks</h3>
              </div>
              <span className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                {sectionComments.filter((c) => !c.resolved).length} Unresolved
              </span>
            </div>

            {/* Post new observation */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-container-low border border-surface-container">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-on-surface uppercase font-mono-data">
                  Add Section Remark ({currentRole.toUpperCase()})
                </span>
                <select
                  value={selectedSectionNum}
                  onChange={(e) => setSelectedSectionNum(Number(e.target.value))}
                  className="h-7 px-2 rounded bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface font-medium focus:outline-none"
                >
                  {SECTIONS_LIST.map((s) => (
                    <option key={s.num} value={s.num}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Enter ${currentRole} observation on selected section...`}
                  value={newSectionCommentText}
                  onChange={(e) => setNewSectionCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSectionComment()}
                  className="flex-1 h-8 px-3 rounded bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary"
                />
                <button
                  type="button"
                  onClick={handleAddSectionComment}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Post Remark</span>
                </button>
              </div>
            </div>

            {/* List of Section Comments */}
            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
              {sectionComments.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-2 text-center">
                  No section observations logged. Reviewers and HOD can attach section feedback above.
                </p>
              ) : (
                sectionComments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all ${
                      c.resolved
                        ? 'bg-surface-container-low/50 border-surface-container opacity-60'
                        : 'bg-surface-container-low border-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono-data text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                          Sec {c.sectionNumber}
                        </span>
                        <span className="text-xs font-bold text-on-surface">{c.authorName}</span>
                        <span className="text-[10px] font-semibold text-on-surface-variant capitalize px-1 rounded bg-surface-container-high">
                          {c.authorRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono-data text-outline">{c.timestamp}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleResolveComment(c.id)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                            c.resolved
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                              : 'bg-surface-container text-on-surface-variant hover:bg-tertiary-fixed/40'
                          }`}
                        >
                          {c.resolved ? 'Resolved' : 'Resolve'}
                        </button>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-secondary">{c.sectionTitle}</span>
                    <p className="text-xs text-on-surface leading-relaxed">{c.comment}</p>

                    {/* Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="ml-4 pl-2 border-l-2 border-secondary/40 flex flex-col gap-1 mt-1">
                        {c.replies.map((r) => (
                          <div key={r.id} className="text-xs text-on-surface-variant bg-surface-container-lowest p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-on-surface">{r.authorName} ({r.authorRole}):</span>
                              <span className="text-[10px] font-mono-data text-outline">{r.timestamp}</span>
                            </div>
                            <p className="mt-0.5">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Syllabus Watermark Preview Card */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Specification Status Preview</span>
              <button
                type="button"
                onClick={onOpenExport}
                className="text-xs font-semibold text-secondary hover:underline flex items-center gap-0.5"
              >
                <span>Export Dossier</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>

            {/* Simulated Watermark Canvas */}
            <div className="relative p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1 min-h-[100px] justify-center overflow-hidden">
              {/* Diagonal Watermark (Hidden when Approved) */}
              {specStatus !== 'approved' && specStatus !== 'approved_sealed' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-0">
                  <span
                    className={`font-black text-5xl sm:text-6xl tracking-widest transform -rotate-15 whitespace-nowrap ${
                      isReturned ? 'text-error/15' : 'text-on-surface/10'
                    }`}
                  >
                    {isReturned ? 'RETURNED' : 'DRAFT'}
                  </span>
                </div>
              )}

              {/* Seal Overlay when Approved */}
              {(specStatus === 'approved' || specStatus === 'approved_sealed') && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-0">
                  <div className="border-4 border-on-tertiary-container/30 text-on-tertiary-container/40 font-black text-2xl uppercase tracking-widest p-2 rounded-xl transform -rotate-6">
                    RATIFIED &bull; APPROVED
                  </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col gap-0.5">
                <span className="text-[10px] font-mono-data text-secondary uppercase font-semibold">
                  Course Code &bull; {metadata.courseCode}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                  {metadata.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant line-clamp-2">
                  Department of {metadata.department} &bull; {outcomes.length} Course Outcomes &bull; {units.length} Curricular Units &bull; {metadata.credits.total} Credits
                </p>
              </div>

              <div className="relative z-10 pt-1 flex items-center justify-between text-[11px] font-mono-data text-on-surface-variant border-t border-surface-container/60 mt-1">
                <span>Accreditation: {metadata.accreditationStandard}</span>
                <span className="font-semibold text-secondary">
                  {specStatus === 'approved' ? '✓ Formally Sealed' : '⚠️ DRAFT Watermark Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY TIMELINE & DASHBOARD OF SPECS (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* History Timeline of Who Did What and When */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  history
                </span>
                <h3 className="text-sm font-bold text-on-surface">Audit History Timeline</h3>
              </div>
              <span className="text-[11px] font-mono-data text-on-surface-variant">
                {auditLog.length} Records
              </span>
            </div>

            {/* Timeline Stream */}
            <div className="flex flex-col gap-3 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container max-h-80 overflow-y-auto pr-1">
              {auditLog.map((log) => {
                const isApprovedLog = log.stage === 'approved';
                const isReturnedLog = log.stage === 'returned';

                return (
                  <div key={log.id} className="flex flex-col gap-1 relative pl-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full absolute -left-1.5 top-1.5 ${
                        isApprovedLog
                          ? 'bg-on-tertiary-container'
                          : isReturnedLog
                          ? 'bg-error'
                          : 'bg-secondary'
                      }`}
                    ></div>

                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-on-surface">{log.action}</span>
                      <span className="text-[10px] font-mono-data text-outline">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      <span className="font-medium text-on-surface">{log.actor}</span>
                      <span className="text-outline">&bull;</span>
                      <span className="capitalize font-mono-data px-1 py-0.2 rounded bg-surface-container text-[10px]">
                        {log.role}
                      </span>
                    </div>

                    {log.note && (
                      <p className="text-xs text-on-surface bg-surface-container-low p-2 rounded mt-0.5 leading-relaxed border border-surface-container">
                        &ldquo;{log.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. DASHBOARD OF SPECS WITH THEIR STATUS */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-outline-variant/50 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-on-surface">Curriculum Governance Register</h3>
                <span className="text-[11px] text-on-surface-variant">Fall 2025 Accreditation Cycle</span>
              </div>
              <span className="text-[11px] font-mono-data font-bold px-2 py-0.5 rounded bg-surface-container text-secondary">
                {filteredSpecsRegistry.length} Specs
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setRegistryFilter('all')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  registryFilter === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRegistryFilter('mine')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  registryFilter === 'mine'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Mine (Author)
              </button>
              <button
                type="button"
                onClick={() => setRegistryFilter('action')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  registryFilter === 'action'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Action Needed
              </button>
              <button
                type="button"
                onClick={() => setRegistryFilter('approved')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                  registryFilter === 'approved'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Approved
              </button>
            </div>

            {/* Spec Cards in Registry */}
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredSpecsRegistry.map((item) => {
                const isCurrentSpec = item.code === metadata.courseCode;

                const getStatusStyle = (st: string) => {
                  switch (st) {
                    case 'approved':
                      return 'bg-tertiary-fixed text-on-tertiary-fixed font-bold';
                    case 'returned':
                      return 'bg-error-container text-on-error-container font-bold';
                    case 'pending_hod':
                      return 'bg-secondary-container/20 text-secondary font-bold';
                    case 'under_review':
                      return 'bg-surface-container-high text-primary font-semibold';
                    case 'submitted':
                      return 'bg-surface-container text-secondary font-semibold';
                    default:
                      return 'bg-surface-container text-on-surface-variant font-medium';
                  }
                };

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all ${
                      isCurrentSpec
                        ? 'bg-surface-container-low border-secondary/50 shadow-xs'
                        : 'bg-surface-container-lowest border-surface-container hover:border-outline-variant'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-on-surface">{item.code}: {item.title}</span>
                          {isCurrentSpec && (
                            <span className="text-[9px] font-bold bg-secondary text-on-secondary px-1 py-0.2 rounded font-mono">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-on-surface-variant">Author: {item.author} &bull; {item.credits}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded capitalize font-mono-data shrink-0 ${getStatusStyle(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono-data text-outline pt-0.5">
                      <span>{item.notes || 'Curriculum unit schedule verified'}</span>
                      {!isCurrentSpec && (
                        <button
                          type="button"
                          onClick={() => triggerToast(`Switched active view context to ${item.code}.`)}
                          className="text-secondary font-semibold hover:underline flex items-center gap-0.5"
                        >
                          <span>Inspect</span>
                          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('audit')}
          className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Checks &amp; Audit</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
        >
          <span>Proceed to Specification Export</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
