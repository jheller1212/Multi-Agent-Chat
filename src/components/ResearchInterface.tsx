import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hashString } from '../lib/hash';
import type { AIModel, Message } from '../types';
import { Header } from './Header';
import type { AppView } from './Header';
import { ErrorDisplay } from './ErrorDisplay';
import { ChatPanel } from './ChatPanel';
import { ScenarioCards } from './ScenarioCards';
import type { Scenario } from './ScenarioCards';
import { Dashboard } from './Dashboard';
import { SetupPage } from './SetupPage';
import { UserSettings } from './UserSettings';
import { ConversationHistory } from './ConversationHistory';
import { ExperimentsPanel } from './ExperimentsPanel';
import { OnboardingTour, shouldAutoShowTour, incrementTourCount, resetTourDismissed } from './OnboardingTour';
import { WorkshopBanner } from './WorkshopBanner';
import { WorkshopAdmin } from './WorkshopAdmin';
import { AdminDashboard } from './AdminDashboard';
import type { WorkshopData } from '../App';

import { useBotConfig } from '../hooks/useBotConfig';
import { useSettingsPersistence, loadSettings, persistSettings } from '../hooks/useSettingsPersistence';
import { useConversationEngine } from '../hooks/useConversationEngine';
import { useExperiments } from '../hooks/useExperiments';

interface ResearchInterfaceProps {
  onSignOut: () => Promise<void>;
  onBack: () => void;
  user: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  sessionId?: string;
  conditionLabel?: string;
  sharedConfig?: Record<string, unknown>;
  workshopData?: WorkshopData | null;
}

export function ResearchInterface({
  onSignOut, onBack, user, isDarkMode, onToggleDarkMode,
  sessionId, conditionLabel, sharedConfig, workshopData,
}: ResearchInterfaceProps) {
  const saved = loadSettings();

  // --- View routing ---
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (workshopData || sharedConfig) return 'setup';
    return 'dashboard';
  });
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExperiments, setShowExperiments] = useState(false);
  const [showWorkshopAdmin, setShowWorkshopAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showTour, setShowTour] = useState(() => {
    const show = shouldAutoShowTour();
    if (show) incrementTourCount();
    return show;
  });
  const [shareCopied, setShareCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // --- Custom hooks ---
  const bot = useBotConfig({ saved, sharedConfig, chatMode: true });
  const settings = useSettingsPersistence({ saved, sharedConfig });

  const experiments = useExperiments({
    userId: user.id,
    botConfigActions: bot,
    setMaxInteractions: settings.setMaxInteractions,
    setResponseDelay: settings.setResponseDelay,
    setDelayVariance: settings.setDelayVariance,
    setRepetitionCount: settings.setRepetitionCount,
    setBotMode: settings.setBotMode,
    setOpeningMessage: settings.setOpeningMessage,
    setStopKeywords: settings.setStopKeywords,
    getBotConfig: () => ({
      m1: bot.model1, mv1: bot.modelVersion1, t1: bot.temperature1, mt1: bot.maxTokens1,
      sp1: bot.systemPrompt1, n1: bot.botName1,
      m2: bot.model2, mv2: bot.modelVersion2, t2: bot.temperature2, mt2: bot.maxTokens2,
      sp2: bot.systemPrompt2, n2: bot.botName2,
      bc1: bot.bubbleColor1, bc2: bot.bubbleColor2, tc1: bot.textColor1, tc2: bot.textColor2,
    }),
    getSettingsConfig: () => ({
      mi: settings.maxInteractions, rd: settings.responseDelay, dv: settings.delayVariance,
      rc: settings.repetitionCount, bm: settings.botMode, om: settings.openingMessage,
      sk: settings.stopKeywords,
    }),
  });

  const engine = useConversationEngine({
    ...bot, ...settings,
    userId: user.id,
    currentExperimentId: experiments.currentExperimentId,
    buildEffectivePrompt: bot.buildEffectivePrompt,
    validateConfigs: bot.validateConfigs,
  });

  // --- Organizer check ---
  useEffect(() => {
    const checkOrganizer = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ action: 'check-organizer' }),
          }
        );
        if (resp.ok) {
          const result = await resp.json();
          if (result?.isOrganizer) setIsOrganizer(true);
        }
      } catch { /* ignore */ }
    };
    checkOrganizer();
  }, [user.email]);

  // --- Workshop mode ---
  const workshopAppliedRef = useRef(false);
  useEffect(() => {
    if (!workshopData || workshopAppliedRef.current) return;
    workshopAppliedRef.current = true;
    if (currentView === 'dashboard') setCurrentView('setup');

    if (workshopData.scenario) {
      const s = workshopData.scenario;
      if (s.botAPrompt) bot.setSystemPrompt1(s.botAPrompt);
      if (s.botBPrompt) bot.setSystemPrompt2(s.botBPrompt);
      if (s.sharedPrompt) settings.setUserInput(s.sharedPrompt);
      if (s.stopKeywords) settings.setStopKeywords(s.stopKeywords);
      if (s.botMode) settings.setBotMode(s.botMode);
    }

    if (workshopData.config) {
      const c = workshopData.config;
      if (c.m1) bot.setModel1(c.m1 as AIModel);
      if (c.m2) bot.setModel2(c.m2 as AIModel);
      if (c.mv1) bot.setModelVersion1(c.mv1 as string);
      if (c.mv2) bot.setModelVersion2(c.mv2 as string);
      if (typeof c.t1 === 'number') bot.setTemperature1(c.t1);
      if (typeof c.t2 === 'number') bot.setTemperature2(c.t2);
      if (c.n1) bot.setBotName1(c.n1 as string);
      if (c.n2) bot.setBotName2(c.n2 as string);
    }

    if (workshopData.apiKey) {
      bot.setApiKey1(workshopData.apiKey);
      bot.setApiKey2(workshopData.apiKey);
    }
  }, [workshopData]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Persist settings ---
  useEffect(() => {
    persistSettings({
      model1: bot.model1, model2: bot.model2,
      modelVersion1: bot.modelVersion1, modelVersion2: bot.modelVersion2,
      temperature1: bot.temperature1, temperature2: bot.temperature2,
      maxTokens1: bot.maxTokens1, maxTokens2: bot.maxTokens2,
      botName1: bot.botName1, botName2: bot.botName2,
      systemPrompt1: bot.systemPrompt1, systemPrompt2: bot.systemPrompt2,
      bubbleColor1: bot.bubbleColor1, bubbleColor2: bot.bubbleColor2,
      textColor1: bot.textColor1, textColor2: bot.textColor2,
      responseDelay: settings.responseDelay, delayVariance: settings.delayVariance,
      autoInteract: settings.autoInteract, maxInteractions: settings.maxInteractions,
      repetitionCount: settings.repetitionCount, saveHistory: settings.saveHistory,
      botMode: settings.botMode, openingMessage: settings.openingMessage,
      stopKeywords: settings.stopKeywords, chatMode: settings.chatMode,
    });
  }, [bot.model1, bot.model2, bot.modelVersion1, bot.modelVersion2,
      bot.temperature1, bot.temperature2, bot.maxTokens1, bot.maxTokens2,
      bot.botName1, bot.botName2, bot.systemPrompt1, bot.systemPrompt2,
      bot.bubbleColor1, bot.bubbleColor2, bot.textColor1, bot.textColor2,
      settings.responseDelay, settings.delayVariance, settings.autoInteract,
      settings.maxInteractions, settings.repetitionCount, settings.saveHistory,
      settings.botMode, settings.openingMessage, settings.stopKeywords, settings.chatMode]);

  // --- Scenario loading ---
  const handleLoadScenario = (scenario: Scenario) => {
    bot.setSystemPrompt1(scenario.botAPrompt);
    bot.setSystemPrompt2(scenario.botBPrompt);
    settings.setUserInput(scenario.sharedPrompt);
    settings.setStopKeywords(scenario.stopKeywords);
    settings.setBotMode(scenario.botMode);
  };

  // --- Export / Share handlers ---
  const handleExportTxt = () => {
    const lines = engine.messages
      .filter(m => m.role !== 'system' && !m.hidden)
      .map(m => {
        const label = m.role === 'user' ? 'User' : (m.botIndex === 1 ? bot.botName1 : bot.botName2);
        return `[${label}]\n${m.content}`;
      });
    const blob = new Blob([lines.join('\n\n---\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvField = (val: string) => {
      let s = String(val);
      if (s.match(/^[=+\-@]/)) s = `'${s}`;
      s = s.replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
      return `"${s.replace(/"/g, '""')}"`;
    };

    const visibleMessages = engine.messages.filter(m => m.role !== 'system' && !m.hidden);

    const finalTurnByConv: Record<string, number> = {};
    visibleMessages.forEach(m => {
      if (m.conversationId) finalTurnByConv[m.conversationId] = (finalTurnByConv[m.conversationId] ?? 0) + 1;
    });

    const headers = [
      'experiment_id', 'experiment_name',
      'session_id', 'condition_label', 'repetition_number',
      'conversation_id', 'timestamp', 'sender', 'bot_role',
      'system_prompt_hash', 'model', 'temperature',
      'content', 'words', 'response_time_ms',
      'stopping_trigger', 'final_turn_number',
    ];

    const rows: string[][] = [headers];

    visibleMessages.forEach(m => {
      const label = m.role === 'user' ? 'User' : (m.botIndex === 1 ? bot.botName1 : bot.botName2);
      const fallbackPrompt = m.botIndex === 1 ? bot.systemPrompt1 : m.botIndex === 2 ? bot.systemPrompt2 : '';
      const fallbackModel  = m.botIndex === 1 ? bot.modelVersion1 : m.botIndex === 2 ? bot.modelVersion2 : '';
      const fallbackTemp   = m.botIndex === 1 ? bot.temperature1  : m.botIndex === 2 ? bot.temperature2  : '';
      const botRole = settings.botMode === 'asymmetric'
        ? (m.botIndex === 1 ? 'initiator' : m.botIndex === 2 ? 'responder' : '')
        : '';
      const promptText = m.systemPrompt ?? fallbackPrompt;
      const promptHash = promptText ? hashString(promptText) : '';
      const convId = m.conversationId ?? '';

      rows.push([
        csvField(experiments.currentExperimentId ?? ''),
        csvField(experiments.currentExperimentName ?? ''),
        csvField(sessionId ?? ''),
        csvField(conditionLabel ?? ''),
        csvField(String(m.repetitionNumber ?? 0)),
        csvField(convId),
        csvField(new Date(m.timestamp).toISOString()),
        csvField(label),
        csvField(botRole),
        csvField(promptHash),
        csvField(m.modelVersion ?? String(fallbackModel)),
        csvField(String(m.temperature ?? fallbackTemp)),
        csvField(m.content),
        csvField(String(m.wordCount ?? '')),
        csvField(String(m.timeTaken ?? '')),
        csvField(engine.stoppingTriggers[convId] ?? ''),
        csvField(String(finalTurnByConv[convId] ?? '')),
      ]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-conversation-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const configPayload = useCallback(() => ({
    m1: bot.model1, mv1: bot.modelVersion1, t1: bot.temperature1, mt1: bot.maxTokens1,
    sp1: bot.systemPrompt1, n1: bot.botName1,
    m2: bot.model2, mv2: bot.modelVersion2, t2: bot.temperature2, mt2: bot.maxTokens2,
    sp2: bot.systemPrompt2, n2: bot.botName2,
    mi: settings.maxInteractions, rd: settings.responseDelay, dv: settings.delayVariance,
    rc: settings.repetitionCount, bm: settings.botMode, om: settings.openingMessage,
    sk: settings.stopKeywords,
    bc1: bot.bubbleColor1, bc2: bot.bubbleColor2, tc1: bot.textColor1, tc2: bot.textColor2,
  }), [bot.model1, bot.modelVersion1, bot.temperature1, bot.maxTokens1, bot.systemPrompt1, bot.botName1,
       bot.model2, bot.modelVersion2, bot.temperature2, bot.maxTokens2, bot.systemPrompt2, bot.botName2,
       settings.maxInteractions, settings.responseDelay, settings.delayVariance, settings.repetitionCount,
       settings.botMode, settings.openingMessage, settings.stopKeywords,
       bot.bubbleColor1, bot.bubbleColor2, bot.textColor1, bot.textColor2]);

  const handleShareConfig = useCallback(() => {
    const encoded = btoa(JSON.stringify(configPayload()));
    const url = `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [configPayload]);

  const handleDownloadConfigJson = useCallback(() => {
    const payload = configPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [configPayload]);

  const runTokens = [...new Set(
    engine.messages.filter(m => m.conversationId).map(m => m.conversationId!)
  )];

  const hasMessages = engine.messages.filter(m => !m.hidden && m.role !== 'system').length > 0;

  const navigateAwayFromChat = (destination: () => void) => {
    if (currentView === 'chat' && hasMessages) {
      setPendingNavigation(() => destination);
      setShowLeaveConfirm(true);
    } else {
      destination();
    }
  };

  const confirmLeave = (save: boolean) => {
    if (save) {
      // History is already saved to Supabase if saveHistory is on — just export as txt as a local backup
      handleExportTxt();
    }
    engine.handleResetChat();
    setShowLeaveConfirm(false);
    pendingNavigation?.();
    setPendingNavigation(null);
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
  };

  const handleNavigateBack = () => {
    if (currentView === 'chat') {
      navigateAwayFromChat(() => setCurrentView('setup'));
    } else if (currentView === 'setup') {
      setCurrentView('dashboard');
    } else {
      onBack();
    }
  };

  const visibleMsgCount = engine.messages.filter(m => !m.hidden && m.role !== 'system').length;

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-950 flex flex-col overflow-hidden">
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
      {workshopData && <WorkshopBanner name={workshopData.name} welcome={workshopData.welcome} />}
      <Header
        currentView={currentView}
        onNavigateBack={handleNavigateBack}
        onNavigateHome={() => navigateAwayFromChat(() => setCurrentView('dashboard'))}
        onSignOut={onSignOut}
        onOpenUserSettings={() => setShowUserSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenExperiments={() => setShowExperiments(true)}
        user={user}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      {showUserSettings && (
        <UserSettings
          user={user}
          onClose={() => setShowUserSettings(false)}
          onOpenHistory={() => { setShowUserSettings(false); setShowHistory(true); }}
          onDataDeleted={() => { engine.setMessages([]); setShowUserSettings(false); }}
          onAccountDeleted={() => { onSignOut(); }}
          onRewatchTour={() => { resetTourDismissed(); incrementTourCount(); setCurrentView('setup'); setShowTour(true); }}
          isOrganizer={isOrganizer}
          onOpenWorkshops={() => { setShowUserSettings(false); setShowWorkshopAdmin(true); }}
          onOpenAdmin={() => { setShowUserSettings(false); setShowAdminDashboard(true); }}
        />
      )}

      {showWorkshopAdmin && <WorkshopAdmin onClose={() => setShowWorkshopAdmin(false)} />}
      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}

      {showHistory && (
        <ConversationHistory
          userId={user.id}
          onClose={() => setShowHistory(false)}
          onLoad={(loaded) => { engine.setMessages(loaded); setCurrentView('chat'); }}
        />
      )}

      {showExperiments && (
        <ExperimentsPanel
          userId={user.id}
          onClose={() => setShowExperiments(false)}
          onLoad={(exp) => { experiments.handleLoadExperiment(exp); setCurrentView('setup'); }}
        />
      )}

      {/* Save experiment dialog */}
      {experiments.showSaveExperiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Save Experiment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={experiments.saveExpName}
                  onChange={e => experiments.setSaveExpName(e.target.value)}
                  placeholder="e.g. Algorithm Aversion Study — Condition A"
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Condition label</label>
                <input
                  type="text"
                  value={experiments.saveExpCondition}
                  onChange={e => experiments.setSaveExpCondition(e.target.value)}
                  placeholder="e.g. Condition A"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Notes</label>
                <textarea
                  value={experiments.saveExpDesc}
                  onChange={e => experiments.setSaveExpDesc(e.target.value)}
                  placeholder="Pilot details, hypothesis, changes from last version…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => experiments.setShowSaveExperiment(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={experiments.handleSaveExperimentConfirm}
                disabled={!experiments.saveExpName.trim() || experiments.savingExp}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {experiments.savingExp ? 'Saving…' : 'Save experiment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave conversation confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Leave conversation?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              {settings.saveHistory
                ? 'Your conversation is saved to history. Would you also like to download a local copy before leaving?'
                : 'This conversation will be lost. Would you like to download it before leaving?'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelLeave}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Stay
              </button>
              <button
                onClick={() => confirmLeave(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Leave
              </button>
              <button
                onClick={() => confirmLeave(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Save & leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === VIEW ROUTING === */}

      {currentView === 'dashboard' && (
        <Dashboard
          userId={user.id}
          onNewConversation={() => { engine.handleResetChat(); setCurrentView('setup'); }}
          onLoadExperiment={(exp) => { experiments.handleLoadExperiment(exp); setCurrentView('setup'); }}
          onLoadScenario={(s) => { handleLoadScenario(s); setCurrentView('setup'); }}
          onOpenHistory={() => setShowHistory(true)}
          onOpenExperiments={() => setShowExperiments(true)}
        />
      )}

      {currentView === 'setup' && (
        <SetupPage
          botName1={bot.botName1} onBotName1Change={bot.setBotName1}
          model1={bot.model1} onModel1Change={bot.setModel1}
          apiKey1={bot.apiKey1} onApiKey1Change={bot.setApiKey1}
          orgId1={bot.orgId1} onOrgId1Change={bot.setOrgId1}
          modelVersion1={bot.modelVersion1} onModelVersion1Change={bot.setModelVersion1}
          temperature1={bot.temperature1} onTemperature1Change={bot.setTemperature1}
          maxTokens1={bot.maxTokens1} onMaxTokens1Change={bot.setMaxTokens1}
          systemPrompt1={bot.systemPrompt1} onSystemPrompt1Change={bot.setSystemPrompt1}
          bubbleColor1={bot.bubbleColor1} onBubbleColor1Change={bot.setBubbleColor1}
          textColor1={bot.textColor1} onTextColor1Change={bot.setTextColor1}
          botName2={bot.botName2} onBotName2Change={bot.setBotName2}
          model2={bot.model2} onModel2Change={bot.setModel2}
          apiKey2={bot.apiKey2} onApiKey2Change={bot.setApiKey2}
          orgId2={bot.orgId2} onOrgId2Change={bot.setOrgId2}
          modelVersion2={bot.modelVersion2} onModelVersion2Change={bot.setModelVersion2}
          temperature2={bot.temperature2} onTemperature2Change={bot.setTemperature2}
          maxTokens2={bot.maxTokens2} onMaxTokens2Change={bot.setMaxTokens2}
          systemPrompt2={bot.systemPrompt2} onSystemPrompt2Change={bot.setSystemPrompt2}
          bubbleColor2={bot.bubbleColor2} onBubbleColor2Change={bot.setBubbleColor2}
          textColor2={bot.textColor2} onTextColor2Change={bot.setTextColor2}
          userInput={settings.userInput} onUserInputChange={settings.setUserInput}
          autoInteract={settings.autoInteract} onAutoInteractChange={settings.setAutoInteract}
          maxInteractions={settings.maxInteractions} onMaxInteractionsChange={settings.setMaxInteractions}
          responseDelay={settings.responseDelay} onResponseDelayChange={settings.setResponseDelay}
          delayVariance={settings.delayVariance} onDelayVarianceChange={settings.setDelayVariance}
          repetitionCount={settings.repetitionCount} onRepetitionCountChange={settings.setRepetitionCount}
          chatMode={settings.chatMode} onChatModeChange={settings.setChatMode}
          saveHistory={settings.saveHistory} onSaveHistoryChange={settings.setSaveHistory}
          botMode={settings.botMode} onBotModeChange={settings.setBotMode}
          openingMessage={settings.openingMessage} onOpeningMessageChange={settings.setOpeningMessage}
          stopKeywords={settings.stopKeywords} onStopKeywordsChange={settings.setStopKeywords}
          onStartConversation={() => engine.handleSendMessage(settings.userInput, setCurrentView)}
          onLoadScenario={handleLoadScenario}
          isLoading={engine.isLoading}
          userId={user.id}
        />
      )}

      {currentView === 'chat' && (
        <main className="flex-1 min-h-0 w-full px-2 sm:px-4 lg:px-6 py-3 overflow-hidden">
          <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0 overflow-hidden h-full">
            <ErrorDisplay errors={engine.errors} onClear={() => engine.setErrors([])} />
            <ChatPanel
              messages={engine.messages}
              isLoading={engine.isLoading}
              userInput={settings.userInput}
              onUserInputChange={settings.setUserInput}
              onSendMessage={() => engine.handleSendMessage(settings.userInput, setCurrentView)}
              autoInteract={settings.autoInteract}
              onAutoInteractChange={settings.setAutoInteract}
              interactionCount={engine.interactionCount}
              maxInteractions={settings.maxInteractions}
              onMaxInteractionsChange={settings.setMaxInteractions}
              responseDelay={settings.responseDelay}
              onResponseDelayChange={settings.setResponseDelay}
              delayVariance={settings.delayVariance}
              onDelayVarianceChange={settings.setDelayVariance}
              repetitionCount={settings.repetitionCount}
              onRepetitionCountChange={settings.setRepetitionCount}
              repetitionCurrent={engine.repetitionCurrent}
              onExportTxt={visibleMsgCount > 0 ? handleExportTxt : undefined}
              onExportCsv={visibleMsgCount > 0 ? handleExportCsv : undefined}
              onResetChat={engine.messages.length > 0 ? engine.handleResetChat : undefined}
              onStop={engine.isLoading ? engine.handleStop : undefined}
              chatMode={settings.chatMode}
              onChatModeChange={settings.setChatMode}
              saveHistory={settings.saveHistory}
              onSaveHistoryChange={settings.setSaveHistory}
              botName1={bot.botName1}
              botName2={bot.botName2}
              bubbleColor1={bot.bubbleColor1}
              bubbleColor2={bot.bubbleColor2}
              textColor1={bot.textColor1}
              textColor2={bot.textColor2}
              sessionId={sessionId}
              conditionLabel={conditionLabel}
              botMode={settings.botMode}
              onBotModeChange={settings.setBotMode}
              openingMessage={settings.openingMessage}
              onOpeningMessageChange={settings.setOpeningMessage}
              stopKeywords={settings.stopKeywords}
              onStopKeywordsChange={settings.setStopKeywords}
              onShareConfig={handleShareConfig}
              shareCopied={shareCopied}
              onSaveExperiment={() => experiments.setShowSaveExperiment(true)}
              onDownloadConfigJson={handleDownloadConfigJson}
              currentExperimentName={experiments.currentExperimentName || undefined}
              onDetachExperiment={experiments.currentExperimentId ? experiments.detachExperiment : undefined}
              runTokens={sessionId && !engine.isLoading && runTokens.length > 0 ? runTokens : undefined}
              scenarioCards={engine.messages.length === 0 ? <ScenarioCards onSelect={handleLoadScenario} /> : undefined}
            />
          </div>
        </main>
      )}
    </div>
  );
}
