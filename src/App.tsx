/**
 * SpecForge Academic Workbench - Main Application
 */

import React, { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Settings from './Settings';
import ExportModal from './components/ExportModal';
import SpecBuilderScreen from './screens/SpecBuilderScreen';
import SpecificationUploadIntakeScreen from './screens/SpecificationUploadIntakeScreen';
import TemplateSelectionHydrationScreen from './screens/TemplateSelectionHydrationScreen';
import CoPoPsoAlignmentScreen from './screens/CoPoPsoAlignmentScreen';
import ValidationDefectAuditScreen from './screens/ValidationDefectAuditScreen';
import ApprovalWorkflowScreen from './screens/ApprovalWorkflowScreen';
import SpecificationExportScreen from './screens/SpecificationExportScreen';
import {
  CourseMetadata,
  CourseOutcome,
  UnitModule,
  MatrixCellRationale,
  ValidationDefect,
  AuditHistoryLog,
  UserRole,
  ActiveScreen,
  LLMSettings,
} from './types';
import {
  INITIAL_METADATA,
  INITIAL_COURSE_OUTCOMES,
  INITIAL_UNITS,
  INITIAL_RATIONALES,
  INITIAL_DEFECTS,
  INITIAL_AUDIT_LOG,
} from './data/initialData';
import { loadSettings } from './api';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('builder');
  const [currentRole, setCurrentRole] = useState<UserRole>('author');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [llmSettings, setLlmSettings] = useState<LLMSettings>(loadSettings());

  // Core reactive data state
  const [metadata, setMetadata] = useState<CourseMetadata>(INITIAL_METADATA);
  const [outcomes, setOutcomes] = useState<CourseOutcome[]>(INITIAL_COURSE_OUTCOMES);
  const [units, setUnits] = useState<UnitModule[]>(INITIAL_UNITS);
  const [rationales, setRationales] = useState<MatrixCellRationale[]>(INITIAL_RATIONALES);
  const [defects, setDefects] = useState<ValidationDefect[]>(INITIAL_DEFECTS);
  const [auditLog, setAuditLog] = useState<AuditHistoryLog[]>(INITIAL_AUDIT_LOG);
  const [specStatus, setSpecStatus] = useState<LifecycleStage>('draft');
  const [isApproved, setIsApproved] = useState(false);

  const handleStatusChange = (newStatus: LifecycleStage) => {
    setSpecStatus(newStatus);
    setIsApproved(newStatus === 'approved' || newStatus === 'approved_sealed');
  };

  const activeDefectCount = defects.filter((d) => !d.passed).length;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased flex flex-col min-h-screen selection:bg-secondary/20 selection:text-secondary">
      {/* Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        specStatus={specStatus}
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full pt-28 pb-24">
        {activeScreen === 'builder' && (
          <SpecBuilderScreen
            metadata={metadata}
            setMetadata={setMetadata}
            outcomes={outcomes}
            units={units}
            currentRole={currentRole}
            specStatus={specStatus}
            llmSettings={llmSettings}
            onNavigate={setActiveScreen}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeScreen === 'intake' && (
          <SpecificationUploadIntakeScreen
            metadata={metadata}
            setMetadata={setMetadata}
            outcomes={outcomes}
            setOutcomes={setOutcomes}
            units={units}
            setUnits={setUnits}
            rationales={rationales}
            currentRole={currentRole}
            onNavigate={setActiveScreen}
          />
        )}

        {activeScreen === 'templates' && (
          <TemplateSelectionHydrationScreen
            metadata={metadata}
            setMetadata={setMetadata}
            outcomes={outcomes}
            units={units}
            currentRole={currentRole}
            onNavigate={setActiveScreen}
          />
        )}

        {activeScreen === 'matrix' && (
          <CoPoPsoAlignmentScreen
            metadata={metadata}
            outcomes={outcomes}
            units={units}
            rationales={rationales}
            setRationales={setRationales}
            currentRole={currentRole}
            specStatus={specStatus}
            onNavigate={setActiveScreen}
          />
        )}

        {activeScreen === 'audit' && (
          <ValidationDefectAuditScreen
            metadata={metadata}
            setMetadata={setMetadata}
            outcomes={outcomes}
            setOutcomes={setOutcomes}
            units={units}
            setUnits={setUnits}
            defects={defects}
            setDefects={setDefects}
            currentRole={currentRole}
            onNavigate={setActiveScreen}
            onOpenExport={() => setActiveScreen('export')}
          />
        )}

        {activeScreen === 'governance' && (
          <ApprovalWorkflowScreen
            metadata={metadata}
            outcomes={outcomes}
            units={units}
            auditLog={auditLog}
            setAuditLog={setAuditLog}
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            specStatus={specStatus}
            setSpecStatus={handleStatusChange}
            isApproved={isApproved}
            setIsApproved={setIsApproved}
            onNavigate={setActiveScreen}
            onOpenExport={() => setActiveScreen('export')}
          />
        )}

        {activeScreen === 'export' && (
          <SpecificationExportScreen
            metadata={metadata}
            outcomes={outcomes}
            units={units}
            rationales={rationales}
            defects={defects}
            isApproved={isApproved}
            onNavigate={setActiveScreen}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        defectCount={activeDefectCount}
      />

      {/* AI Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={(newSettings) => setLlmSettings(newSettings)}
      />

      {/* HTML Export Dossier Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        metadata={metadata}
        outcomes={outcomes}
        units={units}
        rationales={rationales}
        defects={defects}
        isApproved={isApproved}
      />
    </div>
  );
}
