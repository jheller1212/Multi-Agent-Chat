import { supabase } from '../supabase';

/**
 * Export outcome records for a run as CSV string.
 */
export async function exportRunCSV(runId: string): Promise<string> {
  const { data, error } = await supabase
    .from('outcome_records')
    .select('data')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return '';
  }

  // Get column headers from the first record
  const headers = Object.keys(data[0].data as Record<string, unknown>);
  const rows = data.map(row => {
    const d = row.data as Record<string, unknown>;
    return headers.map(h => {
      const val = d[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return String(val);
    }).join(',');
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
