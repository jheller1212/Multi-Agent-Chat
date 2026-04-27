import { supabase } from '../supabase';

export interface RunProgress {
  total: number;
  completed: number;
  failed: number;
  excluded: number;
  running: number;
  pending: number;
}

/**
 * Fetch live progress for an experiment.
 */
export async function getExperimentProgress(experimentId: string): Promise<RunProgress> {
  const { data, error } = await supabase
    .from('dyads')
    .select('status')
    .eq('experiment_id', experimentId);

  if (error || !data) {
    return { total: 0, completed: 0, failed: 0, excluded: 0, running: 0, pending: 0 };
  }

  const progress: RunProgress = { total: data.length, completed: 0, failed: 0, excluded: 0, running: 0, pending: 0 };

  for (const row of data) {
    switch (row.status) {
      case 'completed': progress.completed++; break;
      case 'failed': progress.failed++; break;
      case 'excluded': progress.excluded++; break;
      case 'running': progress.running++; break;
      default: progress.pending++; break;
    }
  }

  return progress;
}

/**
 * Update progress in the research_experiments table.
 */
export async function updateExperimentProgress(experimentId: string, progress: RunProgress): Promise<void> {
  await supabase
    .from('research_experiments')
    .update({ progress })
    .eq('id', experimentId);
}
