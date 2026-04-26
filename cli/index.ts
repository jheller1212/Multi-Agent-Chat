#!/usr/bin/env node

/**
 * Multi-Agent-Chat CLI Runner
 * Secondary interface for power users who want batch automation.
 *
 * Usage:
 *   npx tsx cli/index.ts run --experiment <id> --concurrency 5
 *   npx tsx cli/index.ts export --run <id> --format csv
 *   npx tsx cli/index.ts list-scenarios
 */

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
Multi-Agent-Chat CLI

Commands:
  run              Run an experiment
    --experiment   Experiment ID (from Supabase)
    --concurrency  Number of parallel dyads (default: 5)
    --dev          Enable dev mode (skip supervisors)

  export           Export experiment data
    --run          Run ID
    --format       csv or json (default: csv)

  list-scenarios   List available scenarios
  list-experiments List experiments

Environment:
  SUPABASE_URL     Supabase project URL
  SUPABASE_KEY     Supabase anon key
  OPENAI_API_KEY   OpenAI API key
  ANTHROPIC_API_KEY Anthropic API key
  (etc. for each provider)
`);
}

async function main() {
  switch (command) {
    case 'run':
      console.log('Experiment runner: not yet wired to CLI. Use the browser UI.');
      console.log('CLI integration coming in the next release.');
      break;
    case 'export':
      console.log('Export: not yet wired to CLI. Use the browser UI to download CSVs.');
      break;
    case 'list-scenarios':
      console.log('Scenarios: use the browser Library to browse scenarios.');
      break;
    case 'list-experiments':
      console.log('Experiments: use the browser UI to manage experiments.');
      break;
    default:
      printUsage();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
