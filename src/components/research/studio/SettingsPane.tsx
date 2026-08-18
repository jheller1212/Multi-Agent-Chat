import { SegmentedControl } from '../../ui/SegmentedControl';
import { Select } from '../../ui/Select';
import { Stepper } from '../../ui/Stepper';
import type { StudioAgent, StudioSettings } from './model';
import type { OutcomeSchema, TurnPolicy } from '../../../types/scenario';

interface SettingsPaneProps {
  settings: StudioSettings;
  agents: StudioAgent[];
  outcomeSchema: OutcomeSchema;
  onChange: (settings: StudioSettings) => void;
}

type PolicyOption = Extract<TurnPolicy['type'], 'alternating' | 'mediator_led' | 'structured_sequence'>;

/** Right pane: turn policy, termination, and a read-only outcome summary. */
export function SettingsPane({ settings, agents, outcomeSchema, onChange }: SettingsPaneProps) {
  const supervisors = agents.filter(a => a.lane === 'supervisor');
  const classifierTerminals = supervisors.filter(
    s => s.supervisorType === 'classifier' && s.classifierSchema.terminalValues.length > 0,
  );

  // round_robin (legacy) renders as Alternating in the control; saving keeps the chosen value.
  const policyValue: PolicyOption =
    settings.turnPolicyType === 'mediator_led' || settings.turnPolicyType === 'structured_sequence'
      ? settings.turnPolicyType
      : 'alternating';

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h4 className="text-headline text-label-1">Turn policy</h4>
        <div className="mt-2">
          <SegmentedControl<PolicyOption>
            aria-label="Turn policy"
            value={policyValue}
            onValueChange={turnPolicyType => onChange({ ...settings, turnPolicyType })}
            options={[
              { value: 'alternating', label: 'Alternating' },
              { value: 'mediator_led', label: 'Mediator-led' },
              { value: 'structured_sequence', label: 'Structured' },
            ]}
          />
        </div>
        {settings.turnPolicyType === 'mediator_led' && (
          <div className="mt-2">
            <Select
              aria-label="Mediator"
              placeholder="Choose mediator…"
              value={settings.mediatorId ?? undefined}
              onValueChange={mediatorId => onChange({ ...settings, mediatorId })}
              groups={[{ options: supervisors.map(s => ({ value: s.id, label: s.name })) }]}
            />
            {supervisors.length === 0 && (
              <p className="mt-1 text-caption-2 text-warning">Add a supervisor to act as mediator.</p>
            )}
          </div>
        )}
      </section>

      <section>
        <h4 className="text-headline text-label-1">Termination</h4>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-callout text-label-2">Turn cap</span>
          <Stepper
            aria-label="Turn cap"
            value={settings.turnCap}
            onValueChange={turnCap => onChange({ ...settings, turnCap })}
            min={1}
            max={50}
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {classifierTerminals.length === 0 ? (
            <p className="text-caption-2 text-label-4">
              No classifier terminal labels — runs end at the turn cap only.
            </p>
          ) : (
            classifierTerminals.map(s => (
              <p key={s.id} className="text-caption font-normal text-label-2">
                <span className="font-medium text-label-1">{s.name}</span> ends the run on{' '}
                <span className="font-mono text-caption-2">{s.classifierSchema.terminalValues.join(', ')}</span>
              </p>
            ))
          )}
        </div>
      </section>

      <section>
        <h4 className="text-headline text-label-1">Outcome schema</h4>
        <p className="mt-0.5 text-caption-2 text-label-4">Read-only — derived from supervisors and scenario outcomes.</p>
        <div className="mt-2 overflow-hidden rounded-sm border border-separator-opaque">
          {outcomeSchema.columns.length === 0 ? (
            <p className="p-2.5 text-caption font-normal text-label-3">No outcome columns defined.</p>
          ) : (
            <table className="w-full">
              <tbody className="divide-y divide-separator">
                {outcomeSchema.columns.map(col => (
                  <tr key={col.name}>
                    <td className="px-2.5 py-1.5 font-mono text-mono-data text-label-1">{col.name}</td>
                    <td className="px-2.5 py-1.5 text-right text-caption-2 text-label-3">
                      {col.type}{col.nullable ? '?' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
