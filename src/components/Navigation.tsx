/**
 * SpecForge Navigation Bar
 * Connects the 6 Google Stitch curriculum workflow screens.
 */

import React from 'react';
import { ActiveScreen } from '../types';

interface NavigationProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  defectCount?: number;
}

interface NavItem {
  key: ActiveScreen;
  label: string;
  icon: string;
  badge?: number | string;
}

export default function Navigation({ activeScreen, onNavigate, defectCount }: NavigationProps) {
  const items: NavItem[] = [
    { key: 'builder', label: 'Builder', icon: 'edit_document' },
    { key: 'intake', label: 'Intake', icon: 'cloud_upload' },
    { key: 'templates', label: 'Templates', icon: 'developer_board' },
    { key: 'matrix', label: 'CO-PO Matrix', icon: 'grid_4x4' },
    {
      key: 'audit',
      label: 'Audit',
      icon: 'rule',
      badge: defectCount && defectCount > 0 ? defectCount : undefined,
    },
    { key: 'governance', label: 'Governance', icon: 'gavel' },
    { key: 'export', label: 'Export', icon: 'ios_share' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface/95 backdrop-blur-xl border-t border-surface-container shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-xl mx-auto flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const isActive = activeScreen === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] h-12 rounded-lg transition-all gap-0.5 relative ${
                isActive
                  ? 'text-secondary bg-surface-container-low font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute top-1 right-2 sm:right-3 w-4 h-4 rounded-full bg-error text-on-error text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
