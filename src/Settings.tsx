/**
 * SpecForge AI Settings Panel
 * 
 * Restyled to SpecForge Academic Workbench standards.
 * Interacts only via loadSettings / saveSettings in src/api.ts.
 * Displays ephemeral security assurance for x-llm-* headers.
 */

import React, { useState, useEffect } from 'react';
import { LLMSettings } from './types';
import { loadSettings, saveSettings, checkLLMConnection } from './api';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: LLMSettings) => void;
}

const PROVIDER_MODELS: Record<'anthropic' | 'openai' | 'gemini', string[]> = {
  anthropic: ['claude-3-7-sonnet', 'claude-3-5-sonnet', 'claude-3-haiku'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
};

export default function Settings({ isOpen, onClose, onSettingsSaved }: SettingsProps) {
  const [settings, setSettings] = useState<LLMSettings>(loadSettings());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: 'anthropic' | 'openai' | 'gemini') => {
    const models = PROVIDER_MODELS[provider];
    setSettings((prev) => ({
      ...prev,
      provider,
      model: models[0],
    }));
    setTestResult(null);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSavedToast(true);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    setTimeout(() => {
      setSavedToast(false);
    }, 2200);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkLLMConnection(settings);
      setTestResult({
        success: res.success,
        message: res.message,
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Could not connect to /api/v1/llm-check proxy endpoint.',
      });
    } finally {
      setTesting(false);
    }
  };

  const maskedKey = settings.apiKey
    ? `${settings.apiKey.slice(0, 7)}••••••••••••${settings.apiKey.slice(-4)}`
    : 'None configured';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Transient AI Gateway
              </span>
              <h2 id="settings-dialog-title" className="text-base font-semibold text-on-surface">
                LLM Inference Configuration
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close settings"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto font-body-md text-body-md text-on-surface">
          {/* Ephemeral Architecture Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low border border-surface-container">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">lock</span>
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface font-semibold block mb-0.5">Transient Header Relay Policy</strong>
              API credentials are never written into repo files, <code className="bg-surface-container px-1 py-0.5 rounded font-mono-data">.env</code>, or database storage. They are stored locally in your browser and transmitted securely via <code className="text-secondary font-mono-data font-semibold">x-llm-*</code> HTTP headers on each inference call.
            </div>
          </div>

          {/* Provider Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
              Inference Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`py-2 px-3 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5 ${
                  settings.provider === 'anthropic'
                    ? 'border-secondary bg-surface-container-low text-secondary font-semibold shadow-xs ring-1 ring-secondary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="text-xs font-semibold">Anthropic</span>
                <span className="text-[10px] text-on-surface-variant">Claude 3.7</span>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`py-2 px-3 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5 ${
                  settings.provider === 'openai'
                    ? 'border-secondary bg-surface-container-low text-secondary font-semibold shadow-xs ring-1 ring-secondary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="text-xs font-semibold">OpenAI</span>
                <span className="text-[10px] text-on-surface-variant">GPT-4o</span>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`py-2 px-3 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5 ${
                  settings.provider === 'gemini'
                    ? 'border-secondary bg-surface-container-low text-secondary font-semibold shadow-xs ring-1 ring-secondary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="text-xs font-semibold">Gemini</span>
                <span className="text-[10px] text-on-surface-variant">1.5 Pro</span>
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="model-select" className="text-xs font-semibold text-on-surface uppercase tracking-wider">
              Engine Model (x-llm-model)
            </label>
            <div className="relative flex items-center">
              <select
                id="model-select"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full h-9 pl-3 pr-8 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface appearance-none focus:outline-none focus:border-secondary font-mono-data"
              >
                {PROVIDER_MODELS[settings.provider].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 text-on-surface-variant text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* API Key Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="api-key-input" className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Provider Key (x-llm-key)
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-secondary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showKey ? 'visibility_off' : 'visibility'}
                </span>
                {showKey ? 'Mask Key' : 'Reveal Key'}
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                placeholder={`Paste your ${settings.provider} API secret key...`}
                value={settings.apiKey}
                onChange={(e) => {
                  setSettings({ ...settings, apiKey: e.target.value.trim() });
                  setTestResult(null);
                }}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface font-mono-data focus:outline-none focus:border-secondary"
              />
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Key remains stored in client localStorage under key <code className="font-mono-data text-primary">specforge_llm_settings</code>.
            </span>
          </div>

          {/* Live Request Header Preview */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-primary-container text-surface-bright">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-tertiary-fixed uppercase font-mono-data">
                HTTP Header Relay Preview
              </span>
              <span className="text-[10px] text-primary-fixed-dim font-mono-data">Outbound Request</span>
            </div>
            <div className="font-mono-data text-[11px] flex flex-col gap-1 text-surface-container-low">
              <div>
                <span className="text-secondary-fixed">x-llm-provider:</span> {settings.provider}
              </div>
              <div className="truncate">
                <span className="text-secondary-fixed">x-llm-key:</span>{' '}
                <span className="text-tertiary-fixed">{maskedKey}</span>
              </div>
              <div>
                <span className="text-secondary-fixed">x-llm-model:</span> {settings.model}
              </div>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border border-on-tertiary-container/30'
                  : 'bg-error-container text-on-error-container border border-error/30'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                {testResult.success ? 'verified' : 'error'}
              </span>
              <span className="leading-snug">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-container bg-surface-container-low">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="h-8 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${testing ? 'animate-spin' : ''}`}>
              {testing ? 'sync' : 'network_check'}
            </span>
            <span>{testing ? 'Verifying...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            {savedToast && (
              <span className="text-xs text-on-tertiary-container font-semibold flex items-center gap-1 animate-in fade-in">
                <span className="material-symbols-outlined text-[14px]">check</span> Saved
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
