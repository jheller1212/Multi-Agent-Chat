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
 * Fetch live progress for an experiment run.
 */
export async function getRunProgress(runId: string): Promise<RunProgress> {
  const { data, error } = await supabase
    .from('dyads')
    .select('status')
    .eq('run_id', runId);

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
 * Update run progress in the experiment_runs table.
 */
export async function updateRunProgress(runId: string, progress: RunProgress): Promise<void> {
  await supabase
    .from('experiment_runs')
    .update({ progress })
    .eq('id', runId);
}
