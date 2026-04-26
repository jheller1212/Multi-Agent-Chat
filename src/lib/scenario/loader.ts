import { supabase } from '../supabase';
import type { Scenario } from '../../types/scenario';
import { SCENARIO_TEMPLATES } from './templates';

/**
 * Load a scenario by ID from Supabase.
 */
export async function loadScenario(scenarioId: string): Promise<Scenario | null> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    isPublic: data.is_public,
    isTemplate: data.is_template,
    ...data.config,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as Scenario;
}

/**
 * Load all scenarios visible to the current user (own + public).
 */
export async function loadScenarios(): Promise<Scenario[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .or(`user_id.eq.${user.id},is_public.eq.true`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    isTemplate: row.is_template,
    ...row.config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Scenario));
}

/**
 * Seed pre-built scenario templates into the database.
 * Called once when the app initialises. Skips if templates already exist.
 */
export async function seedScenarioTemplates(): Promise<void> {
  const { count } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('is_template', true);

  if (count && count >= SCENARIO_TEMPLATES.length) return;

  for (const template of SCENARIO_TEMPLATES) {
    const { name, description, isPublic, isTemplate, ...config } = template;

    const { error } = await supabase.from('scenarios').insert({
      name,
      description,
      is_public: isPublic,
      is_template: isTemplate,
      config,
    });

    if (error) {
      console.warn(`[Scenario] Failed to seed template "${name}":`, error.message);
    }
  }
}
