import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { extractSlotNames } from '../../../lib/prompts/template-engine';
import { Button } from '../../ui/Button';
import { Switch } from '../../ui/Switch';
import { Select } from '../../ui/Select';
import { isBound } from './model';
import type { StudioAgent } from './model';
import type { ExtractorKey } from '../../../lib/scenario/simple-schema';

interface PromptPaneProps {
  agent: StudioAgent | null;
  defaultParams: Record<string, string | number>;
  onUpdate: (patch: Partial<StudioAgent>) => void;
  onBindParam: (slot: string, value: string) => void;
}

/**
 * Center pane: prompt template editor with {PLACEHOLDER} chips (amber when
 * unbound), plus the supervisor output-schema editor.
 */
export function PromptPane({ agent, defaultParams, onUpdate, onBindParam }: PromptPaneProps) {
  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-callout text-label-3">Select an agent to edit its prompt.</p>
      </div>
    );
  }

  const slots = extractSlotNames(agent.prompt);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <label htmlFor="agent-desc" className="text-caption text-label-2">
          Role description
        </label>
        <input
          id="agent-desc"
          value={agent.description}
          onChange={e => onUpdate({ description: e.target.value })}
          placeholder="One line about who this agent is"
          className="mt-1 h-8 w-full rounded-sm border border-separator-opaque bg-bg-base px-2.5
            text-callout text-label-1 outline-none placeholder:text-label-3
            focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <label htmlFor="agent-prompt" className="text-caption text-label-2">
          Prompt template
        </label>
        <textarea
          id="agent-prompt"
          value={agent.prompt}
          onChange={e => onUpdate({ prompt: e.target.value })}
          spellCheck={false}
          placeholder={'You are the …\n\nUse {PLACEHOLDER} slots for experiment parameters.'}
          className="mt-1 min-h-64 w-full flex-1 resize-none rounded-md border border-separator-opaque
            bg-bg-base p-3 font-mono text-mono-body text-label-1 outline-none placeholder:text-label-3
            focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
        />
        {/* Parameter chips */}
        <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5" data-tour="params-chip-row">
          {slots.length === 0 ? (
            <span className="text-caption-2 text-label-4">
              No parameters detected. Add {'{PLACEHOLDER}'} slots to vary values per experiment.
            </span>
          ) : (
            slots.map(slot => <ParamChip key={slot} slot={slot} bound={isBound(slot, defaultParams)} onBind={onBindParam} />)
          )}
        </div>
      </div>

      {agent.lane === 'supervisor' && (
        <div className="border-t border-separator pt-4">
          <h4 className="text-headline text-label-1">Output schema</h4>
          <p className="mt-0.5 text-caption font-normal text-label-3">
            {agent.supervisorType === 'classifier'
              ? 'Allowed labels; mark terminal labels to end the negotiation.'
              : 'Keys this supervisor extracts from each message.'}
          </p>
          <div className="mt-3">
            {agent.supervisorType === 'classifier' ? (
              <ClassifierSchemaEditor agent={agent} onUpdate={onUpdate} />
            ) : (
              <ExtractorSchemaEditor agent={agent} onUpdate={onUpdate} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ParamChip({ slot, bound, onBind }: { slot: string; bound: boolean; onBind: (slot: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-fill-2 py-0.5 pl-2 pr-1">
        <span className="font-mono text-caption-2 text-label-2">{slot}=</span>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={() => { onBind(slot, value); setEditing(false); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { onBind(slot, value); setEditing(false); }
            if (e.key === 'Escape') setEditing(false);
          }}
          aria-label={`Default value for ${slot}`}
          className="w-20 bg-transparent font-mono text-caption-2 text-label-1 outline-none"
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={bound ? 'Bound to a default value — click to change' : 'Unbound — click to set a default, or bind at Configure'}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-caption-2 font-medium
        transition-colors duration-instant ease-out
        focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
        ${bound ? 'bg-fill-2 text-label-2 hover:bg-fill-1' : 'bg-warning-soft text-warning hover:opacity-80'}`}
    >
      {'{'}{slot}{'}'}
    </button>
  );
}

/* ---------------- classifier: tag input + terminal toggles ---------------- */

function ClassifierSchemaEditor({ agent, onUpdate }: { agent: StudioAgent; onUpdate: (patch: Partial<StudioAgent>) => void }) {
  const [draft, setDraft] = useState('');
  const schema = agent.classifierSchema;

  const addValue = () => {
    const value = draft.trim();
    if (!value || schema.allowedValues.includes(value)) { setDraft(''); return; }
    onUpdate({ classifierSchema: { ...schema, allowedValues: [...schema.allowedValues, value] } });
    setDraft('');
  };

  const removeValue = (value: string) => {
    onUpdate({
      classifierSchema: {
        allowedValues: schema.allowedValues.filter(v => v !== value),
        terminalValues: schema.terminalValues.filter(v => v !== value),
      },
    });
  };

  const toggleTerminal = (value: string, terminal: boolean) => {
    onUpdate({
      classifierSchema: {
        ...schema,
        terminalValues: terminal
          ? [...schema.terminalValues, value]
          : schema.terminalValues.filter(v => v !== value),
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-sm border border-separator-opaque bg-bg-base p-1.5">
        {schema.allowedValues.map(value => (
          <span key={value} className="inline-flex items-center gap-1 rounded-full bg-fill-2 py-0.5 pl-2 pr-1 text-caption-2 font-medium text-label-1">
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => removeValue(value)}
              className="rounded-full p-0.5 text-label-3 hover:text-destructive focus-visible:outline-none focus-visible:text-destructive"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addValue(); }
            if (e.key === 'Backspace' && draft === '' && schema.allowedValues.length > 0) {
              removeValue(schema.allowedValues[schema.allowedValues.length - 1]);
            }
          }}
          onBlur={addValue}
          placeholder={schema.allowedValues.length === 0 ? 'Type a label and press Enter' : 'Add label…'}
          aria-label="Add allowed value"
          className="h-6 min-w-32 flex-1 bg-transparent px-1 text-caption font-normal text-label-1 outline-none placeholder:text-label-3"
        />
      </div>
      {schema.allowedValues.length > 0 && (
        <div className="flex flex-col divide-y divide-separator rounded-sm border border-separator-opaque bg-bg-base px-2.5">
          {schema.allowedValues.map(value => (
            <Switch
              key={value}
              checked={schema.terminalValues.includes(value)}
              onCheckedChange={terminal => toggleTerminal(value, terminal)}
              label={value}
              description="Terminal — ends the negotiation when classified"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- extractor/appraiser: key list ---------------- */

const KEY_TYPES = [{ options: [
  { value: 'string', label: 'string' },
  { value: 'integer', label: 'integer' },
  { value: 'float', label: 'float' },
] }];

function ExtractorSchemaEditor({ agent, onUpdate }: { agent: StudioAgent; onUpdate: (patch: Partial<StudioAgent>) => void }) {
  const schema = agent.extractorSchema;

  const updateKey = (index: number, patch: Partial<ExtractorKey>) => {
    const keys = schema.keys.map((k, i) => (i === index ? { ...k, ...patch } : k));
    onUpdate({ extractorSchema: { keys } });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {schema.keys.map((key, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={key.name}
            onChange={e => updateKey(index, { name: e.target.value })}
            placeholder="key_name"
            aria-label={`Key ${index + 1} name`}
            className="h-7 flex-1 rounded-sm border border-separator-opaque bg-bg-base px-2 font-mono
              text-mono-body text-label-1 outline-none placeholder:text-label-3
              focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
          />
          <div className="w-24">
            <Select
              aria-label={`Key ${index + 1} type`}
              size="sm"
              value={key.type}
              onValueChange={type => updateKey(index, { type: type as ExtractorKey['type'] })}
              groups={KEY_TYPES}
            />
          </div>
          <label className="flex items-center gap-1.5 text-caption font-normal text-label-2">
            <input
              type="checkbox"
              checked={key.nullable}
              onChange={e => updateKey(index, { nullable: e.target.checked })}
              className="accent-[var(--accent-fill)]"
            />
            nullable
          </label>
          <button
            type="button"
            aria-label={`Remove key ${key.name || index + 1}`}
            onClick={() => onUpdate({ extractorSchema: { keys: schema.keys.filter((_, i) => i !== index) } })}
            className="text-label-4 hover:text-destructive focus-visible:outline-none focus-visible:text-destructive"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        icon={<Plus size={13} />}
        onClick={() => onUpdate({ extractorSchema: { keys: [...schema.keys, { name: '', type: 'string', nullable: true }] } })}
        className="self-start"
      >
        Add key
      </Button>
    </div>
  );
}
