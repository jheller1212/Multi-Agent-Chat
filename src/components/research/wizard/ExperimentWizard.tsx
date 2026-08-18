import { useState } from 'react';
import { ArrowLeft, Check, Lock, Rocket } from 'lucide-react';

import { Button } from '../../ui/Button';
import { Card, CardTitle, CardDescription } from '../../ui/Card';
import { ConfigureStep } from './ConfigureStep';
import type { ConfigureResult } from './ConfigureStep';

export interface ExperimentWizardProps {
  scenarioId?: string;
  onBack?: () => void;
  /** Fires when a run launches (step 3 — lands with task #21). */
  onLaunch?: (experimentId: string) => void;
}

type StepId = 1 | 2 | 3;

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: 'Configure' },
  { id: 2, label: 'Freeze' },
  { id: 3, label: 'Launch' },
];

/**
 * New Experiment wizard shell. Step 1 (Configure) is live; steps 2 (Freeze)
 * and 3 (Launch) are placeholders until task #21 lands the prompt-freeze
 * accordion and readiness checklist.
 */
export function ExperimentWizard({ scenarioId, onBack }: ExperimentWizardProps) {
  const [step, setStep] = useState<StepId>(1);
  const [configured, setConfigured] = useState<ConfigureResult | null>(null);

  return (
    <div className="min-h-full bg-bg-grouped">
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        {/* Header + stepper */}
        <header className="mb-6 flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={onBack}>
              Back
            </Button>
          )}
          <h1 className="text-title-2 text-label-1">New experiment</h1>
          <nav aria-label="Wizard steps" className="ml-auto flex items-center gap-1">
            {STEPS.map((s, i) => {
              const done = s.id < step;
              const active = s.id === step;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  {i > 0 && <span className="h-px w-6 bg-separator-opaque" />}
                  <button
                    type="button"
                    disabled={s.id > step}
                    onClick={() => setStep(s.id)}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-caption
                      transition-colors duration-fast ease-out
                      focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
                      disabled:pointer-events-none
                      ${active ? 'bg-accent-soft text-accent' : done ? 'text-label-2 hover:bg-fill-3' : 'text-label-4'}`}
                  >
                    <span className={`tnum flex h-4 w-4 items-center justify-center rounded-full font-mono text-caption-2
                      ${active ? 'bg-accent-fill text-accent-on' : done ? 'bg-fill-1 text-label-2' : 'bg-fill-3 text-label-4'}`}
                    >
                      {done ? <Check size={10} strokeWidth={3} /> : s.id}
                    </span>
                    {s.label}
                  </button>
                </div>
              );
            })}
          </nav>
        </header>

        {step === 1 && (
          <ConfigureStep
            initialScenarioId={scenarioId}
            onContinue={result => { setConfigured(result); setStep(2); }}
          />
        )}
        {step === 2 && (
          <PlaceholderStep
            icon={<Lock size={22} strokeWidth={1.5} className="text-label-3" />}
            title="Freeze prompts"
            detail={`Prompt templates are hashed (SHA-256) and locked before launch so every dyad runs the exact registered text.${configured ? ` Draft “${configured.name}” is saved and ready.` : ''} This step arrives with the next update.`}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <PlaceholderStep
            icon={<Rocket size={22} strokeWidth={1.5} className="text-label-3" />}
            title="Launch"
            detail="Readiness checklist with provider preflight, then launch. This step arrives with the next update."
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}

function PlaceholderStep({
  icon,
  title,
  detail,
  onBack,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  onBack: () => void;
}) {
  return (
    <Card className="mx-auto max-w-[560px] py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-bg-sunken">{icon}</div>
      <div className="mt-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mx-auto max-w-96">{detail}</CardDescription>
      </div>
      <div className="mt-5">
        <Button variant="secondary" onClick={onBack}>Back to Configure</Button>
      </div>
    </Card>
  );
}
