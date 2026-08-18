/**
 * ScenarioBuilder — kept as the mount point in ResearchLayout; internals
 * replaced by the Scenario Studio (design-system rebuild, task #9).
 * The legacy tabbed builder lived here before; see studio/ for the panes.
 */
import { ScenarioStudio } from './studio/ScenarioStudio';

interface ScenarioBuilderProps {
  scenarioId?: string;
  onUseInExperiment?: (scenarioId: string) => void;
}

export function ScenarioBuilder({ scenarioId, onUseInExperiment }: ScenarioBuilderProps) {
  return <ScenarioStudio scenarioId={scenarioId} onUseInExperiment={onUseInExperiment} />;
}
