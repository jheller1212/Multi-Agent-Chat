#!/usr/bin/env node
/**
 * AI2AI-Chat Stress Test
 *
 * Simulates N concurrent "students" each running a conversation where two bots
 * exchange M messages.  All students share the same API key, which is the real-
 * world bottleneck we want to measure.
 *
 * Usage:
 *   node stress-test/run.mjs --provider openai   --key sk-... --users 15 --messages 10
 *   node stress-test/run.mjs --provider anthropic --key sk-ant-... --users 15 --messages 10
 *   node stress-test/run.mjs --provider gemini    --key AIza... --users 15 --messages 10
 *
 * Options:
 *   --provider   openai | anthropic | gemini          (default: openai)
 *   --key        API key (required)
 *   --model      Model ID override                    (default: per-provider)
 *   --users      Number of simulated students          (default: 15)
 *   --messages   Messages per conversation (total)     (default: 10)
 *   --delay      Seconds between messages per user     (default: 1)
 *   --max-tokens Max tokens per response               (default: 60)
 *   --dry-run    Skip real API calls, test harness only
 */

// ── CLI args ────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = arr[i + 1]?.startsWith('--') ? 'true' : arr[i + 1] ?? 'true';
      acc.push([key, val]);
    }
    return acc;
  }, [])
);

const PROVIDER   = args.provider   ?? 'openai';
const API_KEY    = args.key;
const USERS      = parseInt(args.users ?? '15', 10);
const MESSAGES   = parseInt(args.messages ?? '10', 10);
const DELAY_S    = parseFloat(args.delay ?? '1');
const MAX_TOKENS = parseInt(args['max-tokens'] ?? '60', 10);
const DRY_RUN    = 'dry-run' in args;

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',        // cheapest, fast — good for stress testing
  anthropic: 'claude-haiku-4-5-20251001',
  gemini: 'gemini-1.5-flash',
};
const MODEL = args.model ?? DEFAULT_MODELS[PROVIDER];

if (!API_KEY && !DRY_RUN) {
  console.error('Error: --key is required (or use --dry-run)');
  process.exit(1);
}

// ── Provider request functions ──────────────────────────────────────────────
async function callOpenAI(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: MAX_TOKENS, temperature: 0.7 }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    err.retryAfter = res.headers.get('retry-after');
    throw err;
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(messages) {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const chat = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, messages: chat, ...(system ? { system } : {}), max_tokens: MAX_TOKENS, temperature: 0.7 }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    err.retryAfter = res.headers.get('retry-after');
    throw err;
  }
  const data = await res.json();
  return data.content[0].text;
}

async function callGemini(messages) {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    err.retryAfter = res.headers.get('retry-after');
    throw err;
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callDryRun() {
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
  return 'Dry-run response.';
}

const PROVIDERS = { openai: callOpenAI, anthropic: callAnthropic, gemini: callGemini };
const callAPI = DRY_RUN ? callDryRun : PROVIDERS[PROVIDER];
if (!callAPI) { console.error(`Unknown provider: ${PROVIDER}`); process.exit(1); }

// ── Stats tracker ───────────────────────────────────────────────────────────
const stats = {
  totalRequests: 0,
  successes: 0,
  rateLimits: 0,
  otherErrors: 0,
  responseTimes: [],
  errorLog: [],
  perUser: Array.from({ length: USERS }, () => ({
    successes: 0, rateLimits: 0, errors: 0, times: [],
  })),
};

// ── Simulate one student ────────────────────────────────────────────────────
async function simulateUser(userId) {
  const userStats = stats.perUser[userId];
  const messages = [
    { role: 'system', content: 'You are a helpful assistant. Keep responses under 2 sentences.' },
    { role: 'user', content: `Student ${userId + 1}: Tell me a fun fact about the number ${userId + 1}.` },
  ];

  for (let turn = 0; turn < MESSAGES; turn++) {
    const isBot1 = turn % 2 === 0;
    const start = Date.now();
    stats.totalRequests++;

    try {
      const content = await callAPI(messages);
      const elapsed = Date.now() - start;

      stats.successes++;
      userStats.successes++;
      stats.responseTimes.push(elapsed);
      userStats.times.push(elapsed);

      messages.push({ role: 'assistant', content });
      messages.push({
        role: 'user',
        content: isBot1
          ? `Respond to that with a follow-up question.`
          : `Give a short answer.`,
      });

      process.stdout.write(`\r  User ${String(userId + 1).padStart(2)} | msg ${String(turn + 1).padStart(2)}/${MESSAGES} | ${elapsed}ms  `);
    } catch (err) {
      const elapsed = Date.now() - start;
      if (err.status === 429) {
        stats.rateLimits++;
        userStats.rateLimits++;
        stats.errorLog.push({ userId, turn, type: 'rate_limit', elapsed, detail: err.message.slice(0, 120) });

        // Back off and retry once
        const wait = err.retryAfter ? parseInt(err.retryAfter) * 1000 : 5000;
        process.stdout.write(`\r  User ${String(userId + 1).padStart(2)} | msg ${String(turn + 1).padStart(2)}/${MESSAGES} | RATE LIMITED — waiting ${wait}ms  `);
        await new Promise(r => setTimeout(r, wait));
        turn--; // retry this turn
        continue;
      } else {
        stats.otherErrors++;
        userStats.errors++;
        stats.errorLog.push({ userId, turn, type: 'error', elapsed, detail: err.message.slice(0, 120) });
        process.stdout.write(`\r  User ${String(userId + 1).padStart(2)} | msg ${String(turn + 1).padStart(2)}/${MESSAGES} | ERROR: ${err.message.slice(0, 60)}  `);
        // Continue to next message instead of aborting
        messages.push({ role: 'assistant', content: '(error — skipped)' });
      }
    }

    if (DELAY_S > 0 && turn < MESSAGES - 1) {
      await new Promise(r => setTimeout(r, DELAY_S * 1000));
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          AI2AI-Chat Stress Test                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Provider:    ${PROVIDER} (${MODEL})`);
  console.log(`  Users:       ${USERS} concurrent`);
  console.log(`  Messages:    ${MESSAGES} per conversation`);
  console.log(`  Delay:       ${DELAY_S}s between messages`);
  console.log(`  Max tokens:  ${MAX_TOKENS}`);
  console.log(`  Total calls: ${USERS * MESSAGES}`);
  console.log(`  Dry run:     ${DRY_RUN}`);
  console.log('');
  console.log('  Starting...');
  console.log('');

  const t0 = Date.now();

  // Stagger starts slightly (0–500ms random) to be more realistic
  const promises = Array.from({ length: USERS }, (_, i) =>
    new Promise(resolve => setTimeout(resolve, Math.random() * 500)).then(() => simulateUser(i))
  );
  await Promise.all(promises);

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`  Total time:      ${totalTime}s`);
  console.log(`  Total requests:  ${stats.totalRequests}`);
  console.log(`  Successes:       ${stats.successes}`);
  console.log(`  Rate limits:     ${stats.rateLimits} (retried)`);
  console.log(`  Other errors:    ${stats.otherErrors}`);
  console.log('');

  if (stats.responseTimes.length > 0) {
    const times = stats.responseTimes;
    console.log('  Response times (successful requests):');
    console.log(`    Min:    ${Math.min(...times)}ms`);
    console.log(`    Median: ${percentile(times, 50)}ms`);
    console.log(`    P90:    ${percentile(times, 90)}ms`);
    console.log(`    P99:    ${percentile(times, 99)}ms`);
    console.log(`    Max:    ${Math.max(...times)}ms`);
    console.log(`    Avg:    ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms`);
  }

  console.log('');
  console.log('  Per-user breakdown:');
  console.log('  ┌──────┬─────────┬────────────┬────────┬───────────┐');
  console.log('  │ User │ Success │ Rate-limit │ Errors │ Avg ms    │');
  console.log('  ├──────┼─────────┼────────────┼────────┼───────────┤');
  for (let i = 0; i < USERS; i++) {
    const u = stats.perUser[i];
    const avg = u.times.length > 0 ? Math.round(u.times.reduce((a, b) => a + b, 0) / u.times.length) : '-';
    console.log(`  │ ${String(i + 1).padStart(4)} │ ${String(u.successes).padStart(7)} │ ${String(u.rateLimits).padStart(10)} │ ${String(u.errors).padStart(6)} │ ${String(avg).padStart(7)}ms │`);
  }
  console.log('  └──────┴─────────┴────────────┴────────┴───────────┘');

  if (stats.errorLog.length > 0) {
    console.log('');
    console.log(`  Error log (${stats.errorLog.length} entries):`);
    for (const e of stats.errorLog.slice(0, 20)) {
      console.log(`    User ${e.userId + 1}, msg ${e.turn + 1}: [${e.type}] ${e.detail}`);
    }
    if (stats.errorLog.length > 20) {
      console.log(`    ... and ${stats.errorLog.length - 20} more`);
    }
  }

  // Workshop verdict
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  const limitPct = (stats.rateLimits / stats.totalRequests * 100).toFixed(1);
  const errorPct = (stats.otherErrors / stats.totalRequests * 100).toFixed(1);
  if (stats.rateLimits === 0 && stats.otherErrors === 0) {
    console.log('  VERDICT: All clear — should handle the workshop fine.');
  } else if (stats.otherErrors === 0 && parseFloat(limitPct) < 10) {
    console.log(`  VERDICT: Mostly fine — ${stats.rateLimits} rate limits (${limitPct}%) but all retried successfully.`);
    console.log('  Tip: Increase the delay between messages to 2-3s to reduce rate limits.');
  } else if (parseFloat(limitPct) >= 10) {
    console.log(`  VERDICT: Heavy rate limiting — ${stats.rateLimits} hits (${limitPct}%).`);
    console.log('  Recommendations:');
    console.log('    - Increase delay to 3-5s');
    console.log('    - Use a Tier 2+ API key with higher RPM limits');
    console.log('    - Stagger student start times (not all at once)');
    console.log('    - Consider using a cheaper/faster model (gpt-4o-mini, haiku)');
  }
  if (stats.otherErrors > 0) {
    console.log(`  WARNING: ${stats.otherErrors} non-rate-limit errors (${errorPct}%) — check error log above.`);
  }
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

main().catch(console.error);
