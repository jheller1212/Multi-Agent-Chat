import { supabase } from '../supabase';

/**
 * Export outcome records for a run as CSV string.
 * Joins outcome_records → dyads to filter by run_id.
 */
export async function exportRunCSV(runId: string): Promise<string> {
  // Fetch dyad ids for this run first, then fetch outcome records
  const { data: dyadRows, error: dyadError } = await supabase
    .from('dyads')
    .select('id')
    .eq('run_id', runId);

  if (dyadError || !dyadRows || dyadRows.length === 0) {
    return '';
  }

  const dyadIds = dyadRows.map(d => d.id as string);

  const { data, error } = await supabase
    .from('outcome_records')
    .select('dyad_id, outcomes')
    .in('dyad_id', dyadIds)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return '';
  }

  // Get column headers from the first record
  const firstOutcomes = data[0].outcomes as Record<string, unknown>;
  const outcomeHeaders = Object.keys(firstOutcomes);
  const headers = ['dyad_id', ...outcomeHeaders];

  const rows = data.map(row => {
    const outcomes = row.outcomes as Record<string, unknown>;
    return [row.dyad_id as string, ...outcomeHeaders.map(h => {
      const val = outcomes[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) return `"${val.replaceAll('"', '""')}"`;
      return String(val);
    })].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Trigger CSV download in the browser.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export a single dyad's transcript as JSON.
 */
export async function exportDyadJSON(dyadId: string): Promise<string> {
  const [
    { data: dyad },
    { data: messages },
    { data: supervisorOutputs },
  ] = await Promise.all([
    supabase.from('dyads').select('*').eq('id', dyadId).single(),
    supabase.from('transcript_messages').select('*').eq('dyad_id', dyadId).order('turn'),
    supabase.from('supervisor_outputs').select('*').eq('dyad_id', dyadId).order('after_turn'),
  ]);

  return JSON.stringify({
    dyad,
    transcript: messages ?? [],
    supervisorOutputs: supervisorOutputs ?? [],
  }, null, 2);
}
