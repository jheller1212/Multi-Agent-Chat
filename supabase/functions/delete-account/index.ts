import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://ai2aichat.com',
  'https://www.ai2aichat.com',
  'https://ai2ai-chat.netlify.app',
  'https://multi-agent-chat-research.netlify.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── GDPR Art. 17 — delete ALL user data in dependency order ──────────────

    // 1. supervisor_outputs and transcript_messages cascade from dyads,
    //    so we delete them explicitly first to avoid FK violations on dyads.
    //    outcome_records also cascades from dyads — handled below.

    // Get all experiment_run IDs owned by this user (via research_experiments)
    const { data: userRuns } = await admin
      .from('experiment_runs')
      .select('id')
      .in(
        'experiment_id',
        (await admin.from('research_experiments').select('id').eq('user_id', user.id)).data?.map((r: { id: string }) => r.id) ?? []
      );
    const runIds = userRuns?.map((r: { id: string }) => r.id) ?? [];

    // Get all dyad IDs for those runs
    const { data: userDyads } = runIds.length
      ? await admin.from('dyads').select('id').in('run_id', runIds)
      : { data: [] };
    const dyadIds = userDyads?.map((d: { id: string }) => d.id) ?? [];

    if (dyadIds.length) {
      await admin.from('supervisor_outputs').delete().in('dyad_id', dyadIds);
      await admin.from('transcript_messages').delete().in('dyad_id', dyadIds);
      await admin.from('outcome_records').delete().in('dyad_id', dyadIds);
      await admin.from('dyads').delete().in('id', dyadIds);
    }

    if (runIds.length) {
      await admin.from('frozen_prompts').delete().in('run_id', runIds);
      await admin.from('experiment_runs').delete().in('id', runIds);
    }

    // research_experiments and scenarios (user_id columns)
    await admin.from('research_experiments').delete().eq('user_id', user.id);
    await admin.from('scenarios').delete().eq('user_id', user.id);

    // Legacy experiment/prompt tables
    await admin.from('experiments').delete().eq('user_id', user.id);
    await admin.from('prompt_versions').delete().eq('user_id', user.id);

    // Workshop signups
    await admin.from('workshop_signups').delete().eq('user_id', user.id);

    // Encrypted API keys
    await admin.from('api_keys').delete().eq('user_id', user.id);

    // Conversations (messages cascade automatically via FK)
    const { error: convError } = await admin
      .from('conversations')
      .delete()
      .eq('user_id', user.id);
    if (convError) {
      return new Response(JSON.stringify({ error: 'Failed to delete conversation data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete the auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
