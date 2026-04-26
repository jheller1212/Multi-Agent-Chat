import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Send } from 'lucide-react';
import { AIConfigPanel } from './AIConfigPanel';
import { ScenarioCards } from './ScenarioCards';
import { InfoTooltip } from './InfoTooltip';
import type { AIModel } from '../types';
import type { Scenario } from './ScenarioCards';

interface SetupPageProps {
  // Bot 1
  botName1: string; onBotName1Change: (v: string) => void;
  model1: AIModel; onModel1Change: (v: AIModel) => void;
  apiKey1: string; onApiKey1Change: (v: string) => void;
  orgId1: string; onOrgId1Change: (v: string) => void;
  modelVersion1: string; onModelVersion1Change: (v: string) => void;
  temperature1: number; onTemperature1Change: (v: number) => void;
  maxTokens1: number; onMaxTokens1Change: (v: number) => void;
  systemPrompt1: string; onSystemPrompt1Change: (v: string) => void;
  bubbleColor1: string; onBubbleColor1Change: (v: string) => void;
  textColor1: string; onTextColor1Change: (v: string) => void;
  // Bot 2
  botName2: string; onBotName2Change: (v: string) => void;
  model2: AIModel; onModel2Change: (v: AIModel) => void;
  apiKey2: string; onApiKey2Change: (v: string) => void;
  orgId2: string; onOrgId2Change: (v: string) => void;
  modelVersion2: string; onModelVersion2Change: (v: string) => void;
  temperature2: number; onTemperature2Change: (v: number) => void;
  maxTokens2: number; onMaxTokens2Change: (v: number) => void;
  systemPrompt2: string; onSystemPrompt2Change: (v: string) => void;
  bubbleColor2: string; onBubbleColor2Change: (v: string) => void;
  textColor2: string; onTextColor2Change: (v: string) => void;
  // Scenario
  userInput: string; onUserInputChange: (v: string) => void;
  // Advanced settings
  autoInteract: boolean; onAutoInteractChange: (v: boolean) => void;
  maxInteractions: number; onMaxInteractionsChange: (v: number) => void;
  responseDelay: number; onResponseDelayChange: (v: number) => void;
  delayVariance: boolean; onDelayVarianceChange: (v: boolean) => void;
  repetitionCount: number; onRepetitionCountChange: (v: number) => void;
  chatMode: boolean; onChatModeChange: (v: boolean) => void;
  saveHistory: boolean; onSaveHistoryChange: (v: boolean) => void;
  botMode: 'symmetric' | 'asymmetric'; onBotModeChange: (v: 'symmetric' | 'asymmetric') => void;
  openingMessage: string; onOpeningMessageChange: (v: string) => void;
  stopKeywords: string; onStopKeywordsChange: (v: string) => void;
  // Actions
  onStartConversation: () => void;
  onLoadScenario: (scenario: Scenario) => void;
  isLoading: boolean;
  // User context
  userId: string;
}

export function SetupPage(props: SetupPageProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Bot configuration panels — dual laboratory instruments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div data-tour="bot1-panel" className="relative before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-lab-primary/30">
            <AIConfigPanel
              title={props.botName1}
              onTitleChange={props.onBotName1Change}
              model={props.model1}
              onModelChange={props.onModel1Change}
              apiKey={props.apiKey1}
              onApiKeyChange={props.onApiKey1Change}
              orgId={props.orgId1}
              onOrgIdChange={props.onOrgId1Change}
              modelVersion={props.modelVersion1}
              onModelVersionChange={props.onModelVersion1Change}
              temperature={props.temperature1}
              onTemperatureChange={props.onTemperature1Change}
              maxTokens={props.maxTokens1}
              onMaxTokensChange={props.onMaxTokens1Change}
              systemPrompt={props.systemPrompt1}
              onSystemPromptChange={props.onSystemPrompt1Change}
              bubbleColor={props.bubbleColor1}
              onBubbleColorChange={props.onBubbleColor1Change}
              textColor={props.textColor1}
              onTextColorChange={props.onTextColor1Change}
              userId={props.userId}
              botSlot={1}
            />
          </div>
          <div data-tour="bot2-panel" className="relative before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-lab-accent/30">
            <AIConfigPanel
              title={props.botName2}
              onTitleChange={props.onBotName2Change}
              model={props.model2}
              onModelChange={props.onModel2Change}
              apiKey={props.apiKey2}
              onApiKeyChange={props.onApiKey2Change}
              orgId={props.orgId2}
              onOrgIdChange={props.onOrgId2Change}
              modelVersion={props.modelVersion2}
              onModelVersionChange={props.onModelVersion2Change}
              temperature={props.temperature2}
              onTemperatureChange={props.onTemperature2Change}
              maxTokens={props.maxTokens2}
              onMaxTokensChange={props.onMaxTokens2Change}
              systemPrompt={props.systemPrompt2}
              onSystemPromptChange={props.onSystemPrompt2Change}
              bubbleColor={props.bubbleColor2}
              onBubbleColorChange={props.onBubbleColor2Change}
              textColor={props.textColor2}
              onTextColorChange={props.onTextColor2Change}
              userId={props.userId}
              botSlot={2}
            />
          </div>
        </div>

        {/* Scenario prompt */}
        <div data-tour="chat-input" className="lab-panel p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Scenario Prompt</label>
            <InfoTooltip text="Set the stage for the AI conversation. Describe a scenario, pose a question, or provide context that both bots will use as their starting point." />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">Tip: avoid describing both bots here — configure each bot's role in their individual prompt fields above.</span>
          </div>
          <textarea
            rows={3}
            value={props.userInput}
            onChange={(e) => props.onUserInputChange(e.target.value)}
            placeholder="Describe a scenario, pose a question, or leave blank to let the system prompts guide the conversation..."
            className="w-full p-3 border border-lab-border dark:border-gray-600 rounded-lab-btn text-sm font-mono bg-lab-bg dark:bg-gray-700 text-lab-heading dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y min-h-[120px] focus:ring-2 focus:ring-lab-primary focus:border-transparent"
          />
        </div>

        {/* Advanced settings (collapsed by default) */}
        <div className="lab-panel">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-lab-heading dark:text-gray-200 hover:bg-lab-bg dark:hover:bg-gray-750 rounded-lab-card transition-colors"
          >
            <span>Advanced Settings</span>
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 space-y-4">
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
                {/* Auto-interact */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={props.autoInteract} onChange={e => props.onAutoInteractChange(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                  Auto-interact
                  <InfoTooltip text="When enabled, the two AIs automatically take turns responding to each other." />
                </label>

                {/* Chat mode */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={props.chatMode} onChange={e => props.onChatModeChange(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                  Chat mode
                  <InfoTooltip text="Appends an instruction to both bots asking them to reply in short, conversational sentences (1–2 sentences max)." />
                </label>

                {/* Save to history */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={props.saveHistory} onChange={e => props.onSaveHistoryChange(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                  Save to history
                  <InfoTooltip text="When disabled, this conversation is not written to the database." />
                </label>
              </div>

              {props.autoInteract && (
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
                  {/* Messages per bot */}
                  <label className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Messages per bot</span>
                    <input type="number" min="2" max="25" step="1"
                      value={Math.ceil(props.maxInteractions / 2)}
                      onChange={e => props.onMaxInteractionsChange(Math.max(2, Number(e.target.value)) * 2)}
                      className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                  </label>

                  {/* Delay */}
                  <label className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Delay</span>
                    <input type="range" min="0" max="3" step="0.5"
                      value={Math.min(props.responseDelay, 3)}
                      onChange={e => props.onResponseDelayChange(Number(e.target.value))}
                      className="w-20 accent-indigo-600" />
                    <span className="tabular-nums w-8 text-right">{props.responseDelay}s</span>
                  </label>

                  {/* Length-based delay */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={props.delayVariance} onChange={e => props.onDelayVarianceChange(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-gray-500 dark:text-gray-400">Length-based delay</span>
                  </label>

                  {/* Repeat */}
                  <label className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Repeat</span>
                    <input type="number" min="1" max="100" step="1"
                      value={props.repetitionCount}
                      onChange={e => props.onRepetitionCountChange(Math.max(1, Number(e.target.value)))}
                      className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                    <span className="text-gray-500 dark:text-gray-400">runs</span>
                  </label>
                </div>
              )}

              {/* Bot roles */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Bot roles</span>
                  <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden text-[11px]">
                    <button onClick={() => props.onBotModeChange('symmetric')}
                      className={`px-2.5 py-1 transition-colors ${props.botMode === 'symmetric' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      Symmetric
                    </button>
                    <button onClick={() => props.onBotModeChange('asymmetric')}
                      className={`px-2.5 py-1 transition-colors border-l border-gray-300 dark:border-gray-600 ${props.botMode === 'asymmetric' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      Asymmetric
                    </button>
                  </div>
                  <InfoTooltip text="Symmetric: both bots are equal. Asymmetric: Bot A is the Initiator; Bot B is the Responder." />
                </div>

                {props.botMode === 'asymmetric' && (
                  <label className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Bot A opener</span>
                    <input type="text" value={props.openingMessage} onChange={e => props.onOpeningMessageChange(e.target.value)}
                      placeholder="Scripted first line (blank = AI generates)"
                      className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                  </label>
                )}

                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Stop words</span>
                  <input type="text" value={props.stopKeywords} onChange={e => props.onStopKeywordsChange(e.target.value)}
                    placeholder="agreed, deal, accept"
                    className="w-44 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                  <InfoTooltip text="Comma-separated keywords. If any bot's response contains one, the conversation stops." />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Start button */}
        <div className="flex justify-center">
          <button
            onClick={props.onStartConversation}
            disabled={props.isLoading}
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-heading font-semibold text-white bg-lab-primary rounded-lab-btn hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lab-soft transition-all"
          >
            <Send className="w-4 h-4" />
            Start Conversation
          </button>
        </div>

        {/* Scenario quick-start cards */}
        <ScenarioCards onSelect={props.onLoadScenario} />

      </div>
    </div>
  );
}
