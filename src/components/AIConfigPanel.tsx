import React, { useState, useEffect, useRef } from 'react';
import { Bot, History, Save } from 'lucide-react';
import { ModelConfig } from './ModelConfig';
import { InfoTooltip } from './InfoTooltip';
import { AIModel } from '../types';
import { supabase } from '../lib/supabase';
import { hashString } from '../lib/hash';

interface PromptVersion {
  id: string;
  content: string;
  hash: string;
  label: string;
  created_at: string;
}

interface AIConfigPanelProps {
  title: string;
  onTitleChange: (name: string) => void;
  model: AIModel;
  onModelChange: (model: AIModel) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  orgId: string;
  onOrgIdChange: (id: string) => void;
  modelVersion: string;
  onModelVersionChange: (version: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  maxTokens: number;
  onMaxTokensChange: (tokens: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  bubbleColor: string;
  onBubbleColorChange: (color: string) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  // SPEC-07: prompt version history
  userId: string;
  botSlot: 1 | 2;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function AIConfigPanel({
  title, onTitleChange, model, onModelChange, apiKey, onApiKeyChange,
  orgId, onOrgIdChange, modelVersion, onModelVersionChange,
  temperature, onTemperatureChange, maxTokens, onMaxTokensChange,
  systemPrompt, onSystemPromptChange,
  bubbleColor, onBubbleColorChange, textColor, onTextColorChange,
  userId, botSlot,
}: AIConfigPanelProps) {
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const versionPanelRef = useRef<HTMLDivElement>(null);

  // Load versions when panel opens
  useEffect(() => {
    if (!showVersions) return;
    supabase
      .from('prompt_versions')
      .select('id, content, hash, label, created_at')
      .eq('user_id', userId)
      .eq('bot_slot', botSlot)
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => setVersions((data as PromptVersion[]) ?? []));
  }, [showVersions, userId, botSlot]);

  // Close version panel on outside click
  useEffect(() => {
    if (!showVersions) return;
    const handler = (e: MouseEvent) => {
      if (versionPanelRef.current && !versionPanelRef.current.contains(e.target as Node)) {
        setShowVersions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVersions]);

  const handleSaveVersion = async () => {
    const trimmed = systemPrompt.trim();
    if (!trimmed) return;
    const hash = hashString(trimmed);
    // Skip if identical to latest version
    if (versions[0]?.hash === hash) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      return;
    }
    setSaving(true);
    await supabase.from('prompt_versions').insert({
      user_id: userId,
      bot_slot: botSlot,
      content: trimmed,
      hash,
      label: '',
    });
    // Reload versions list
    const { data } = await supabase
      .from('prompt_versions')
      .select('id, content, hash, label, created_at')
      .eq('user_id', userId)
      .eq('bot_slot', botSlot)
      .order('created_at', { ascending: false })
      .limit(15);
    setVersions((data as PromptVersion[]) ?? []);
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleRestoreVersion = (content: string) => {
    onSystemPromptChange(content);
    setShowVersions(false);
  };

  return (
    <div className="lab-panel p-5 text-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        <div className="flex flex-col w-full">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Bot name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={50}
            className="text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:outline-none w-full"
            placeholder="Bot name"
          />
        </div>
      </div>
      <ModelConfig
        label="Model Settings"
        model={model}
        onModelChange={onModelChange}
        apiKey={apiKey}
        onApiKeyChange={onApiKeyChange}
        orgId={orgId}
        onOrgIdChange={onOrgIdChange}
        modelVersion={modelVersion}
        onModelVersionChange={onModelVersionChange}
        temperature={temperature}
        onTemperatureChange={onTemperatureChange}
        maxTokens={maxTokens}
        onMaxTokensChange={onMaxTokensChange}
      />

      {/* System prompt with version history (SPEC-07) */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{botSlot === 1 ? 'Bot A' : 'Bot B'} Prompt</label>
            <InfoTooltip text="Instructions given to this AI at the start of every conversation. Use it to define the bot's persona, expertise, communication style, and any rules it should follow." />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleSaveVersion}
              disabled={saving || !systemPrompt.trim()}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                savedFlash
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40'
              }`}
              title="Save a version checkpoint of this prompt"
            >
              <Save className="w-3 h-3" />
              {savedFlash ? 'Saved!' : saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setShowVersions(v => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Browse prompt version history"
            >
              <History className="w-3 h-3" />
              History
            </button>
          </div>
        </div>

        {/* Version history panel */}
        {showVersions && (
          <div
            ref={versionPanelRef}
            className="mb-2 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-md"
          >
            {versions.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-3 text-center">
                No saved versions yet. Click "Save" to checkpoint the current prompt.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{formatDate(v.created_at)}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{v.content}</p>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(v.content)}
                      className="flex-shrink-0 text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          className="w-full p-3 border border-lab-border dark:border-gray-600 rounded-lab-btn min-h-[160px] text-sm font-mono focus:ring-2 focus:ring-lab-primary focus:border-transparent bg-lab-bg dark:bg-gray-700 text-lab-heading dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y"
          placeholder="Enter system prompt…"
        />
      </div>

      {/* Message appearance */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Message Appearance</p>
        <div className="flex gap-6">
          <label className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            Bubble color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bubbleColor}
                onChange={(e) => onBubbleColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
                title="Bubble background color"
              />
              <span className="font-mono text-gray-400 dark:text-gray-500">{bubbleColor}</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            Text color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
                title="Message text color"
              />
              <span className="font-mono text-gray-400 dark:text-gray-500">{textColor}</span>
            </div>
          </label>
        </div>
        <div
          className="mt-3 p-2 rounded text-xs"
          style={{ backgroundColor: bubbleColor, color: textColor }}
        >
          Preview: this is how messages will appear.
        </div>
      </div>
    </div>
  );
}
