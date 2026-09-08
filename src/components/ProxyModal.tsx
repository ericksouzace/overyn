import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProxyConfig, ProxyProtocol } from '../data/overyn';

interface ProxyModalProps {
  open: boolean;
  proxy?: ProxyConfig;
  onClose: () => void;
  onSave: (proxy: ProxyConfig) => void;
}

export function ProxyModal({ open, proxy, onClose, onSave }: ProxyModalProps) {
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<ProxyProtocol>('socks5');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => { if (!open) return; setName(proxy?.name ?? ''); setProtocol(proxy?.protocol ?? 'socks5'); setHost(proxy?.host ?? ''); setPort(proxy ? String(proxy.port) : ''); setUsername(proxy?.username ?? ''); setPassword(proxy?.password ?? ''); }, [open, proxy]);
  if (!open) return null;
  const numericPort = Number(port);
  const valid = name.trim().length > 1 && host.trim().length > 2 && Number.isInteger(numericPort) && numericPort > 0 && numericPort <= 65535;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card wide" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><span className="eyebrow">REDE</span><h2>{proxy ? 'Editar proxy' : 'Adicionar proxy'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
        <label className="field"><span>Nome</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Residencial RJ 01" autoFocus /></label>
        <div className="protocol-tabs" aria-label="Protocolo">{(['http', 'https', 'socks5'] as ProxyProtocol[]).map((item) => <button key={item} className={protocol === item ? 'active' : ''} onClick={() => setProtocol(item)}>{item.toUpperCase()}</button>)}</div>
        <div className="form-grid"><label className="field"><span>Host / IP</span><input value={host} onChange={(event) => setHost(event.target.value)} placeholder="185.123.45.67" /></label><label className="field"><span>Porta</span><input inputMode="numeric" value={port} onChange={(event) => setPort(event.target.value.replace(/\D/g, ''))} placeholder="50101" /></label><label className="field"><span>Usuário</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Opcional" autoComplete="off" /></label><label className="field"><span>Senha</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Opcional" autoComplete="new-password" /></label></div>
        <p className="form-hint">As credenciais ficam no dispositivo. O teste de IP usa o backend desktop e não faz fallback para conexão direta.</p>
        <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!valid} onClick={() => onSave({ id: proxy?.id ?? crypto.randomUUID(), name: name.trim(), protocol, host: host.trim(), port: numericPort, username: username.trim() || undefined, password: password || undefined, status: proxy?.status ?? 'untested', lastIp: proxy?.lastIp, latencyMs: proxy?.latencyMs })}>{proxy ? 'Salvar alterações' : 'Adicionar proxy'}</button></div>
      </section>
    </div>
  );
}
