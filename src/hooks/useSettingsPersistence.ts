import { useState, useEffect } from 'react';
import { sc, scNum, scBool } from '../lib/configHelpers';

const STORAGE_KEY = 'ai2ai_settings';

export function loadSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface UseSettingsPersistenceOptions {
  saved: Record<string, unknown> | null;
  sharedConfig?: Record<string, unknown>;
}

export function useSettingsPersistence({ saved, sharedConfig }: UseSettingsPersistenceOptions) {
  const [responseDelay, setResponseDelay] = useState<number>(scNum(sharedConfig, 'rd') ?? (saved?.responseDelay as number) ?? 1);
  const [delayVariance, setDelayVariance] = useState<boolean>(scBool(sharedConfig, 'dv') ?? (saved?.delayVariance as boolean) ?? false);
  const [maxInteractions, setMaxInteractions] = useState<number>(Math.max(4, scNum(sharedConfig, 'mi') ?? (saved?.maxInteractions as number) ?? 10));
  const [repetitionCount, setRepetitionCount] = useState<number>(scNum(sharedConfig, 'rc') ?? (saved?.repetitionCount as number) ?? 1);
  const [botMode, setBotMode] = useState<'symmetric' | 'asymmetric'>(
    (sc(sharedConfig, 'bm') as 'symmetric' | 'asymmetric') ?? (saved?.botMode as string) ?? 'symmetric'
  );
  const [openingMessage, setOpeningMessage] = useState<string>(sc(sharedConfig, 'om') ?? (saved?.openingMessage as string) ?? '');
  const [stopKeywords, setStopKeywords] = useState<string>(sc(sharedConfig, 'sk') ?? (saved?.stopKeywords as string) ?? '');
  const [chatMode, setChatMode] = useState<boolean>((saved?.chatMode as boolean) ?? true);
  const [userInput, setUserInput] = useState('');
  const [autoInteract, setAutoInteract] = useState((saved?.autoInteract as boolean) ?? true);
  const [saveHistory, setSaveHistory] = useState<boolean>((saved?.saveHistory as boolean) ?? true);

  return {
    responseDelay, setResponseDelay,
    delayVariance, setDelayVariance,
    maxInteractions, setMaxInteractions,
    repetitionCount, setRepetitionCount,
    botMode, setBotMode,
    openingMessage, setOpeningMessage,
    stopKeywords, setStopKeywords,
    chatMode, setChatMode,
    userInput, setUserInput,
    autoInteract, setAutoInteract,
    saveHistory, setSaveHistory,
  };
}

/** Persist non-secret settings to localStorage. Call from a useEffect in the parent. */
export function persistSettings(values: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}
