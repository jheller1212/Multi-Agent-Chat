-- Security fixes from audit

-- M1: Add DELETE policy to scenarios (users can delete their own)
CREATE POLICY "Users can delete own scenarios" ON public.scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- M1: Add DELETE policy to research_experiments
CREATE POLICY "Users can delete own experiments" ON public.research_experiments
  FOR DELETE USING (auth.uid() = user_id);

-- M5: Add a check constraint to limit concurrency stored in experiment config
-- (Client-side enforcement only for now — no server-side function gate)
