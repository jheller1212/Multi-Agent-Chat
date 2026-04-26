import { useState, useEffect, useCallback } from 'react';
import { loadVault } from '../lib/apiKeyVault';
import { validateModelConfig } from '../lib/validation';
import { sc, scNum } from '../lib/configHelpers';
import type { AIModel } from '../types';

export interface BotConfigState {
  model1: AIModel;
  model2: AIModel;
  apiKey1: string;
  apiKey2: string;
  orgId1: string;
  orgId2: string;
  modelVersion1: string;
  modelVersion2: string;
  temperature1: number;
  temperature2: number;
  maxTokens1: number;
  maxTokens2: number;
  botName1: string;
  botName2: string;
  systemPrompt1: string;
  systemPrompt2: string;
  bubbleColor1: string;
  bubbleColor2: string;
  textColor1: string;
  textColor2: string;
}

export interface BotConfigActions {
  setModel1: (v: AIModel) => void;
  setModel2: (v: AIModel) => void;
  setApiKey1: (v: string) => void;
  setApiKey2: (v: string) => void;
  setOrgId1: (v: string) => void;
  setOrgId2: (v: string) => void;
  setModelVersion1: (v: string) => void;
  setModelVersion2: (v: string) => void;
  setTemperature1: (v: number) => void;
  setTemperature2: (v: number) => void;
  setMaxTokens1: (v: number) => void;
  setMaxTokens2: (v: number) => void;
  setBotName1: (v: string) => void;
  setBotName2: (v: string) => void;
  setSystemPrompt1: (v: string) => void;
  setSystemPrompt2: (v: string) => void;
  setBubbleColor1: (v: string) => void;
  setBubbleColor2: (v: string) => void;
  setTextColor1: (v: string) => void;
  setTextColor2: (v: string) => void;
}

interface UseBotConfigOptions {
  saved: Record<string, unknown> | null;
  sharedConfig?: Record<string, unknown>;
  chatMode: boolean;
}

export function useBotConfig({ saved, sharedConfig, chatMode }: UseBotConfigOptions) {
  const [model1, setModel1] = useState<AIModel>((sc(sharedConfig, 'm1') as AIModel) ?? saved?.model1 ?? 'gpt4');
  const [model2, setModel2] = useState<AIModel>((sc(sharedConfig, 'm2') as AIModel) ?? saved?.model2 ?? 'gpt4');
  const [apiKey1, setApiKey1] = useState<string>(() => {
    const vault = loadVault();
    const provider = (sc(sharedConfig, 'm1') as AIModel) ?? saved?.model1 ?? 'gpt4';
    return vault[provider as keyof typeof vault] || '';
  });
  const [apiKey2, setApiKey2] = useState<string>(() => {
    const vault = loadVault();
    const provider = (sc(sharedConfig, 'm2') as AIModel) ?? saved?.model2 ?? 'gpt4';
    return vault[provider as keyof typeof vault] || '';
  });
  const [orgId1, setOrgId1] = useState<string>('');
  const [orgId2, setOrgId2] = useState<string>('');
  const [modelVersion1, setModelVersion1] = useState<string>(sc(sharedConfig, 'mv1') ?? (saved?.modelVersion1 as string) ?? 'gpt-4o');
  const [modelVersion2, setModelVersion2] = useState<string>(sc(sharedConfig, 'mv2') ?? (saved?.modelVersion2 as string) ?? 'gpt-4o');
  const [temperature1, setTemperature1] = useState<number>(scNum(sharedConfig, 't1') ?? (saved?.temperature1 as number) ?? 0.7);
  const [temperature2, setTemperature2] = useState<number>(scNum(sharedConfig, 't2') ?? (saved?.temperature2 as number) ?? 0.7);
  const [maxTokens1, setMaxTokens1] = useState<number>(scNum(sharedConfig, 'mt1') ?? (saved?.maxTokens1 as number) ?? 2000);
  const [maxTokens2, setMaxTokens2] = useState<number>(scNum(sharedConfig, 'mt2') ?? (saved?.maxTokens2 as number) ?? 2000);
  const [botName1, setBotName1] = useState<string>(sc(sharedConfig, 'n1') ?? (saved?.botName1 as string) ?? 'AI #1');
  const [botName2, setBotName2] = useState<string>(sc(sharedConfig, 'n2') ?? (saved?.botName2 as string) ?? 'AI #2');
  const [systemPrompt1, setSystemPrompt1] = useState<string>(
    sc(sharedConfig, 'sp1') ?? (saved?.systemPrompt1 as string) ?? 'You are a helpful AI assistant with expertise in science and technology.'
  );
  const [systemPrompt2, setSystemPrompt2] = useState<string>(
    sc(sharedConfig, 'sp2') ?? (saved?.systemPrompt2 as string) ?? 'You are a creative AI assistant with expertise in arts and humanities.'
  );
  const [bubbleColor1, setBubbleColor1] = useState<string>(sc(sharedConfig, 'bc1') ?? (saved?.bubbleColor1 as string) ?? '#EEF2FF');
  const [bubbleColor2, setBubbleColor2] = useState<string>(sc(sharedConfig, 'bc2') ?? (saved?.bubbleColor2 as string) ?? '#ECFDF5');
  const [textColor1, setTextColor1] = useState<string>(sc(sharedConfig, 'tc1') ?? (saved?.textColor1 as string) ?? '#312E81');
  const [textColor2, setTextColor2] = useState<string>(sc(sharedConfig, 'tc2') ?? (saved?.textColor2 as string) ?? '#064E3B');

  // Re-sync API keys from vault when localStorage changes
  useEffect(() => {
    const syncKeysFromVault = () => {
      const vault = loadVault();
      if (vault[model1] && vault[model1] !== apiKey1) setApiKey1(vault[model1]);
      if (vault[model2] && vault[model2] !== apiKey2) setApiKey2(vault[model2]);
    };

    window.addEventListener('storage', syncKeysFromVault);
    const timer = setTimeout(syncKeysFromVault, 1500);
    const handleVisibility = () => { if (document.visibilityState === 'visible') syncKeysFromVault(); };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', syncKeysFromVault);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timer);
    };
  }, [model1, model2]); // eslint-disable-line react-hooks/exhaustive-deps

  const CHAT_MODE_INSTRUCTION = 'Reply in short, conversational sentences. Max 1–2 sentences per message. Write like a chat, not an essay.';

  const buildEffectivePrompt = useCallback((basePrompt: string, botSlot: 1 | 2): string => {
    let prompt = basePrompt;
    if (chatMode) {
      prompt += '\n\n' + CHAT_MODE_INSTRUCTION;
    }
    const myName = botSlot === 1 ? (botName1 || 'Bot A') : (botName2 || 'Bot B');
    const otherName = botSlot === 1 ? (botName2 || 'Bot B') : (botName1 || 'Bot A');
    prompt += `\n\nYou are only ${myName}. Never speak as, simulate, or continue the turn of ${otherName}. Wait for ${otherName}'s response. Stay in your role only.`;
    return prompt;
  }, [chatMode, botName1, botName2]);

  const validateConfigs = useCallback((setErrors: (errors: string[]) => void): boolean => {
    const e1 = validateModelConfig(model1, { apiKey: apiKey1, temperature: temperature1, maxTokens: maxTokens1 });
    const e2 = validateModelConfig(model2, { apiKey: apiKey2, temperature: temperature2, maxTokens: maxTokens2 });
    const all = [...e1, ...e2];
    setErrors(all);
    return all.length === 0;
  }, [model1, model2, apiKey1, apiKey2, temperature1, temperature2, maxTokens1, maxTokens2]);

  const state: BotConfigState = {
    model1, model2, apiKey1, apiKey2, orgId1, orgId2,
    modelVersion1, modelVersion2, temperature1, temperature2,
    maxTokens1, maxTokens2, botName1, botName2,
    systemPrompt1, systemPrompt2,
    bubbleColor1, bubbleColor2, textColor1, textColor2,
  };

  const actions: BotConfigActions = {
    setModel1, setModel2, setApiKey1, setApiKey2, setOrgId1, setOrgId2,
    setModelVersion1, setModelVersion2, setTemperature1, setTemperature2,
    setMaxTokens1, setMaxTokens2, setBotName1, setBotName2,
    setSystemPrompt1, setSystemPrompt2,
    setBubbleColor1, setBubbleColor2, setTextColor1, setTextColor2,
  };

  return { ...state, ...actions, buildEffectivePrompt, validateConfigs };
}
