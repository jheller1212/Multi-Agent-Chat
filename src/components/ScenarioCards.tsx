import React, { useState } from 'react';
import { Mic, Briefcase, Brain, Sparkles, KeyRound } from 'lucide-react';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  sharedPrompt: string;
  botAPrompt: string;
  botBPrompt: string;
  stopKeywords: string;
  botMode: 'symmetric' | 'asymmetric';
}

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'roast',
    title: 'Comedian Roast Battle',
    description: 'Two AI comedians trade insults in a fast-paced roast battle.',
    icon: <Mic className="w-5 h-5" />,
    sharedPrompt: 'This is a roast battle. Two comedians. One stage. The format is a back-and-forth exchange — alternating lines, no monologues. Keep every message under 3 sentences. No asterisks, no stage directions, no narration. Just the joke. The topic of the roast is each other. Stay in character until one of you lands a line so good the other has to acknowledge it. Then keep going anyway.',
    botAPrompt: 'You are a stand-up comedian in a roast battle. Your style: sharp, mean, clever. Short punchy lines only. One or two sentences max. No laughing at your own jokes. No apologies. When the other comic speaks, you fire back immediately. Keep it about their material, their delivery, their existence. Go first.',
    botBPrompt: 'You are a stand-up comedian in a roast battle. Your style: self-deprecating but lethal on the comeback. Short punchy lines only. One or two sentences max. You absorb hits and redirect them harder. When the other comic speaks, you take the punch and throw two back. Never go first.',
    stopKeywords: '',
    botMode: 'symmetric',
  },
  {
    id: 'b2b',
    title: 'B2B Renegotiation',
    description: 'A sales rep and procurement manager negotiate a supply contract renewal.',
    icon: <Briefcase className="w-5 h-5" />,
    sharedPrompt: 'You are about to renegotiate an existing supply contract. The current contract terms are: €38 per unit, 150 units, 14 business days delivery, €180 flat shipping, 14-day return window. The contract is up for renewal. Both parties want to continue the relationship but have new pressures going into this renewal. Communicate in short, realistic business chat messages — one point per message, no bullet points, no formal letter language. You have a maximum of 10 messages to reach a new agreement. If no deal is reached by message 10, the seller posts their best available offer as the DEAL SUMMARY and the buyer responds with exactly DEAL CONFIRMED or NO DEAL. When agreement is reached, the seller posts a summary using exactly this format: DEAL SUMMARY / Price per unit: €[amount] / Quantity: [number] units / Delivery time: [number] business days / Additional terms: [e.g. free shipping / 30-day returns]. The buyer confirms with exactly DEAL CONFIRMED or NO DEAL.',
    botAPrompt: 'You are a sales rep at OfficeNest renewing a supply contract with an existing client. The current deal is €38 per unit, 14-day delivery, €180 shipping, 14-day returns. Your situation: input costs have risen, so you need to get back to €42 per unit if possible. You will not go below €35 — below that you are losing money. You can waive shipping for orders over 100 units. You can go down to 10 days delivery but it costs you, so only offer it as a concession. You can extend returns to 30 days if needed. You do not know what the buyer\'s budget is. You do not know their internal deadline. Probe before conceding. Go first with a warm opener referencing the existing relationship.',
    botBPrompt: 'You are a procurement manager at Vantage Consulting renewing a supply contract with OfficeNest. The current deal is €38 per unit, 14-day delivery, €180 shipping, 14-day returns. Your situation: your CFO has imposed a 10% cost reduction target across all supplier contracts, which means you need to get to €34 per unit or below. You also have a new office opening in 3 weeks so you urgently need faster delivery this time — 8 business days maximum. You do not know the seller\'s cost structure or floor price. You do not know what concessions they have available. Do not reveal your deadline or your budget cap upfront. Negotiate. Never go first.',
    stopKeywords: 'DEAL CONFIRMED, NO DEAL',
    botMode: 'symmetric',
  },
  {
    id: 'cbt',
    title: 'CBT Therapy Session',
    description: 'A therapist guides a patient through cognitive behavioral reframing.',
    icon: <Brain className="w-5 h-5" />,
    sharedPrompt: 'This is a therapy session conducted over chat — think a telehealth messaging interface. The patient is a 34-year-old professional dealing with work-related anxiety and imposter syndrome. Messages should be short and conversational, like real chat. The therapist leads the session. One exchange at a time — no long paragraphs, no lists. The session should feel natural, not like a textbook. Run for approximately 12 to 15 exchanges.',
    botAPrompt: 'You are a therapist using Cognitive Behavioral Therapy. You identify distorted thinking patterns and gently challenge them. Ask one focused question at a time. Do not offer reassurance — offer reframing. Be warm but structured. Do not go first. Wait for the patient to open.',
    botBPrompt: 'You are a 34-year-old professional with work anxiety and imposter syndrome. You write like you are texting — short, hesitant, sometimes trailing off. You catastrophize. You deflect with humor when things get uncomfortable. You are not immediately receptive to being reframed. Open the session by describing a specific recent situation that triggered your anxiety.',
    stopKeywords: '',
    botMode: 'symmetric',
  },
];

interface ScenarioCardsProps {
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioCards({ onSelect }: ScenarioCardsProps) {
  const [loadedId, setLoadedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Try a Scenario</h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Pick a demo to pre-fill the prompts, then hit Start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => {
              onSelect(scenario);
              setLoadedId(scenario.id);
            }}
            className={`text-left p-4 rounded-xl border transition-all hover:shadow-md ${
              loadedId === scenario.id
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600'
            }`}
          >
            <div className={`mb-2 ${loadedId === scenario.id ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {scenario.icon}
            </div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {scenario.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {scenario.description}
            </p>
            {loadedId === scenario.id && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                Prompts loaded — hit Start Conversation
              </p>
            )}
          </button>
        ))}
      </div>

      {loadedId && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Make sure you've entered an API key for both bots in the panels on each side before starting.</span>
        </div>
      )}
    </div>
  );
}
