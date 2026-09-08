import { Gauge, Globe2, Layers3, Settings2, ShieldCheck } from 'lucide-react';
import type { NavId } from '../data/overyn';
import { BrandMark } from './BrandMark';

interface SidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
}

const items = [
  { id: 'overview', label: 'Visão geral', icon: Gauge },
  { id: 'profiles', label: 'Perfis', icon: Layers3 },
  { id: 'proxies', label: 'Proxies', icon: Globe2 },
  { id: 'security', label: 'Segurança', icon: ShieldCheck },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
] as const;

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandMark />
        <span className="version-chip">BETA</span>
      </div>
      <nav className="nav-list" aria-label="Navegação principal">
        <span className="nav-label">GERENCIAMENTO</span>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button className={`nav-item ${active === item.id ? 'is-active' : ''}`} key={item.id} onClick={() => onNavigate(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="protection-card"><ShieldCheck size={18} /><div><strong>Proteção ativa</strong><span>Sem fallback direto</span></div></div>
        <div className="account-row"><div className="avatar">E</div><div><strong>Workspace local</strong><span>Overyn Desktop</span></div></div>
      </div>
    </aside>
  );
}
