import { ArrowRight, Globe2, Layers3, Plus, ShieldCheck, Zap } from 'lucide-react';
import type { BrowserProfile, ProxyConfig } from '../data/overyn';

interface OverviewPageProps {
  profiles: BrowserProfile[];
  proxies: ProxyConfig[];
  onCreateProfile: () => void;
  onNavigateProfiles: () => void;
  onNavigateProxies: () => void;
}

export function OverviewPage({ profiles, proxies, onCreateProfile, onNavigateProfiles, onNavigateProxies }: OverviewPageProps) {
  const online = proxies.filter((proxy) => proxy.status === 'online').length;
  const protectedProfiles = profiles.filter((profile) => profile.proxyId).length;
  return (
    <main className="page overview-page">
      <section className="page-heading hero-heading">
        <div><span className="eyebrow">PAINEL PRINCIPAL</span><h1>Controle seus ambientes<br />em um só lugar.</h1><p>Perfis separados, configuração de rede individual e uma visão clara de cada sessão.</p></div>
        <button className="primary-button" onClick={onCreateProfile}><Plus size={17} /> Novo perfil</button>
      </section>
      <section className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><Layers3 size={20} /></div><span>Perfis</span><strong>{String(profiles.length).padStart(2, '0')}</strong><small>{profiles.filter((profile) => profile.status === 'running').length} em execução</small></article>
        <article className="metric-card"><div className="metric-icon"><Globe2 size={20} /></div><span>Proxies</span><strong>{String(proxies.length).padStart(2, '0')}</strong><small>{online} validadas agora</small></article>
        <article className="metric-card"><div className="metric-icon"><ShieldCheck size={20} /></div><span>Perfis protegidos</span><strong>{protectedProfiles}</strong><small>com rede configurada</small></article>
        <article className="metric-card accent-card"><div className="metric-icon"><Zap size={20} /></div><span>Overyn Core</span><strong>ON</strong><small>isolamento de sessão ativo</small></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel profiles-panel">
          <div className="panel-heading"><div><span className="eyebrow">PERFIS RECENTES</span><h2>Seus ambientes</h2></div><button className="text-button" onClick={onNavigateProfiles}>Ver todos <ArrowRight size={15} /></button></div>
          <div className="profile-preview-list">{profiles.slice(0, 4).map((profile) => { const proxy = proxies.find((item) => item.id === profile.proxyId); return <div className="profile-preview" key={profile.id}><div className="profile-avatar">{profile.name.slice(0, 1).toUpperCase()}</div><div className="profile-preview-copy"><strong>{profile.name}</strong><span>{proxy ? `${proxy.protocol.toUpperCase()} · ${proxy.name}` : 'Conexão direta'}</span></div><span className={`status-badge ${profile.status}`}>{profile.status === 'running' ? 'Ativo' : 'Pronto'}</span></div>; })}</div>
        </article>
        <article className="panel network-panel">
          <div className="panel-heading"><div><span className="eyebrow">REDE</span><h2>Estado das conexões</h2></div><button className="text-button" onClick={onNavigateProxies}>Gerenciar <ArrowRight size={15} /></button></div>
          <div className="network-visual"><div className="network-core"><ShieldCheck size={26} /><span>Overyn</span></div><div className="network-line" /><div className="network-nodes"><span><i className="online" /> Proxy</span><span><i /> Perfil</span><span><i /> Sessão</span></div></div>
          <p className="panel-note">Cada perfil pode usar sua própria configuração HTTP, HTTPS ou SOCKS5.</p>
        </article>
      </section>
    </main>
  );
}
