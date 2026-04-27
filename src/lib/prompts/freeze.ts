import { supabase } from '../supabase';

/**
 * Compute SHA-256 hash of a string. Works in both browser and Node.
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple djb2 hash (for environments without crypto.subtle)
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export interface FrozenPrompt {
  cellLabel: string;
  agentName: string;
  content: string;
  contentHash: string;
}

/**
 * Freeze all rendered prompts for an experiment.
 * Writes immutable records to the frozen_prompts table.
 * Returns a map of "cellLabel_agentName" → hash for the experiment metadata.
 */
export async function freezePrompts(
  experimentId: string,
  prompts: FrozenPrompt[],
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};

  const rows = prompts.map(p => ({
    experiment_id: experimentId,
    cell_label: p.cellLabel,
    agent_name: p.agentName,
    content: p.content,
    content_hash: p.contentHash,
  }));

  const { error } = await supabase.from('frozen_prompts').insert(rows);
  if (error) {
    throw new Error(`Failed to freeze prompts: ${error.message}`);
  }

  for (const p of prompts) {
    hashes[`${p.cellLabel}_${p.agentName}`] = p.contentHash;
  }

  return hashes;
}

/**
 * Load frozen prompts for a specific experiment and cell.
 */
export async function loadFrozenPrompts(
  experimentId: string,
  cellLabel: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('frozen_prompts')
    .select('agent_name, content')
    .eq('experiment_id', experimentId)
    .eq('cell_label', cellLabel);

  if (error || !data) return {};

  const result: Record<string, string> = {};
  for (const row of data) {
    result[row.agent_name] = row.content;
  }
  return result;
}
