import { Edit3, Globe2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { ProxyConfig } from '../data/overyn';

interface ProxiesPageProps {
  proxies: ProxyConfig[];
  testingId?: string;
  onCreate: () => void;
  onEdit: (proxy: ProxyConfig) => void;
  onTest: (proxy: ProxyConfig) => void;
  onDelete: (id: string) => void;
}

export function ProxiesPage({ proxies, testingId, onCreate, onEdit, onTest, onDelete }: ProxiesPageProps) {
  return (
    <main className="page">
      <section className="page-heading"><div><span className="eyebrow">PROXIES</span><h1>Rede por perfil</h1><p>Cadastre conexões HTTP, HTTPS ou SOCKS5 e valide o IP antes de vincular ao perfil.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17} /> Adicionar proxy</button></section>
      <section className="table-panel proxy-table">
        <div className="table-head"><span>Conexão</span><span>Endpoint</span><span>IP detectado</span><span>Latência</span><span>Status</span><span>Ações</span></div>
        {proxies.map((proxy) => <div className="table-row" key={proxy.id}><div className="connection-name"><div className="protocol-icon"><Globe2 size={16} /></div><div><strong>{proxy.name}</strong><span>{proxy.protocol.toUpperCase()}</span></div></div><span className="mono">{proxy.host}:{proxy.port}</span><span className="mono">{proxy.lastIp ?? '—'}</span><span>{proxy.latencyMs ? `${proxy.latencyMs} ms` : '—'}</span><span className={`proxy-status ${proxy.status}`}><i />{proxy.status === 'online' ? 'Online' : proxy.status === 'offline' ? 'Falhou' : 'Não testada'}</span><div className="row-actions"><button className="small-button" disabled={testingId === proxy.id} onClick={() => onTest(proxy)}><RefreshCw size={14} className={testingId === proxy.id ? 'spin' : ''} /> {testingId === proxy.id ? 'Testando' : 'Testar'}</button><button className="icon-button" onClick={() => onEdit(proxy)} title="Editar"><Edit3 size={15} /></button><button className="icon-button danger" onClick={() => onDelete(proxy.id)} title="Excluir"><Trash2 size={15} /></button></div></div>)}
        {proxies.length === 0 ? <div className="empty-state"><Globe2 size={28} /><strong>Nenhuma proxy cadastrada</strong><span>Adicione a primeira conexão para começar.</span><button className="primary-button" onClick={onCreate}>Adicionar proxy</button></div> : null}
      </section>
    </main>
  );
}
