-- Multi-Agent Research Platform tables
-- Supports scenario-driven, multi-agent experiments with structured outcome tracking

-- Scenarios: reusable research environment configurations
CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenarios" ON public.scenarios
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own scenarios" ON public.scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON public.scenarios
  FOR UPDATE USING (auth.uid() = user_id);

-- Research experiments (within a scenario)
CREATE TABLE IF NOT EXISTS public.research_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  scenario_id UUID REFERENCES public.scenarios NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  progress JSONB,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.research_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own experiments" ON public.research_experiments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own experiments" ON public.research_experiments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiments" ON public.research_experiments
  FOR UPDATE USING (auth.uid() = user_id);

-- Experiment runs (one per launch; an experiment can be re-run)
CREATE TABLE IF NOT EXISTS public.experiment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.research_experiments NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  config_snapshot JSONB NOT NULL DEFAULT '{}',
  prompt_hashes JSONB NOT NULL DEFAULT '{}',
  progress JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.experiment_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON public.experiment_runs
  FOR SELECT USING (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own runs" ON public.experiment_runs
  FOR INSERT WITH CHECK (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own runs" ON public.experiment_runs
  FOR UPDATE USING (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = auth.uid())
  );

-- Frozen prompts (immutable, content-addressed)
CREATE TABLE IF NOT EXISTS public.frozen_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.experiment_runs NOT NULL,
  cell_label TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.frozen_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own frozen prompts" ON public.frozen_prompts
  FOR SELECT USING (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own frozen prompts" ON public.frozen_prompts
  FOR INSERT WITH CHECK (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
-- No UPDATE or DELETE policies — frozen prompts are immutable

-- Dyads (one row per dyad in an experiment run)
CREATE TABLE IF NOT EXISTS public.dyads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.experiment_runs NOT NULL,
  cell_label TEXT NOT NULL,
  dyad_index INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  factors JSONB NOT NULL DEFAULT '{}',
  agent_configs JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  termination_reason TEXT,
  termination_turn INTEGER,
  failure_reason TEXT,
  exclusion_reason TEXT,
  archived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.dyads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dyads" ON public.dyads
  FOR SELECT USING (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own dyads" ON public.dyads
  FOR INSERT WITH CHECK (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own dyads" ON public.dyads
  FOR UPDATE USING (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );

CREATE INDEX idx_dyads_run_id ON public.dyads(run_id);
CREATE INDEX idx_dyads_status ON public.dyads(run_id, status);

-- Transcript messages (append-only, immutable)
CREATE TABLE IF NOT EXISTS public.transcript_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyad_id UUID REFERENCES public.dyads ON DELETE CASCADE NOT NULL,
  turn INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  token_usage JSONB,
  time_taken_ms INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transcript_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcript messages" ON public.transcript_messages
  FOR SELECT USING (
    dyad_id IN (
      SELECT d.id FROM public.dyads d
      JOIN public.experiment_runs er ON d.run_id = er.id
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own transcript messages" ON public.transcript_messages
  FOR INSERT WITH CHECK (
    dyad_id IN (
      SELECT d.id FROM public.dyads d
      JOIN public.experiment_runs er ON d.run_id = er.id
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
-- No UPDATE or DELETE policies — transcripts are append-only

CREATE INDEX idx_transcript_dyad_id ON public.transcript_messages(dyad_id);

-- Supervisor outputs (append-only, per-round)
CREATE TABLE IF NOT EXISTS public.supervisor_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyad_id UUID REFERENCES public.dyads ON DELETE CASCADE NOT NULL,
  after_turn INTEGER NOT NULL,
  supervisor_name TEXT NOT NULL,
  output_type TEXT NOT NULL,
  parsed JSONB NOT NULL DEFAULT '{}',
  raw_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supervisor_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supervisor outputs" ON public.supervisor_outputs
  FOR SELECT USING (
    dyad_id IN (
      SELECT d.id FROM public.dyads d
      JOIN public.experiment_runs er ON d.run_id = er.id
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own supervisor outputs" ON public.supervisor_outputs
  FOR INSERT WITH CHECK (
    dyad_id IN (
      SELECT d.id FROM public.dyads d
      JOIN public.experiment_runs er ON d.run_id = er.id
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
-- No UPDATE or DELETE policies — supervisor outputs are append-only

CREATE INDEX idx_supervisor_dyad_id ON public.supervisor_outputs(dyad_id);

-- Outcome records (one per dyad, computed after completion)
CREATE TABLE IF NOT EXISTS public.outcome_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyad_id UUID REFERENCES public.dyads ON DELETE CASCADE NOT NULL UNIQUE,
  run_id UUID REFERENCES public.experiment_runs NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outcome_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outcome records" ON public.outcome_records
  FOR SELECT USING (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own outcome records" ON public.outcome_records
  FOR INSERT WITH CHECK (
    run_id IN (
      SELECT er.id FROM public.experiment_runs er
      JOIN public.research_experiments re ON er.experiment_id = re.id
      WHERE re.user_id = auth.uid()
    )
  );

CREATE INDEX idx_outcome_run_id ON public.outcome_records(run_id);
