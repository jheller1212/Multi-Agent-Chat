/**
 * Draft persistence for the New Experiment wizard.
 * Drafts live in research_experiments with status='draft'; the Launch step
 * (task #21) flips the row to 'running'. Every call awaits and surfaces
 * errors — no fire-and-forget writes.
 */
import { supabase } from '../supabase';
import type { FactorDefinition, AgentAssignment } from '../../types/experiment';

export interface ExperimentDraftConfig {
  factors: FactorDefinition[];
  nPerCell: number;
  bufferPercent: number;
  concurrency: number;
  devMode: boolean;
  agentAssignments: AgentAssignment[];
  params: Record<string, string | number>;
}

export interface ExperimentDraft {
  id: string;
  scenarioId: string;
  name: string;
  config: ExperimentDraftConfig;
}

export interface DraftResult<T> {
  data: T | null;
  error: string | null;
}

/** Create or update a draft row. Pass draftId to update. */
export async function saveDraft(
  scenarioId: string,
  name: string,
  config: ExperimentDraftConfig,
  draftId?: string,
): Promise<DraftResult<string>> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { data: null, error: 'Not signed in.' };

  const row = {
    user_id: user.id,
    scenario_id: scenarioId,
    name,
    description: 'Draft experiment',
    config,
    status: 'draft',
    progress: { total: 0, completed: 0, failed: 0, excluded: 0 },
  };

  if (draftId) {
    const { error } = await supabase
      .from('research_experiments')
      .update(row)
      .eq('id', draftId)
      .eq('status', 'draft');
    if (error) return { data: null, error: error.message };
    return { data: draftId, error: null };
  }

  const { data, error } = await supabase
    .from('research_experiments')
    .insert(row)
    .select('id')
    .single();
  if (error || !data) return { data: null, error: error?.message ?? 'Insert returned no row.' };
  return { data: data.id as string, error: null };
}

/** Load the most recent draft for a scenario, if any. */
export async function loadLatestDraft(scenarioId: string): Promise<DraftResult<ExperimentDraft>> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { data: null, error: 'Not signed in.' };

  const { data, error } = await supabase
    .from('research_experiments')
    .select('id, scenario_id, name, config')
    .eq('user_id', user.id)
    .eq('scenario_id', scenarioId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: {
      id: data.id as string,
      scenarioId: data.scenario_id as string,
      name: data.name as string,
      config: data.config as ExperimentDraftConfig,
    },
    error: null,
  };
}
