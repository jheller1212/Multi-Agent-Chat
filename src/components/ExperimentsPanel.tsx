import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  X, FlaskConical, Loader2, AlertCircle, ChevronRight,
  Play, Trash2, Bot, Settings2,
} from 'lucide-react';

export interface Experiment {
  id: string;
  name: string;
  condition_label: string;
  description: string;
  config: Record<string, unknown>;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
}

interface ExperimentsPanelProps {
  userId: string;
  onClose: () => void;
  onLoad: (experiment: Experiment) => void;
}

const MODEL_LABELS: Record<string, string> = {
  gpt4: 'GPT-4', claude: 'Claude', gemini: 'Gemini', mistral: 'Mistral',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export function ExperimentsPanel({ userId, onClose, onLoad }: ExperimentsPanelProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    supabase
      .from('experiments')
      .select('id, name, condition_label, description, config, run_count, last_run_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        else setExperiments((data as Experiment[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this experiment? Conversation runs are not affected.')) return;
    setDeleting(id);
    await supabase.from('experiments').delete().eq('id', id);
    setExperiments(prev => prev.filter(ex => ex.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDeleting(null);
  };

  const selected = experiments.find(ex => ex.id === selectedId);

  const ConfigSummary = ({ cfg }: { cfg: Record<string, unknown> }) => (
    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-1.5">
        <Bot className="w-3 h-3 text-indigo-500" />
        <span>
          <strong>{String(cfg.n1 ?? 'Bot A')}</strong>
          {' '}({MODEL_LABELS[String(cfg.m1)] ?? String(cfg.m1)} · {String(cfg.mv1 ?? '')} · t={cfg.t1})
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Bot className="w-3 h-3 text-emerald-500" />
        <span>
          <strong>{String(cfg.n2 ?? 'Bot B')}</strong>
          {' '}({MODEL_LABELS[String(cfg.m2)] ?? String(cfg.m2)} · {String(cfg.mv2 ?? '')} · t={cfg.t2})
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <Settings2 className="w-3 h-3 text-gray-400" />
        <span>
          {cfg.bm === 'asymmetric' ? 'Asymmetric' : 'Symmetric'} ·{' '}
          {Math.ceil(Number(cfg.mi ?? 10) / 2)} msgs/bot ·{' '}
          {Number(cfg.rc ?? 1)} run{Number(cfg.rc ?? 1) !== 1 ? 's' : ''}
          {cfg.sk ? ` · stop: "${cfg.sk}"` : ''}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exp-panel-title"
        className="ml-auto w-full max-w-3xl bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 id="exp-panel-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Saved Experiments
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div className="w-72 border-r dark:border-gray-700 flex flex-col overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500 text-sm px-6 text-center gap-2">
                <AlertCircle className="w-8 h-8" />
                {loadError}
              </div>
            ) : experiments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm px-6 text-center gap-3">
                <FlaskConical className="w-10 h-10" />
                <p>No experiments saved yet.</p>
                <p className="text-xs">Use the <strong>Save / Share → Save as experiment</strong> option to save your current configuration.</p>
              </div>
            ) : (
              experiments.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedId(ex.id)}
                  className={`w-full text-left px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedId === ex.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate flex-1">{ex.name}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(ex.id, e)}
                        disabled={deleting === ex.id}
                        className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Delete experiment"
                      >
                        {deleting === ex.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                  {ex.condition_label && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                      {ex.condition_label}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <span>{ex.run_count} run{ex.run_count !== 1 ? 's' : ''}</span>
                    <span>{formatDate(ex.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm gap-3">
                <FlaskConical className="w-10 h-10" />
                Select an experiment to preview its configuration
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{selected.name}</h3>
                    {selected.condition_label && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                        {selected.condition_label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { onLoad(selected); onClose(); }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex-shrink-0"
                  >
                    <Play className="w-4 h-4" />
                    Load config
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Stats */}
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Total runs</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{selected.run_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Last run</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selected.last_run_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Created</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(selected.created_at)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selected.description && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.description}</p>
                    </div>
                  )}

                  {/* Config summary */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Configuration</p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <ConfigSummary cfg={selected.config} />
                    </div>
                  </div>

                  {/* System prompts preview */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">System Prompts</p>
                    <div className="space-y-2">
                      {[
                        { label: String(selected.config.n1 ?? 'Bot A'), text: String(selected.config.sp1 ?? ''), color: 'indigo' },
                        { label: String(selected.config.n2 ?? 'Bot B'), text: String(selected.config.sp2 ?? ''), color: 'emerald' },
                      ].map(({ label, text, color }) => (
                        <div key={label} className="text-xs">
                          <p className={`font-medium mb-1 text-${color}-700 dark:text-${color}-400`}>{label}</p>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3 bg-gray-50 dark:bg-gray-800 rounded p-2 border dark:border-gray-700">
                            {text || <em className="text-gray-400">No system prompt</em>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
