import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { HomePage } from './components/HomePage';
import { ProjectsPage } from './components/ProjectsPage';
import { MissionsPage } from './components/MissionsPage';
import { TeamPage } from './components/TeamPage';
import { SkillsPage } from './components/SkillsPage';
import { EvidencePage } from './components/EvidencePage';
import type { NavId } from './data/mock';

export default function App() {
  const [active, setActive] = useState<NavId>('home');
  const content = {
    home: <HomePage />,
    projects: <ProjectsPage />,
    missions: <MissionsPage />,
    team: <TeamPage />,
    skills: <SkillsPage />,
    evidence: <EvidencePage />,
  }[active];

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="app-main">
        <Topbar />
        <div className="app-scroll">{content}</div>
      </div>
    </div>
  );
}
