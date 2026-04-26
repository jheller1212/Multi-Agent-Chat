import React, { useState } from 'react';
import { AIModel } from '../types';
import { Info } from 'lucide-react';
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { InfoTooltip } from './InfoTooltip';
import { loadVault } from '../lib/apiKeyVault';

interface ModelConfigProps {
  label: string;
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
  disabled?: boolean;
}

const PROVIDER_MODELS: Record<AIModel, { id: string; name: string; maxTokens: number }[]> = {
  gpt4: [
    { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
    { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16384 },
  ],
  claude: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Latest)', maxTokens: 16000 },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', maxTokens: 16000 },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', maxTokens: 16000 },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8192 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', maxTokens: 8192 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096 },
  ],
  gemini: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 8192 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 8192 },
    { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 2048 },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', maxTokens: 4096 },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', maxTokens: 4096 },
    { id: 'mistral-small-latest', name: 'Mistral Small', maxTokens: 4096 },
    { id: 'open-mistral-7b', name: 'Mistral 7B (Open)', maxTokens: 4096 },
  ],
};

const PROVIDER_LABELS: Record<AIModel, string> = {
  gpt4: 'OpenAI',
  claude: 'Anthropic Claude',
  gemini: 'Google Gemini',
  mistral: 'Mistral',
};

const API_KEY_PLACEHOLDERS: Record<AIModel, string> = {
  gpt4: 'sk-...',
  claude: 'sk-ant-...',
  gemini: 'AIza...',
  mistral: 'Your Mistral API key',
};

const API_KEY_INSTRUCTIONS: Record<AIModel, { url: string; label: string; steps: string[] }> = {
  gpt4: {
    url: 'https://platform.openai.com/api-keys',
    label: 'platform.openai.com',
    steps: ['Sign in or create an account', 'Go to API keys', 'Create new secret key'],
  },
  claude: {
    url: 'https://console.anthropic.com/settings/keys',
    label: 'console.anthropic.com',
    steps: ['Sign in or create an account', 'Go to API keys', 'Create new key'],
  },
  gemini: {
    url: 'https://aistudio.google.com/app/apikey',
    label: 'aistudio.google.com',
    steps: ['Sign in with Google', 'Click "Get API key"', 'Create API key'],
  },
  mistral: {
    url: 'https://console.mistral.ai/api-keys/',
    label: 'console.mistral.ai',
    steps: ['Sign in or create an account', 'Go to API keys', 'Create new key'],
  },
};

export function ModelConfig({
  label: _label,
  model,
  onModelChange,
  apiKey,
  onApiKeyChange,
  orgId: _orgId,
  onOrgIdChange: _onOrgIdChange,
  modelVersion,
  onModelVersionChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  disabled = false
}: ModelConfigProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  const versions = PROVIDER_MODELS[model];
  const currentMax = versions.find(v => v.id === modelVersion)?.maxTokens ?? 8192;

  const handleProviderChange = (newModel: AIModel) => {
    onModelChange(newModel);
    const firstVersion = PROVIDER_MODELS[newModel][0];
    onModelVersionChange(firstVersion.id);
    onMaxTokensChange(Math.min(maxTokens, firstVersion.maxTokens));
    const vaultKey = loadVault()[newModel];
    if (vaultKey) onApiKeyChange(vaultKey);
  };

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">AI Provider</label>
        <select
          value={model}
          onChange={(e) => handleProviderChange(e.target.value as AIModel)}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        >
          {(Object.keys(PROVIDER_LABELS) as AIModel[]).map((m) => (
            <option key={m} value={m}>{PROVIDER_LABELS[m]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">API Key</label>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
            onClick={() => setShowInstructions(true)}
            disabled={disabled}
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            How to get key
          </button>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder={API_KEY_PLACEHOLDERS[model]}
          disabled={disabled}
        />
        <p className="text-[11px] text-gray-400 dark:text-gray-500">Encrypted · persists across sessions</p>
      </div>

      {/* Organization ID removed — it causes silent failures with direct browser API calls */}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Model</label>
        <select
          value={modelVersion}
          onChange={(e) => {
            onModelVersionChange(e.target.value);
            const v = versions.find(v => v.id === e.target.value);
            if (v) onMaxTokensChange(Math.min(maxTokens, v.maxTokens));
          }}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Temperature ({temperature})</label>
          <InfoTooltip text="Controls how random the AI's output is. 0 = deterministic and focused (always picks the most likely word). Higher values produce more varied, creative responses. Values above 1 can become incoherent." />
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(Number(e.target.value))}
          aria-label={`Temperature: ${temperature}`}
          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Max Tokens (max: {currentMax.toLocaleString()})</label>
          <InfoTooltip text="The maximum number of tokens (roughly ¾ of a word each) the AI can generate per response. Higher values allow longer replies but cost more and take longer. Keep it lower to get concise answers." />
        </div>
        <input
          type="number"
          min="1"
          max={currentMax}
          value={maxTokens}
          onChange={(e) => {
            const v = Number(e.target.value);
            onMaxTokensChange(Math.max(1, Math.min(v, currentMax)));
          }}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        />
      </div>

      <ApiKeyInstructions
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        instructions={API_KEY_INSTRUCTIONS[model]}
        modelName={PROVIDER_LABELS[model]}
      />
    </div>
  );
}
