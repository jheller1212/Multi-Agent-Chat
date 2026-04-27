import { useState } from 'react';

type TourScreen = 'library' | 'scenario' | 'experiment' | 'runs' | 'settings';

interface TourStep {
  title: string;
  description: string;
  screen: TourScreen;
  stepLabel: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Multi-Agent-Chat',
    description:
      'A research platform for running multi-agent LLM experiments. Let\'s walk through the key features.',
    screen: 'library',
    stepLabel: 'Step 1 of 7',
  },
  {
    title: 'Browse Scenario Templates',
    description:
      'Clone a pre-built template (Procurement, Legal, Mediation) or create your own from scratch. Each scenario defines agents, turn-taking rules, and outcome schemas.',
    screen: 'library',
    stepLabel: 'Step 2 of 7',
  },
  {
    title: 'Build Your Scenario',
    description:
      'Define domain agents (participants) and supervisor agents (observers). Edit prompts with {SLOT} variables that become experiment parameters. Configure turn-taking policy and outcome CSV columns.',
    screen: 'scenario',
    stepLabel: 'Step 3 of 7',
  },
  {
    title: 'Design Experiments',
    description:
      'Define factors (independent variables) with levels. The platform cross-joins all factors to create experimental cells. Set how many dyads (conversations) to run per cell.',
    screen: 'experiment',
    stepLabel: 'Step 4 of 7',
  },
  {
    title: 'Connect Your LLM Provider',
    description:
      'Go to Settings to enter your API key (OpenAI, Anthropic, etc.). Keys are stored encrypted in your browser — never on our servers. You need at least one key before running experiments.',
    screen: 'settings',
    stepLabel: 'Step 5 of 7',
  },
  {
    title: 'Monitor Live Experiments',
    description:
      'Watch your experiment progress in real-time. See completed/failed/running counts per cell. Click any cell to inspect individual conversation transcripts.',
    screen: 'runs',
    stepLabel: 'Step 6 of 7',
  },
  {
    title: "You're Ready!",
    description:
      'Clone a scenario from the Library and launch your first experiment. Start with Dev Mode enabled (cheaper — skips supervisor agents) to test your setup.',
    screen: 'library',
    stepLabel: 'Step 7 of 7',
  },
];

interface OnboardingTourProps {
  onNavigate: (screen: TourScreen) => void;
  onClose: () => void;
}

export function OnboardingTour({ onNavigate, onClose }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      const next = stepIndex + 1;
      setStepIndex(next);
      onNavigate(TOUR_STEPS[next].screen);
    }
  };

  const finish = () => {
    localStorage.setItem('mac_tour_completed', 'true');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 28, 61, 0.4)',
          zIndex: 100,
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          background: 'var(--surface-panel)',
          border: '1px solid var(--line-1)',
          borderRadius: 8,
          boxShadow: 'var(--shadow-3, 0 8px 32px rgba(0,0,0,0.18))',
          maxWidth: 400,
          width: 'calc(100vw - 48px)',
          padding: '24px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Step indicator */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-4)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {step.stepLabel}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: 'var(--font-h)',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-1)',
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: 'var(--font-app)',
            fontSize: 13,
            color: 'var(--text-2)',
            lineHeight: 1.55,
          }}
        >
          {step.description}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <button
            onClick={finish}
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              color: 'var(--text-3)',
              textDecoration: 'underline',
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            Skip tour
          </button>

          <button className="r-btn r-btn-primary" onClick={handleNext}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
