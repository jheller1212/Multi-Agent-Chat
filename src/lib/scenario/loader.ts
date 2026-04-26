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
 * Save (insert or update) a scenario to Supabase.
 * If `scenarioId` is provided, update; otherwise insert a new row.
 * Returns the saved Scenario, or null on failure.
 */
export async function saveScenario(
  scenario: Omit<Scenario, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  scenarioId?: string,
): Promise<Scenario | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { name, description, isPublic, isTemplate, ...config } = scenario;

  const row = {
    user_id: user.id,
    name,
    description,
    is_public: isPublic,
    is_template: isTemplate,
    config,
  };

  let result;
  if (scenarioId) {
    result = await supabase
      .from('scenarios')
      .update(row)
      .eq('id', scenarioId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('scenarios')
      .insert(row)
      .select()
      .single();
  }

  const { data, error } = result;
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
 * Clone a scenario: insert a copy owned by the current user.
 */
export async function cloneScenario(scenarioId: string): Promise<Scenario | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const source = await loadScenario(scenarioId);
  if (!source) return null;

  const { id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua, name, description, isPublic, isTemplate, ...config } = source;

  const { data, error } = await supabase
    .from('scenarios')
    .insert({
      user_id: user.id,
      name: `${name} (copy)`,
      description,
      is_public: false,
      is_template: false,
      config,
    })
    .select()
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
