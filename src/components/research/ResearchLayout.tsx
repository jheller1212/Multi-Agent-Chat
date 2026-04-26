import { useState } from 'react';
import { ResearchShell } from './ResearchShell';
import { Library } from './Library';
import { RunDashboard } from './RunDashboard';
import { TranscriptViewer } from './TranscriptViewer';
import { ScenarioBuilder } from './ScenarioBuilder';

type ResearchScreen = 'library' | 'scenario' | 'runs' | 'transcript';

const BREADCRUMBS: Record<ResearchScreen, string[]> = {
  library: ['Research', 'Library'],
  scenario: ['Research', 'Scenarios', 'B2B Renegotiation — capability variant'],
  runs: ['Research', 'Experiments', 'Buyer Capability × Provider', 'Run #14'],
  transcript: ['Research', 'Run #14', 'Cell A4', 'd_0247'],
};

const PAGE_MAP: Record<ResearchScreen, string> = {
  library: 'library',
  scenario: 'scenario',
  runs: 'runs',
  transcript: 'runs',
};

interface ResearchLayoutProps {
  onBack: () => void;
}

export function ResearchLayout({ onBack }: ResearchLayoutProps) {
  const [screen, setScreen] = useState<ResearchScreen>('library');

  const handleNavClick = (page: string) => {
    switch (page) {
      case 'library': setScreen('library'); break;
      case 'scenario': setScreen('scenario'); break;
      case 'experiment': setScreen('scenario'); break;
      case 'runs': setScreen('runs'); break;
      case 'results': setScreen('library'); break;
      case 'chat': onBack(); break;
      case 'history': onBack(); break;
      default: setScreen('library');
    }
  };

  return (
    <ResearchShell
      activePage={PAGE_MAP[screen]}
      breadcrumb={BREADCRUMBS[screen]}
      onNavClick={handleNavClick}
    >
      {screen === 'library' && <Library />}
      {screen === 'scenario' && <ScenarioBuilder />}
      {screen === 'runs' && <RunDashboard />}
      {screen === 'transcript' && <TranscriptViewer />}
    </ResearchShell>
  );
}
