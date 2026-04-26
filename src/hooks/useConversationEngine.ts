import { useState, useRef, useEffect, useCallback } from 'react';
import { generateResponse } from '../lib/api/conversation';
import { supabase } from '../lib/supabase';
import type { AIModel, Message, ChatConfig } from '../types';

interface ConversationEngineOptions {
  // Bot config
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
  // Settings
  autoInteract: boolean;
  maxInteractions: number;
  responseDelay: number;
  delayVariance: boolean;
  repetitionCount: number;
  stopKeywords: string;
  saveHistory: boolean;
  botMode: 'symmetric' | 'asymmetric';
  openingMessage: string;
  chatMode: boolean;
  // Context
  userId: string;
  currentExperimentId: string | null;
  // Callbacks
  buildEffectivePrompt: (basePrompt: string, botSlot: 1 | 2) => string;
  validateConfigs: (setErrors: (errors: string[]) => void) => boolean;
}

export function useConversationEngine(opts: ConversationEngineOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [interactionCount, setInteractionCount] = useState(0);
  const [repetitionCurrent, setRepetitionCurrent] = useState(0);
  const [stoppingTriggers, setStoppingTriggers] = useState<Record<string, string>>({});

  // Refs for latest values in async callbacks
  const autoInteractRef = useRef(opts.autoInteract);
  const maxInteractionsRef = useRef(opts.maxInteractions);
  const responseDelayRef = useRef(opts.responseDelay);
  const delayVarianceRef = useRef(opts.delayVariance);
  const repetitionCountRef = useRef(opts.repetitionCount);
  const repetitionCurrentRef = useRef(0);
  const stopKeywordsRef = useRef(opts.stopKeywords);
  const initialChainRef = useRef<{
    userMsg: string;
    allMessages: Message[];
    localConversationId: string;
    bot1StartsFirst: boolean;
  } | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { autoInteractRef.current = opts.autoInteract; }, [opts.autoInteract]);
  useEffect(() => { maxInteractionsRef.current = opts.maxInteractions; }, [opts.maxInteractions]);
  useEffect(() => { responseDelayRef.current = opts.responseDelay; }, [opts.responseDelay]);
  useEffect(() => { delayVarianceRef.current = opts.delayVariance; }, [opts.delayVariance]);
  useEffect(() => { repetitionCountRef.current = opts.repetitionCount; }, [opts.repetitionCount]);
  useEffect(() => { stopKeywordsRef.current = opts.stopKeywords; }, [opts.stopKeywords]);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    };
  }, []);

  const saveMessageToDb = (conversationId: string, msg: Message, role: string, modelLabel: string) => {
    if (msg.hidden || !opts.saveHistory) return;
    supabase.from('messages').insert({
      conversation_id: conversationId,
      role,
      model: modelLabel,
      content: msg.content,
      word_count: msg.wordCount ?? 0,
      time_taken: msg.timeTaken ?? 0,
    });
  };

  const createConversationRecord = async (title: string, id: string): Promise<string | null> => {
    if (!opts.saveHistory) return id;
    const row: Record<string, unknown> = {
      id,
      user_id: opts.userId,
      title: title.slice(0, 80) || '(Auto-started conversation)',
      model1_type: opts.model1, model1_version: opts.modelVersion1,
      model1_temperature: opts.temperature1, model1_max_tokens: opts.maxTokens1,
      model2_type: opts.model2, model2_version: opts.modelVersion2,
      model2_temperature: opts.temperature2, model2_max_tokens: opts.maxTokens2,
      interaction_limit: maxInteractionsRef.current,
    };
    if (opts.currentExperimentId) row.experiment_id = opts.currentExperimentId;
    const { data, error } = await supabase.from('conversations').insert(row).select('id').single();
    if (error) {
      setErrors(prev => [...prev, `History unavailable: ${error.message}`]);
      return null;
    }
    return data?.id ?? null;
  };

  const generateAIResponse = useCallback(async (
    config: ChatConfig,
    currentMessages: Message[],
    isFirstAI: boolean,
    dbConversationId: string | null,
    localConversationId: string,
    currentCount: number,
    repetitionIndex: number,
    onChainComplete: (trigger: string) => void,
  ): Promise<void> => {
    try {
      const myBotIndex: 1 | 2 = isFirstAI ? 1 : 2;

      const remappedMessages = currentMessages.map(m => {
        if (m.role !== 'assistant') return m;
        return { ...m, role: (m.botIndex === myBotIndex ? 'assistant' : 'user') as const };
      });

      if (isStoppedRef.current) { setIsLoading(false); return; }

      const ac = new AbortController();
      abortControllerRef.current = ac;
      const response = await generateResponse(config, remappedMessages, ac.signal);
      abortControllerRef.current = null;

      if (isStoppedRef.current) { setIsLoading(false); return; }

      const taggedResponse: Message = {
        ...response,
        botIndex: myBotIndex,
        modelVersion: config.modelVersion,
        temperature: config.temperature,
        systemPrompt: config.systemPrompt,
        conversationId: localConversationId,
        repetitionNumber: repetitionIndex,
      };

      setMessages(prev => [...prev, taggedResponse]);

      if (dbConversationId) {
        saveMessageToDb(dbConversationId, taggedResponse, 'assistant', isFirstAI ? opts.botName1 : opts.botName2);
      }

      // Check stop keywords
      const keywords = stopKeywordsRef.current.split(',').map(k => k.trim()).filter(Boolean);
      if (keywords.length > 0 && !isStoppedRef.current) {
        const lower = taggedResponse.content.toLowerCase();
        const matched = keywords.find(k => lower.includes(k.toLowerCase()));
        if (matched) {
          setStoppingTriggers(prev => ({ ...prev, [localConversationId]: `keyword:${matched}` }));
          onChainComplete(`keyword:${matched}`);
          return;
        }
      }

      if (autoInteractRef.current && currentCount < maxInteractionsRef.current - 1 && !isStoppedRef.current) {
        const otherConfig: ChatConfig = isFirstAI ? {
          model: opts.model2, apiKey: opts.apiKey2, orgId: opts.orgId2,
          modelVersion: opts.modelVersion2, temperature: opts.temperature2,
          maxTokens: opts.maxTokens2, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt2, 2),
        } : {
          model: opts.model1, apiKey: opts.apiKey1, orgId: opts.orgId1,
          modelVersion: opts.modelVersion1, temperature: opts.temperature1,
          maxTokens: opts.maxTokens1, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt1, 1),
        };

        const prevWords = taggedResponse.wordCount ?? 0;
        const computedDelay = delayVarianceRef.current
          ? (responseDelayRef.current + prevWords * 0.05) * 1000
          : responseDelayRef.current * 1000;

        pendingTimeoutRef.current = setTimeout(() => {
          setInteractionCount(currentCount + 1);
          generateAIResponse(
            otherConfig, [...currentMessages, taggedResponse], !isFirstAI,
            dbConversationId, localConversationId, currentCount + 1, repetitionIndex, onChainComplete,
          );
        }, computedDelay);
      } else {
        setStoppingTriggers(prev => ({ ...prev, [localConversationId]: 'turn_count' }));
        onChainComplete('turn_count');
      }
    } catch (error) {
      let msg = error instanceof Error
        ? (error.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message)
        : 'An unknown error occurred';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        msg += ' — Troubleshooting: (1) Is your API key copied correctly and complete? (2) Is the key still active and not expired? (3) Does your API account have available credits? (4) Check your browser console for CORS errors.';
      }
      setErrors([msg]);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.botName1, opts.botName2, opts.model1, opts.model2, opts.apiKey1, opts.apiKey2,
      opts.orgId1, opts.orgId2, opts.modelVersion1, opts.modelVersion2,
      opts.temperature1, opts.temperature2, opts.maxTokens1, opts.maxTokens2,
      opts.systemPrompt1, opts.systemPrompt2, opts.buildEffectivePrompt]);

  const startChain = useCallback(async (
    userMsg: string,
    baseMessages: Message[],
    repetitionIndex: number,
    localConversationId: string,
    bot1StartsFirst: boolean,
  ) => {
    const dbConversationId = await createConversationRecord(userMsg, localConversationId);

    if (userMsg && dbConversationId) {
      const userMessage = baseMessages.find(m => m.role === 'user' && !m.hidden && m.content === userMsg);
      if (userMessage) {
        supabase.from('messages').insert({
          conversation_id: dbConversationId,
          role: 'user',
          model: 'User',
          content: userMsg,
          word_count: userMsg.split(/\s+/).filter(Boolean).length,
        });
      }
    }

    const config1: ChatConfig = {
      model: opts.model1, apiKey: opts.apiKey1, orgId: opts.orgId1,
      modelVersion: opts.modelVersion1, temperature: opts.temperature1,
      maxTokens: opts.maxTokens1, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt1, 1),
    };
    const config2: ChatConfig = {
      model: opts.model2, apiKey: opts.apiKey2, orgId: opts.orgId2,
      modelVersion: opts.modelVersion2, temperature: opts.temperature2,
      maxTokens: opts.maxTokens2, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt2, 2),
    };

    const onChainComplete = (_trigger: string) => {
      const nextRepetition = repetitionIndex + 1;
      if (nextRepetition < repetitionCountRef.current) {
        repetitionCurrentRef.current = nextRepetition;
        setRepetitionCurrent(nextRepetition);
        setInteractionCount(0);
        pendingTimeoutRef.current = setTimeout(() => {
          if (initialChainRef.current) {
            startChain(
              initialChainRef.current.userMsg,
              initialChainRef.current.allMessages,
              nextRepetition,
              crypto.randomUUID(),
              bot1StartsFirst,
            );
          }
        }, 1500);
      } else {
        setIsLoading(false);
        setRepetitionCurrent(0);
        repetitionCurrentRef.current = 0;
      }
    };

    if (bot1StartsFirst) {
      await generateAIResponse(config1, baseMessages, true, dbConversationId, localConversationId, 0, repetitionIndex, onChainComplete);
    } else {
      await generateAIResponse(config2, baseMessages, false, dbConversationId, localConversationId, 0, repetitionIndex, onChainComplete);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.model1, opts.model2, opts.apiKey1, opts.apiKey2, opts.orgId1, opts.orgId2,
      opts.modelVersion1, opts.modelVersion2, opts.temperature1, opts.temperature2,
      opts.maxTokens1, opts.maxTokens2, opts.systemPrompt1, opts.systemPrompt2,
      opts.buildEffectivePrompt, generateAIResponse]);

  const handleSendMessage = async (
    userInput: string,
    setCurrentView: (v: 'chat') => void,
  ) => {
    if (!opts.validateConfigs(setErrors) || isLoading) return;

    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    isStoppedRef.current = false;
    setIsLoading(true);
    setCurrentView('chat');
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setErrors([]);

    // Increment run count for the active experiment
    if (opts.currentExperimentId) {
      supabase.from('experiments')
        .select('run_count')
        .eq('id', opts.currentExperimentId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase.from('experiments')
              .update({ run_count: ((data.run_count as number) || 0) + 1, last_run_at: new Date().toISOString() })
              .eq('id', opts.currentExperimentId);
          }
        });
    }

    const localConversationId = crypto.randomUUID();

    // Asymmetric mode with a scripted opener
    if (opts.botMode === 'asymmetric' && opts.openingMessage.trim()) {
      const opener: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: opts.openingMessage.trim(),
        timestamp: Date.now(),
        botIndex: 1,
        conversationId: localConversationId,
        wordCount: opts.openingMessage.trim().split(/\s+/).filter(Boolean).length,
        timeTaken: 0,
        modelVersion: opts.modelVersion1,
        temperature: opts.temperature1,
        systemPrompt: opts.systemPrompt1,
        repetitionNumber: 0,
      };

      setMessages(prev => [...prev, opener]);

      const allMessages: Message[] = [
        { id: 'sys1', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt1, 1), timestamp: Date.now() },
        { id: 'sys2', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt2, 2), timestamp: Date.now() },
        ...messages,
        opener,
      ];

      initialChainRef.current = { userMsg: '', allMessages, localConversationId, bot1StartsFirst: false };

      try {
        await startChain('', allMessages, 0, localConversationId, false);
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
        setIsLoading(false);
      }
      return;
    }

    // Symmetric mode
    const trimmed = userInput.trim();
    const newUserMessage: Message = trimmed
      ? { id: crypto.randomUUID(), role: 'user', content: trimmed, timestamp: Date.now() }
      : { id: crypto.randomUUID(), role: 'user', content: 'Please begin the conversation based on your instructions.', timestamp: Date.now(), hidden: true };

    setMessages(prev => [...prev, newUserMessage]);

    const allMessages: Message[] = [
      { id: 'sys1', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt1, 1), timestamp: Date.now() },
      ...messages,
      newUserMessage,
    ];

    initialChainRef.current = { userMsg: trimmed, allMessages, localConversationId, bot1StartsFirst: true };

    try {
      await startChain(trimmed, allMessages, 0, localConversationId, true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    isStoppedRef.current = true;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleResetChat = () => {
    isStoppedRef.current = true;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setIsLoading(false);
    setErrors([]);
    setStoppingTriggers({});
    initialChainRef.current = null;
    isStoppedRef.current = false;
  };

  return {
    messages, setMessages,
    isLoading,
    errors, setErrors,
    interactionCount,
    repetitionCurrent,
    stoppingTriggers,
    handleSendMessage,
    handleStop,
    handleResetChat,
  };
}
