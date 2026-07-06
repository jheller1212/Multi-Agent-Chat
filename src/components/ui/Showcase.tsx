import { useState } from 'react';

import { spring } from '../../lib/motion';
import { Button } from './Button';
import { Card, CardDescription, CardTitle, InteractiveCard } from './Card';
import { FileDropZone } from './FileDropZone';
import { SegmentedControl } from './SegmentedControl';
import { Select } from './Select';
import { Sheet } from './Sheet';
import { Slider } from './Slider';
import { Stepper } from './Stepper';
import { Switch } from './Switch';
import { toast } from './Toast';

/**
 * DEV-ONLY component showcase — renders every design-system control in the
 * active theme. Not linked from app navigation; open via #/ui-showcase
 * (see App hook-in). Safe to tree-shake in screens that never reference it.
 */
export function Showcase() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [switchOn, setSwitchOn] = useState(true);
  const [model, setModel] = useState<string | undefined>('claude-sonnet');
  const [view, setView] = useState<'setup' | 'run' | 'results'>('setup');
  const [temperature, setTemperature] = useState(70);
  const [rounds, setRounds] = useState(6);
  const [modalOpen, setModalOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const applyTheme = (next: 'light' | 'dark') => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <div className="min-h-screen bg-bg-grouped p-8 font-sans">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 text-label-1">Component showcase</h1>
            <p className="mt-1 text-callout text-label-2">Dev-only. Design system v1 core controls.</p>
          </div>
          <SegmentedControl
            aria-label="Theme"
            value={theme}
            onValueChange={applyTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </header>

        <Card>
          <CardTitle>Buttons</CardTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary">Run experiment</Button>
            <Button variant="secondary">Save draft</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Delete run</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Switch</CardTitle>
          <div className="mt-2 divide-y divide-separator">
            <Switch
              checked={switchOn}
              onCheckedChange={setSwitchOn}
              label="Stream transcripts live"
              description="Show agent messages as they arrive during a run."
            />
            <Switch checked={false} onCheckedChange={() => undefined} label="Disabled option" disabled />
          </div>
        </Card>

        <Card>
          <CardTitle>Select</CardTitle>
          <div className="mt-3 max-w-xs">
            <Select
              aria-label="Model"
              value={model}
              onValueChange={setModel}
              groups={[
                {
                  label: 'Anthropic',
                  options: [
                    { value: 'claude-sonnet', label: 'Claude Sonnet' },
                    { value: 'claude-haiku', label: 'Claude Haiku' },
                  ],
                },
                {
                  label: 'OpenAI',
                  options: [
                    { value: 'gpt-4o', label: 'GPT-4o' },
                    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
                  ],
                },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Segmented control</CardTitle>
          <div className="mt-3">
            <SegmentedControl
              aria-label="View"
              value={view}
              onValueChange={setView}
              options={[
                { value: 'setup', label: 'Setup' },
                { value: 'run', label: 'Run' },
                { value: 'results', label: 'Results' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Slider &amp; stepper</CardTitle>
          <div className="mt-4 flex flex-col gap-4">
            <Slider
              aria-label="Temperature"
              value={temperature}
              onValueChange={setTemperature}
              min={0}
              max={100}
              formatValue={(v) => (v / 100).toFixed(2)}
            />
            <div className="flex items-center gap-3">
              <span className="text-callout text-label-2">Negotiation rounds</span>
              <Stepper aria-label="Rounds" value={rounds} onValueChange={setRounds} min={1} max={20} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardTitle>Resting card</CardTitle>
            <CardDescription>shadow-1 on grouped background.</CardDescription>
          </Card>
          <InteractiveCard onClick={() => toast.info('Card activated')}>
            <CardTitle>Interactive card</CardTitle>
            <CardDescription>Hover lifts, tap presses.</CardDescription>
          </InteractiveCard>
        </div>

        <Card>
          <CardTitle>Sheets</CardTitle>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button onClick={() => setSideOpen(true)}>Open side sheet</Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Toasts</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => toast.success('Run completed', { detail: '24 transcripts saved.' })}>
              Success
            </Button>
            <Button onClick={() => toast.info('Export started')}>Info</Button>
            <Button onClick={() => toast.warning('API rate limited', { detail: 'Retrying in 20 s.' })}>
              Warning
            </Button>
            <Button
              onClick={() =>
                toast.error('Run failed', {
                  detail: 'Provider returned 401.',
                  action: { label: 'Retry', onClick: () => toast.info('Retrying…') },
                })
              }
            >
              Error
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>File drop zone</CardTitle>
          <div className="mt-3">
            <FileDropZone
              accept={['.json', '.csv']}
              label="Drop scenario file or click to browse"
              onFiles={(files) => toast.success(`Loaded ${files[0].name}`)}
            />
          </div>
        </Card>

        <p className="pb-8 text-center text-caption font-normal text-label-3 tnum">
          Springs: snappy {String(spring.snappy.stiffness)}/{String(spring.snappy.damping)} · standard{' '}
          {String(spring.standard.stiffness)}/{String(spring.standard.damping)} · gentle{' '}
          {String(spring.gentle.stiffness)}/{String(spring.gentle.damping)}
        </p>
      </div>

      <Sheet
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="New experiment"
        description="Configure the negotiation before launching."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModalOpen(false); toast.success('Experiment created'); }}>
              Create
            </Button>
          </>
        }
      >
        <p className="text-body text-label-2">Modal body content. Max width 480px, opaque elevated surface over a blurred scrim.</p>
      </Sheet>

      <Sheet
        open={sideOpen}
        onOpenChange={setSideOpen}
        variant="side"
        title="Run inspector"
        description="Right-anchored 420px panel."
      >
        <p className="text-body text-label-2">Side sheet content — transcript details, parameters, exports.</p>
      </Sheet>
    </div>
  );
}
