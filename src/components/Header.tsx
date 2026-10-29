/**
 * SpecForge Persistent Header Component
 * Matches the Google Stitch design specification shell.
 */

import React from 'react';
import { UserRole, ActiveScreen } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSettings: () => void;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  screenTitle?: string;
  specStatus?: string;
}

const SCREEN_TITLES: Record<ActiveScreen, string> = {
  builder: 'Spec Builder',
  intake: 'Course Intake & Parser',
  templates: 'Template & Hydration',
  matrix: 'CO-PO-PSO Alignment',
  audit: 'Audit & Validation',
  governance: 'Approval Governance',
  export: 'Course Specification Export',
};

export default function Header({
  currentRole,
  onRoleChange,
  onOpenSettings,
  activeScreen,
  onNavigate,
  screenTitle,
  specStatus = 'draft',
}: HeaderProps) {
  const title = screenTitle || SCREEN_TITLES[activeScreen];

  const getStatusBadge = () => {
    switch (specStatus) {
      case 'approved':
        return 'bg-tertiary-fixed/40 text-on-tertiary-container border-on-tertiary-container/30';
      case 'returned':
        return 'bg-error-container text-on-error-container border-error/40 animate-pulse';
      case 'pending_hod':
        return 'bg-secondary-container/20 text-secondary border-secondary/30';
      case 'under_review':
        return 'bg-surface-container-high text-primary border-outline-variant/40';
      case 'submitted':
        return 'bg-surface-container text-secondary border-outline-variant/30';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/95 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col gap-2">
        {/* Top row: Brand + Status + Settings + User */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Screen Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => onNavigate('builder')}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
              title="Return to SpecForge Builder"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">architecture</span>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-on-surface truncate leading-tight tracking-tight">
                  SpecForge - Course Specification Builder
                </h1>
                <span className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border ${getStatusBadge()}`}>
                  {specStatus.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[11px] font-medium text-secondary truncate leading-tight">
                {title}
              </span>
            </div>
          </div>

          {/* Right utility items */}
          <div className="flex items-center gap-2 shrink-0">
            {/* API Health Pill */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-container text-on-tertiary-fixed-variant"
              title="GET /api/v1/health: 200 OK — Active Gateway"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold uppercase font-mono-data">API: UP</span>
            </div>

            {/* AI Settings Trigger */}
            <button
              onClick={onOpenSettings}
              aria-label="LLM Settings"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Configure LLM Provider & Transient Keys"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>

            {/* User Profile Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs"
              title={`Logged in as ${currentRole.toUpperCase()}`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>

        {/* Bottom row: Role Selector + Quick Actions */}
        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-surface-container/60">
          {/* Role Selector with expand icon */}
          <div className="relative flex items-center">
            <label className="sr-only" htmlFor="role-select">
              Role Selector
            </label>
            <select
              id="role-select"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="h-8 pl-2.5 pr-7 rounded-lg bg-surface-container text-xs font-semibold text-on-surface appearance-none focus:outline-none focus:bg-surface-container-high transition-colors cursor-pointer"
            >
              <option value="author">Author</option>
              <option value="reviewer">Reviewer</option>
              <option value="hod">HOD</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-1.5 text-on-surface-variant text-[16px]">
              expand_more
            </span>
          </div>

          {/* Quick upload shortcut button */}
          <button
            type="button"
            onClick={() => onNavigate('intake')}
            className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center gap-1.5 text-xs font-medium transition-colors"
            title="Upload course specification & blueprint files"
          >
            <span className="material-symbols-outlined text-secondary text-[16px]">cloud_upload</span>
            <span>Upload files</span>
          </button>
        </div>
      </div>
    </header>
  );
}
