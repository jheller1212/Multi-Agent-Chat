-- Applied to production 2026-07-06 via management API; checked in for repo/DB parity
--
-- Unblocks the experiment pipeline (Scenario → Experiment → Dyads, no Runs):
-- 1. run_id is a legacy column from the removed experiment_runs layer — new rows
--    are keyed by experiment_id, so run_id must be nullable.
-- 2. The original RLS policies gate access via run_id → experiment_runs. New rows
--    have run_id = NULL, so add permissive experiment_id-path policies alongside.

-- 1. Drop NOT NULL on legacy run_id columns
ALTER TABLE public.dyads ALTER COLUMN run_id DROP NOT NULL;
ALTER TABLE public.outcome_records ALTER COLUMN run_id DROP NOT NULL;
ALTER TABLE public.frozen_prompts ALTER COLUMN run_id DROP NOT NULL;

-- 2. Experiment-path RLS policies

-- dyads: direct experiment_id
CREATE POLICY "Users can view dyads via experiment" ON public.dyads
  FOR SELECT USING (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );
CREATE POLICY "Users can insert dyads via experiment" ON public.dyads
  FOR INSERT WITH CHECK (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );
CREATE POLICY "Users can update dyads via experiment" ON public.dyads
  FOR UPDATE USING (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );

-- transcript_messages: via dyad → experiment join
CREATE POLICY "Users can view transcript messages via experiment" ON public.transcript_messages
  FOR SELECT USING (
    dyad_id IN (
      SELECT id FROM public.dyads
      WHERE experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Users can insert transcript messages via experiment" ON public.transcript_messages
  FOR INSERT WITH CHECK (
    dyad_id IN (
      SELECT id FROM public.dyads
      WHERE experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
    )
  );

-- supervisor_outputs: via dyad → experiment join
CREATE POLICY "Users can view supervisor outputs via experiment" ON public.supervisor_outputs
  FOR SELECT USING (
    dyad_id IN (
      SELECT id FROM public.dyads
      WHERE experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Users can insert supervisor outputs via experiment" ON public.supervisor_outputs
  FOR INSERT WITH CHECK (
    dyad_id IN (
      SELECT id FROM public.dyads
      WHERE experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
    )
  );

-- outcome_records: direct experiment_id
CREATE POLICY "Users can view outcome records via experiment" ON public.outcome_records
  FOR SELECT USING (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );
CREATE POLICY "Users can insert outcome records via experiment" ON public.outcome_records
  FOR INSERT WITH CHECK (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );

-- frozen_prompts: direct experiment_id
CREATE POLICY "Users can view frozen prompts via experiment" ON public.frozen_prompts
  FOR SELECT USING (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );
CREATE POLICY "Users can insert frozen prompts via experiment" ON public.frozen_prompts
  FOR INSERT WITH CHECK (
    experiment_id IN (SELECT id FROM public.research_experiments WHERE user_id = (SELECT auth.uid()))
  );
