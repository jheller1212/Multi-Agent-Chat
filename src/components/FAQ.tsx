import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "What is AI2AI-Chat?",
    a: "A free tool that puts two AI models in conversation with each other. You configure each model independently — provider, version, system prompt, temperature — then watch them converse and export the results. No coding required.",
  },
  {
    q: "Who is it for?",
    a: "Researchers studying AI behaviour, business teams testing negotiation or sales strategies, educators teaching AI literacy, and anyone curious about how different models interact.",
  },
  {
    q: "Is it free?",
    a: "Yes. The platform is free. You bring your own API keys from OpenAI, Anthropic, Google, or Mistral and pay only those providers for the tokens you use.",
  },
  {
    q: "Which models are supported?",
    a: "GPT-4o and variants (OpenAI), Claude Opus 4.6, Sonnet 4.6, and Haiku 4.5 (Anthropic), Gemini 1.5 Pro and Flash (Google), and Mistral Large / Medium / Small.",
  },
  {
    q: "Are my API keys safe?",
    a: "Keys are encrypted with AES-256 on our server and stored securely so they persist across sessions and devices. They are only decrypted when you log in. Keys are also cleared from your browser on sign-out.",
  },
  {
    q: "Can I use it with a group?",
    a: "Absolutely. Share a single API key with your group, pick a built-in scenario (or create your own), and share the config via URL so everyone starts from the same setup. We've tested it with 15+ concurrent users on a single key with zero issues.",
  },
  {
    q: "What are the built-in scenarios?",
    a: "The app ships with ready-to-go scenarios — a comedian roast battle, a B2B contract negotiation, and a CBT therapy session. Each one pre-fills both system prompts and conversation settings so you can start instantly.",
  },
  {
    q: "Can I export the data?",
    a: "Yes. Download conversations as CSV (message content, word counts, response times, model settings, timestamps) or as plain text. Screenshot export is also available.",
  },
  {
    q: "What is auto-interact mode?",
    a: "The two AIs automatically take turns responding to each other up to a configured turn limit. Disable it to trigger each response manually.",
  },
  {
    q: "What is repetition mode?",
    a: "Runs the same conversation from scratch N times in sequence. Each run is saved separately and labelled in the export — useful for collecting multiple varied responses to the same prompt.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-gray-800 font-medium hover:text-orange-600 transition-colors gap-4"
      >
        <span>{q}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-gray-600 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <div className="py-10 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">FAQ</h2>
        <div className="bg-white rounded-xl border border-gray-200 px-6">
          {faqs.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
