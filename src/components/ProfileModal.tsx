import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BrowserProfile, ProxyConfig } from '../data/overyn';

interface ProfileModalProps {
  open: boolean;
  profile?: BrowserProfile | undefined;
  proxies: ProxyConfig[];
  onClose: () => void;
  onSave: (profile: BrowserProfile) => void;
}

export function ProfileModal({ open, profile, proxies, onClose, onSave }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [proxyId, setProxyId] = useState('');
  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? '');
    setNote(profile?.note ?? '');
    setStartUrl(profile?.startUrl ?? '');
    setProxyId(profile?.proxyId ?? '');
  }, [open, profile]);
  if (!open) return null;
  const urlValid = !startUrl.trim() || /^https?:\/\//i.test(startUrl.trim());
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><span className="eyebrow">PERFIL</span><h2>{profile ? 'Editar perfil' : 'Novo perfil'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
        <label className="field"><span>Nome do perfil</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Trabalho 01" autoFocus /></label>
        <label className="field"><span>Descrição</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Para que este perfil será usado?" /></label>
        <label className="field"><span>Página inicial</span><input value={startUrl} onChange={(event) => setStartUrl(event.target.value)} placeholder="https://exemplo.com (opcional)" /></label>
        {!urlValid ? <p className="form-error">Use um endereço começando com http:// ou https://.</p> : null}
        <label className="field"><span>Proxy do perfil</span><select value={proxyId} onChange={(event) => setProxyId(event.target.value)}><option value="">Sem proxy</option>{proxies.map((proxy) => <option key={proxy.id} value={proxy.id}>{proxy.name} · {proxy.protocol.toUpperCase()}</option>)}</select></label>
        <p className="form-hint">Cada perfil recebe um diretório de dados próprio no desktop. Cookies, cache e armazenamento permanecem separados entre perfis.</p>
        <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={name.trim().length < 2 || !urlValid} onClick={() => onSave({ id: profile?.id ?? crypto.randomUUID(), name: name.trim(), note: note.trim(), startUrl: startUrl.trim() || undefined, proxyId: proxyId || undefined, status: profile?.status ?? 'ready', createdAt: profile?.createdAt ?? 'Agora' })}>{profile ? 'Salvar alterações' : 'Criar perfil'}</button></div>
      </section>
    </div>
  );
}
