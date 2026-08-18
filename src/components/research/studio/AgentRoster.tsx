import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';

import { Button } from '../../ui/Button';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { toast } from '../../ui/Toast';
import { MAX_AGENTS, MIN_NEGOTIATORS, newAgentId } from './model';
import type { StudioAgent, SupervisorTiming, SupervisorType } from './model';

interface AgentRosterProps {
  agents: StudioAgent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (agents: StudioAgent[]) => void;
}

/** Design-system agent identity color by roster position (1-based, wraps). */
export function agentColorVar(index: number): string {
  return `var(--agent-${(index % 5) + 1})`;
}

const LANES = [
  { id: 'negotiator', label: 'Negotiators', hint: 'Order sets speaking order' },
  { id: 'supervisor', label: 'Supervisors', hint: 'Observe and measure' },
] as const;

/**
 * Left pane: two dnd-kit lanes. Reorder within Negotiators = speaking order;
 * dragging across lanes changes the agent's role. Keyboard: space lifts,
 * arrows move, space drops.
 */
export function AgentRoster({ agents, selectedId, onSelect, onChange }: AgentRosterProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const laneAgents = (lane: StudioAgent['lane']) => agents.filter(a => a.lane === lane);

  const findAgent = (id: string) => agents.find(a => a.id === id);

  /** Move the dragged agent into the lane it is hovering over. */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const agent = findAgent(String(active.id));
    if (!agent) return;

    const overAgent = findAgent(String(over.id));
    const targetLane =
      overAgent?.lane ?? (over.id === 'negotiator' || over.id === 'supervisor' ? (over.id as StudioAgent['lane']) : null);
    if (!targetLane || agent.lane === targetLane) return;

    if (agent.lane === 'negotiator' && laneAgents('negotiator').length <= MIN_NEGOTIATORS) return;

    onChange(agents.map(a => (a.id === agent.id ? { ...a, lane: targetLane } : a)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const agent = findAgent(String(active.id));
    const overAgent = findAgent(String(over.id));
    if (!agent || !overAgent || agent.lane !== overAgent.lane) return;

    const lane = laneAgents(agent.lane);
    const from = lane.findIndex(a => a.id === agent.id);
    const to = lane.findIndex(a => a.id === overAgent.id);
    if (from === -1 || to === -1) return;
    const reordered = arrayMove(lane, from, to);
    const other = agents.filter(a => a.lane !== agent.lane);
    // Preserve lane blocks: negotiators first (their order = speaking order).
    onChange(agent.lane === 'negotiator' ? [...reordered, ...other] : [...other, ...reordered]);
  };

  const addAgent = (lane: StudioAgent['lane']) => {
    if (agents.length >= MAX_AGENTS) {
      toast.warning(`Scenarios support up to ${MAX_AGENTS} agents.`);
      return;
    }
    const count = laneAgents(lane).length + 1;
    const agent: StudioAgent = {
      id: newAgentId(),
      name: lane === 'negotiator' ? `Negotiator ${count}` : `Supervisor ${count}`,
      description: '',
      lane,
      prompt: '',
      supervisorType: 'classifier',
      timing: 'per_round',
      classifierSchema: { allowedValues: [], terminalValues: [] },
      extractorSchema: { keys: [] },
    };
    onChange([...agents, agent]);
    onSelect(agent.id);
  };

  const removeAgent = (id: string) => {
    const agent = findAgent(id);
    if (!agent) return;
    if (agent.lane === 'negotiator' && laneAgents('negotiator').length <= MIN_NEGOTIATORS) {
      toast.warning(`Keep at least ${MIN_NEGOTIATORS} negotiators.`);
      return;
    }
    onChange(agents.filter(a => a.id !== id));
  };

  const updateAgent = (id: string, patch: Partial<StudioAgent>) => {
    onChange(agents.map(a => (a.id === id ? { ...a, ...patch } : a)));
  };

  const dragging = draggingId ? findAgent(draggingId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setDraggingId(String(e.active.id))}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="flex flex-col gap-5" data-tour="agent-roster-lanes">
        {LANES.map(lane => {
          const items = laneAgents(lane.id);
          return (
            <Lane key={lane.id} laneId={lane.id} label={lane.label} hint={lane.hint}>
              <SortableContext items={items.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {items.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      colorVar={agentColorVar(agents.indexOf(agent))}
                      selected={agent.id === selectedId}
                      dimmed={agent.id === draggingId}
                      speakingOrder={lane.id === 'negotiator' ? items.indexOf(agent) + 1 : undefined}
                      onSelect={() => onSelect(agent.id)}
                      onRemove={() => removeAgent(agent.id)}
                      onUpdate={patch => updateAgent(agent.id, patch)}
                    />
                  ))}
                </div>
              </SortableContext>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={13} />}
                disabled={agents.length >= MAX_AGENTS}
                onClick={() => addAgent(lane.id)}
                className="mt-2 w-full justify-start"
              >
                Add {lane.id}
              </Button>
            </Lane>
          );
        })}
      </div>
      <DragOverlay>
        {dragging && (
          <div className="rounded-md bg-bg-elevated p-3 shadow-3 scale-[1.02]">
            <span className="text-callout font-medium text-label-1">{dragging.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Lane({
  laneId,
  label,
  hint,
  children,
}: {
  laneId: StudioAgent['lane'];
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: laneId });
  return (
    <section
      ref={setNodeRef}
      className={`rounded-md p-2 transition-colors duration-fast ease-out ${isOver ? 'bg-accent-soft' : ''}`}
    >
      <header className="flex items-baseline justify-between px-1 pb-2">
        <h3 className="text-caption-2 uppercase tracking-[0.06em] text-label-3">{label}</h3>
        <span className="text-caption-2 text-label-4">{hint}</span>
      </header>
      {children}
    </section>
  );
}

interface AgentCardProps {
  agent: StudioAgent;
  colorVar: string;
  selected: boolean;
  dimmed: boolean;
  speakingOrder?: number;
  onSelect: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<StudioAgent>) => void;
}

function AgentCard({ agent, colorVar, selected, dimmed, speakingOrder, onSelect, onRemove, onUpdate }: AgentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: agent.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-md border bg-bg-elevated p-3 transition-colors duration-instant ease-out
        ${dimmed ? 'opacity-40' : ''}
        ${selected ? 'border-accent shadow-1' : 'border-separator hover:bg-fill-3'}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onSelect(); }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Reorder ${agent.name}`}
          className="cursor-grab touch-none text-label-4 opacity-0 transition-opacity duration-instant
            focus-visible:opacity-100 focus-visible:outline-none focus-visible:text-accent group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorVar }} />
        <input
          value={agent.name}
          onChange={e => onUpdate({ name: e.target.value })}
          onClick={e => e.stopPropagation()}
          aria-label="Agent name"
          className="min-w-0 flex-1 bg-transparent text-callout font-semibold text-label-1 outline-none"
        />
        {speakingOrder !== undefined && (
          <span className="tnum font-mono text-caption-2 text-label-3">#{speakingOrder}</span>
        )}
        <button
          type="button"
          aria-label={`Remove ${agent.name}`}
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-caption-2 text-label-4 opacity-0 transition-opacity duration-instant
            hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
        >
          Remove
        </button>
      </div>

      {agent.lane === 'supervisor' && (
        <div className="mt-2.5 flex flex-col gap-1.5 pl-6" onClick={e => e.stopPropagation()}>
          <SegmentedControl<SupervisorType>
            aria-label={`${agent.name} supervisor type`}
            value={agent.supervisorType}
            onValueChange={supervisorType => onUpdate({ supervisorType })}
            options={[
              { value: 'classifier', label: 'Classifier' },
              { value: 'extractor', label: 'Extractor' },
              { value: 'appraiser', label: 'Appraiser' },
            ]}
          />
          <SegmentedControl<SupervisorTiming>
            aria-label={`${agent.name} timing`}
            value={agent.timing}
            onValueChange={timing => onUpdate({ timing })}
            options={[
              { value: 'per_round', label: 'Per round' },
              { value: 'post_termination', label: 'Post termination' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
