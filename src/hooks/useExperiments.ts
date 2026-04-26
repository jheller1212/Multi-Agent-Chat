import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Experiment } from '../components/ExperimentsPanel';
import type { AIModel } from '../types';
import type { BotConfigActions } from './useBotConfig';

interface UseExperimentsOptions {
  userId: string;
  botConfigActions: BotConfigActions;
  setMaxInteractions: (v: number) => void;
  setResponseDelay: (v: number) => void;
  setDelayVariance: (v: boolean) => void;
  setRepetitionCount: (v: number) => void;
  setBotMode: (v: 'symmetric' | 'asymmetric') => void;
  setOpeningMessage: (v: string) => void;
  setStopKeywords: (v: string) => void;
  // All bot config values for saving
  getBotConfig: () => Record<string, unknown>;
  getSettingsConfig: () => Record<string, unknown>;
}

export function useExperiments(opts: UseExperimentsOptions) {
  const [currentExperimentId, setCurrentExperimentId] = useState<string | null>(null);
  const [currentExperimentName, setCurrentExperimentName] = useState<string>('');
  const [showSaveExperiment, setShowSaveExperiment] = useState(false);
  const [saveExpName, setSaveExpName] = useState('');
  const [saveExpCondition, setSaveExpCondition] = useState('');
  const [saveExpDesc, setSaveExpDesc] = useState('');
  const [savingExp, setSavingExp] = useState(false);

  const handleLoadExperiment = useCallback((experiment: Experiment) => {
    const c = experiment.config;
    const s = (key: string) => typeof c[key] === 'string' ? String(c[key]) : undefined;
    const n = (key: string) => typeof c[key] === 'number' ? Number(c[key]) : undefined;
    const b = (key: string) => typeof c[key] === 'boolean' ? Boolean(c[key]) : undefined;

    const a = opts.botConfigActions;
    if (s('m1')) a.setModel1(s('m1') as AIModel);
    if (s('mv1')) a.setModelVersion1(s('mv1')!);
    if (n('t1') !== undefined) a.setTemperature1(n('t1')!);
    if (n('mt1') !== undefined) a.setMaxTokens1(n('mt1')!);
    if (s('sp1') !== undefined) a.setSystemPrompt1(s('sp1')!);
    if (s('n1')) a.setBotName1(s('n1')!);
    if (s('m2')) a.setModel2(s('m2') as AIModel);
    if (s('mv2')) a.setModelVersion2(s('mv2')!);
    if (n('t2') !== undefined) a.setTemperature2(n('t2')!);
    if (n('mt2') !== undefined) a.setMaxTokens2(n('mt2')!);
    if (s('sp2') !== undefined) a.setSystemPrompt2(s('sp2')!);
    if (s('n2')) a.setBotName2(s('n2')!);
    if (s('bc1')) a.setBubbleColor1(s('bc1')!);
    if (s('bc2')) a.setBubbleColor2(s('bc2')!);
    if (s('tc1')) a.setTextColor1(s('tc1')!);
    if (s('tc2')) a.setTextColor2(s('tc2')!);

    if (n('mi') !== undefined) opts.setMaxInteractions(n('mi')!);
    if (n('rd') !== undefined) opts.setResponseDelay(n('rd')!);
    if (b('dv') !== undefined) opts.setDelayVariance(b('dv')!);
    if (n('rc') !== undefined) opts.setRepetitionCount(n('rc')!);
    if (s('bm')) opts.setBotMode(s('bm') as 'symmetric' | 'asymmetric');
    if (s('om') !== undefined) opts.setOpeningMessage(s('om')!);
    if (s('sk') !== undefined) opts.setStopKeywords(s('sk')!);

    setCurrentExperimentId(experiment.id);
    setCurrentExperimentName(experiment.name);
  }, [opts]);

  const handleSaveExperimentConfirm = async () => {
    if (!saveExpName.trim()) return;
    setSavingExp(true);
    const config = { ...opts.getBotConfig(), ...opts.getSettingsConfig() };
    const { data, error } = await supabase.from('experiments').insert({
      user_id: opts.userId,
      name: saveExpName.trim(),
      condition_label: saveExpCondition.trim(),
      description: saveExpDesc.trim(),
      config,
    }).select('id').single();
    setSavingExp(false);
    if (!error && data) {
      setCurrentExperimentId(data.id as string);
      setCurrentExperimentName(saveExpName.trim());
    }
    setShowSaveExperiment(false);
    setSaveExpName('');
    setSaveExpCondition('');
    setSaveExpDesc('');
  };

  const detachExperiment = () => {
    setCurrentExperimentId(null);
    setCurrentExperimentName('');
  };

  return {
    currentExperimentId,
    currentExperimentName,
    showSaveExperiment, setShowSaveExperiment,
    saveExpName, setSaveExpName,
    saveExpCondition, setSaveExpCondition,
    saveExpDesc, setSaveExpDesc,
    savingExp,
    handleLoadExperiment,
    handleSaveExperimentConfirm,
    detachExperiment,
  };
}
