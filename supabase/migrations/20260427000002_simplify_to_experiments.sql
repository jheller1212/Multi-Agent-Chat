-- Remove the experiment_runs layer — merge into research_experiments
-- Hierarchy: Scenario → Experiment → Dyads (no more Runs)

-- Add execution fields to research_experiments
ALTER TABLE public.research_experiments
  ADD COLUMN IF NOT EXISTS config_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS prompt_hashes JSONB,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add experiment_id to dyads (keep run_id for backward compat, but new code uses experiment_id)
ALTER TABLE public.dyads
  ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES public.research_experiments;

-- Add experiment_id to frozen_prompts
ALTER TABLE public.frozen_prompts
  ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES public.research_experiments;

-- Add experiment_id to outcome_records
ALTER TABLE public.outcome_records
  ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES public.research_experiments;

-- Create indexes for new column
CREATE INDEX IF NOT EXISTS idx_dyads_experiment_id ON public.dyads(experiment_id);
CREATE INDEX IF NOT EXISTS idx_dyads_experiment_status ON public.dyads(experiment_id, status);
