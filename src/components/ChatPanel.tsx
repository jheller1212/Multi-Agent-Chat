import React, { useRef, useState, useEffect } from 'react';
import { Send, Download, Camera, RotateCcw, FileText, FileSpreadsheet, ChevronDown, MessageSquare, Table, Square, Link, Copy, FlaskConical, X as XIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ConversationDisplay } from './ConversationDisplay';
import { DataTable } from './DataTable';
import { InfoTooltip } from './InfoTooltip';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  userInput: string;
  onUserInputChange: (value: string) => void;
  onSendMessage: () => void;
  autoInteract: boolean;
  onAutoInteractChange: (value: boolean) => void;
  interactionCount: number;
  maxInteractions: number;
  onMaxInteractionsChange: (n: number) => void;
  responseDelay: number;
  onResponseDelayChange: (seconds: number) => void;
  delayVariance: boolean;
  onDelayVarianceChange: (v: boolean) => void;
  repetitionCount: number;
  onRepetitionCountChange: (n: number) => void;
  repetitionCurrent: number;
  saveHistory: boolean;
  onSaveHistoryChange: (v: boolean) => void;
  onExportTxt?: () => void;
  onExportCsv?: () => void;
  onResetChat?: () => void;
  onStop?: () => void;
  botName1: string;
  botName2: string;
  bubbleColor1: string;
  bubbleColor2: string;
  textColor1: string;
  textColor2: string;
  chatMode: boolean;
  onChatModeChange: (v: boolean) => void;
  // Research features (SPEC-02/03/04/06)
  sessionId?: string;
  conditionLabel?: string;
  botMode: 'symmetric' | 'asymmetric';
  onBotModeChange: (mode: 'symmetric' | 'asymmetric') => void;
  openingMessage: string;
  onOpeningMessageChange: (v: string) => void;
  stopKeywords: string;
  onStopKeywordsChange: (v: string) => void;
  onShareConfig: () => void;
  shareCopied: boolean;
  onSaveExperiment: () => void;
  onDownloadConfigJson: () => void;
  currentExperimentName?: string;
  onDetachExperiment?: () => void;
  runTokens?: string[];
  scenarioCards?: React.ReactNode;
}

export function ChatPanel({
  messages,
  isLoading,
  userInput,
  onUserInputChange,
  onSendMessage,
  autoInteract,
  onAutoInteractChange,
  interactionCount,
  maxInteractions,
  onMaxInteractionsChange,
  responseDelay,
  onResponseDelayChange,
  delayVariance,
  onDelayVarianceChange,
  repetitionCount,
  onRepetitionCountChange,
  repetitionCurrent,
  saveHistory,
  onSaveHistoryChange,
  onExportTxt,
  onExportCsv,
  onResetChat,
  onStop,
  botName1,
  botName2,
  bubbleColor1,
  bubbleColor2,
  textColor1,
  textColor2,
  sessionId,
  conditionLabel,
  botMode,
  onBotModeChange,
  openingMessage,
  onOpeningMessageChange,
  stopKeywords,
  onStopKeywordsChange,
  chatMode,
  onChatModeChange,
  onShareConfig,
  shareCopied,
  onSaveExperiment,
  onDownloadConfigJson,
  currentExperimentName,
  onDetachExperiment,
  runTokens,
  scenarioCards,
}: ChatPanelProps) {
  const conversationRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [screenshotting, setScreenshotting] = useState(false);
  const [tokenCopied, setTokenCopied] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowExportMenu(false); };
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showExportMenu]);

  useEffect(() => {
    if (!showShareMenu) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowShareMenu(false); };
    const handleClick = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showShareMenu]);

  const [activeTab, setActiveTab] = useState<'chat' | 'data'>('chat');

  const handleScreenshot = async () => {
    if (!conversationRef.current) return;
    setScreenshotting(true);
    setShowExportMenu(false);
    try {
      const canvas = await html2canvas(conversationRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai2ai-conversation-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch {
      // screenshot failed silently
    } finally {
      setScreenshotting(false);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setTokenCopied(token);
      setTimeout(() => setTokenCopied(null), 2000);
    });
  };

  const hasMessages = onExportTxt != null;

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col">

      {/* SPEC-02: participant / condition banner */}
      {(sessionId || conditionLabel) && (
        <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3">
          {sessionId    && <span>Participant: <strong>{sessionId}</strong></span>}
          {sessionId && conditionLabel && <span className="text-amber-400 dark:text-amber-600">·</span>}
          {conditionLabel && <span>Condition: <strong>{conditionLabel}</strong></span>}
        </div>
      )}

      {/* Header bar */}
      <div data-tour="chat-tabs" className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex gap-0.5 border border-gray-200 dark:border-gray-600 rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
                activeTab === 'data'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Table className="w-3 h-3" />
              Data
              {messages.filter(m => !m.hidden && m.role !== 'system').length > 0 && (
                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full px-1.5 font-medium text-[10px]">
                  {messages.filter(m => !m.hidden && m.role !== 'system').length}
                </span>
              )}
            </button>
          </div>

          <span className="text-sm text-gray-400 dark:text-gray-500">
            <span className="font-medium" style={{ color: textColor1 !== '#312E81' ? textColor1 : '#4338CA' }}>{botName1}</span>
            {botMode === 'asymmetric' && <span className="ml-1 text-[10px] text-amber-500 dark:text-amber-400">(I)</span>}
            <span className="mx-1.5">vs</span>
            <span className="font-medium" style={{ color: textColor2 !== '#064E3B' ? textColor2 : '#047857' }}>{botName2}</span>
            {botMode === 'asymmetric' && <span className="ml-1 text-[10px] text-sky-500 dark:text-sky-400">(R)</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && autoInteract && (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {repetitionCount > 1 && `Run ${repetitionCurrent + 1}/${repetitionCount} · `}
              Msg {Math.ceil((interactionCount + 1) / 2)}/{Math.ceil(maxInteractions / 2)}
            </span>
          )}

          {onResetChat && (
            <button
              onClick={onResetChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Clear chat display (data kept in history)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {/* Export dropdown */}
          {hasMessages && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10 overflow-hidden">
                  <button
                    onClick={() => { onExportTxt?.(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    Download .txt
                  </button>
                  <button
                    onClick={() => { onExportCsv?.(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    Download .csv
                  </button>
                  <button
                    onClick={handleScreenshot}
                    disabled={screenshotting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    {screenshotting ? 'Capturing…' : 'Screenshot (.png)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" ref={conversationRef}>
        {activeTab === 'chat' ? (
          <div className="p-4">
            <ConversationDisplay
              messages={messages}
              isLoading={isLoading}
              botName1={botName1}
              botName2={botName2}
              bubbleColor1={bubbleColor1}
              bubbleColor2={bubbleColor2}
              textColor1={textColor1}
              textColor2={textColor2}
              scenarioCards={scenarioCards}
            />
          </div>
        ) : (
          <DataTable messages={messages} botName1={botName1} botName2={botName2} />
        )}
      </div>

      {/* SPEC-02: run token display after conversation ends */}
      {runTokens && runTokens.length > 0 && (
        <div className="px-4 py-2 border-t dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mb-1">
            Run token{runTokens.length > 1 ? 's' : ''} — copy into your survey for record linkage
          </p>
          <div className="flex flex-col gap-1">
            {runTokens.map((token, i) => (
              <div key={token} className="flex items-center gap-2">
                {runTokens.length > 1 && (
                  <span className="text-[10px] text-indigo-400 w-8">Run {i + 1}</span>
                )}
                <code className="flex-1 text-[11px] font-mono bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded px-2 py-0.5 text-indigo-700 dark:text-indigo-300 truncate">
                  {token}
                </code>
                <button
                  onClick={() => copyToken(token)}
                  className="p-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  title="Copy token"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {tokenCopied === token && (
                  <span className="text-[10px] text-green-600 dark:text-green-400">Copied!</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t dark:border-gray-700 space-y-2">

        {/* Scenario prompt — hidden in asymmetric mode when an opening message is configured */}
        {!(botMode === 'asymmetric' && openingMessage.trim()) && (
          <div data-tour="chat-input" className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Scenario Prompt</span>
              <InfoTooltip text="Set the stage for the AI conversation. Describe a scenario, pose a question, or provide context that both bots will use as their starting point. Leave blank to let the system prompts guide the conversation from the start." />
              <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">Tip: avoid describing both bots here — configure each bot's role in their individual prompt fields.</span>
            </div>
            <div className="flex gap-3">
            <textarea
              rows={4}
              value={userInput}
              onChange={(e) => onUserInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              disabled={isLoading}
              placeholder={
                botMode === 'asymmetric'
                  ? 'Scenario prompt (optional — sets the scene for both bots before they start)'
                  : 'Scenario prompt (optional — sets the scene for the conversation, e.g. a question or topic)'
              }
              className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y min-h-[100px]"
            />
            {isLoading && onStop ? (
              <button
                onClick={onStop}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
                title="Stop after the current response finishes"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={onSendMessage}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg hover:from-orange-400 hover:to-sky-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? 'Thinking…' : messages.length === 0 ? 'Start Conversation' : 'Send'}
              </button>
            )}
            </div>
          </div>
        )}

        {/* Asymmetric mode: start button when opener is configured */}
        {botMode === 'asymmetric' && openingMessage.trim() && (
          <div className="flex gap-3">
            <div className="flex-1 px-3 py-2.5 border border-dashed border-amber-300 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 truncate">
              Scenario prompt: <em>{openingMessage.trim()}</em>
            </div>
            {isLoading && onStop ? (
              <button
                onClick={onStop}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={onSendMessage}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg hover:from-orange-400 hover:to-sky-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? 'Thinking…' : 'Start'}
              </button>
            )}
          </div>
        )}

        {/* Auto-interact controls */}
        <div data-tour="chat-controls" className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoInteract}
              onChange={(e) => onAutoInteractChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-interact
            <InfoTooltip text="When enabled, the two AIs automatically take turns responding to each other up to the messages-per-bot limit. Disable to trigger each response manually." />
          </label>

          {autoInteract && (
            <>
              <label className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Messages per bot</span>
                <input
                  type="number"
                  min="2"
                  max="25"
                  step="1"
                  value={Math.ceil(maxInteractions / 2)}
                  onChange={(e) => onMaxInteractionsChange(Math.max(2, Number(e.target.value)) * 2)}
                  className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <InfoTooltip text="How many times each bot responds per run (min 2). Set to 5 → Bot A speaks 5 times, Bot B speaks 5 times (10 total AI responses)." />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Delay</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={Math.min(responseDelay, 3)}
                  onChange={(e) => onResponseDelayChange(Number(e.target.value))}
                  className="w-24 accent-indigo-600"
                />
                <span className="tabular-nums w-10 text-right">{responseDelay}s</span>
                <InfoTooltip text="Fixed pause (in seconds) between each AI response. Useful for pacing the conversation or staying within API rate limits." />
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={delayVariance}
                  onChange={(e) => onDelayVarianceChange(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-500 dark:text-gray-400">Length-based delay</span>
                <InfoTooltip text="Adds extra delay proportional to the length of each message (approx. 0.05 s per word), simulating the time a human would take to read it." />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Repeat</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={repetitionCount}
                  onChange={(e) => onRepetitionCountChange(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">conversations</span>
                <InfoTooltip text="Run the same conversation from scratch this many times. Useful for generating multiple varied responses to the same opening prompt." />
              </label>
            </>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={chatMode}
              onChange={(e) => onChatModeChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-500 dark:text-gray-400">Chat mode</span>
            <InfoTooltip text="When enabled, appends an instruction to both bots asking them to reply in short, conversational sentences (1–2 sentences max). Your own prompts are always preserved." />
          </label>

          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={saveHistory}
              onChange={(e) => onSaveHistoryChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-500 dark:text-gray-400">Save to history</span>
            <InfoTooltip text="When disabled, this conversation is not written to the database. Nothing is stored server-side — useful for sensitive research data or private experiments." align="right" />
          </label>
        </div>

        {/* Research controls row */}
        <div className="flex flex-wrap items-start gap-x-5 gap-y-2.5 text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* SPEC-03: bot role mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Bot roles</span>
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden text-[11px]">
              <button
                onClick={() => onBotModeChange('symmetric')}
                className={`px-2.5 py-1 transition-colors ${
                  botMode === 'symmetric'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Symmetric
              </button>
              <button
                onClick={() => onBotModeChange('asymmetric')}
                className={`px-2.5 py-1 transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  botMode === 'asymmetric'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Asymmetric
              </button>
            </div>
            <InfoTooltip text="Symmetric: both bots are equal. Asymmetric: Bot A is the Initiator (speaks first); Bot B is the Responder. Roles are labelled in CSV exports. Use for negotiation or role-play research." />
          </div>

          {/* SPEC-03: scripted opening message for Bot A */}
          {botMode === 'asymmetric' && (
            <label className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Bot A opener</span>
              <input
                type="text"
                value={openingMessage}
                onChange={(e) => onOpeningMessageChange(e.target.value)}
                placeholder="Scripted first line (blank = AI generates)"
                className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <InfoTooltip text="Fixed first message from Bot A that does NOT count against the turn limit. Leave blank to let Bot A's AI generate its opening line from its system prompt." />
            </label>
          )}

          {/* SPEC-04: stop keywords */}
          <label className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Stop words</span>
            <input
              type="text"
              value={stopKeywords}
              onChange={(e) => onStopKeywordsChange(e.target.value)}
              placeholder="agreed, deal, accept"
              className="w-44 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <InfoTooltip text="Comma-separated keywords. If any bot's response contains one, the conversation stops immediately. The trigger is recorded in CSV exports as a dependent variable." />
          </label>

          {/* Active experiment badge */}
          {currentExperimentName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700 text-xs text-indigo-700 dark:text-indigo-300">
              <FlaskConical className="w-3 h-3 flex-shrink-0 text-indigo-500" />
              <span className="font-medium max-w-[120px] truncate">{currentExperimentName}</span>
              {onDetachExperiment && (
                <button onClick={onDetachExperiment} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 ml-0.5" title="Detach from experiment">
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Save / Share dropdown (SPEC-06) */}
          <div className="relative ml-auto" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(v => !v)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <Link className="w-3.5 h-3.5" />
              Save / Share
              <ChevronDown className="w-3 h-3" />
            </button>
            {showShareMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10 overflow-hidden">
                <button
                  onClick={() => { onSaveExperiment(); setShowShareMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                  <div>
                    <div className="font-medium">Save as experiment</div>
                    <div className="text-gray-400 dark:text-gray-500 text-[10px]">Save config to your account</div>
                  </div>
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={() => { onShareConfig(); setShowShareMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <Link className="w-3.5 h-3.5 text-gray-400" />
                  {shareCopied ? 'URL copied!' : 'Copy share URL'}
                </button>
                <button
                  onClick={() => { onDownloadConfigJson(); setShowShareMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Download as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
