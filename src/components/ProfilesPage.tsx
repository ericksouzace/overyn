import { Edit3, LoaderCircle, Play, Plus, ShieldCheck, Square, Trash2 } from 'lucide-react';
import type { BrowserProfile, ProxyConfig } from '../data/overyn';

interface ProfilesPageProps {
  profiles: BrowserProfile[];
  proxies: ProxyConfig[];
  actionId?: string | undefined;
  onCreate: () => void;
  onEdit: (profile: BrowserProfile) => void;
  onToggle: (profile: BrowserProfile) => Promise<void>;
  onDelete: (profile: BrowserProfile) => Promise<void>;
}

export function ProfilesPage({ profiles, proxies, actionId, onCreate, onEdit, onToggle, onDelete }: ProfilesPageProps) {
  return (
    <main className="page">
      <section className="page-heading"><div><span className="eyebrow">PERFIS</span><h1>Ambientes separados</h1><p>Abra sessões persistentes com diretório próprio e configuração de rede individual.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17} /> Novo perfil</button></section>
      <section className="profiles-grid">
        {profiles.map((profile) => {
          const proxy = proxies.find((item) => item.id === profile.proxyId);
          const busy = actionId === profile.id;
          return <article className="profile-card" key={profile.id}>
            <div className="profile-card-top"><div className="profile-avatar large">{profile.name.slice(0, 1).toUpperCase()}</div><button className="icon-button" title="Editar perfil" disabled={busy || profile.status === 'running'} onClick={() => onEdit(profile)}><Edit3 size={16} /></button></div>
            <div className="profile-card-copy"><h2>{profile.name}</h2><p>{profile.note || profile.startUrl || 'Sem descrição'}</p></div>
            <div className="profile-network"><ShieldCheck size={16} /><div><span>Rede</span><strong>{proxy ? proxy.name : 'Conexão direta'}</strong></div>{proxy ? <span className={`proxy-dot ${proxy.status}`} /> : null}</div>
            <div className="profile-meta"><span>Criado {profile.createdAt}</span><span className={`status-badge ${profile.status}`}>{profile.status === 'running' ? 'Em execução' : 'Pronto'}</span></div>
            <div className="profile-actions"><button className={profile.status === 'running' ? 'secondary-button' : 'primary-button'} disabled={busy} onClick={() => { void onToggle(profile); }}>{busy ? <><LoaderCircle size={15} className="spin" /> Aguarde</> : profile.status === 'running' ? <><Square size={15} /> Encerrar</> : <><Play size={15} fill="currentColor" /> Abrir</>}</button><button className="danger-button" disabled={busy} title="Excluir perfil" onClick={() => { void onDelete(profile); }}><Trash2 size={15} /></button></div>
          </article>;
        })}
        <button className="profile-card add-card" onClick={onCreate}><Plus size={24} /><strong>Criar novo perfil</strong><span>Adicionar outro ambiente separado</span></button>
      </section>
    </main>
  );
}
