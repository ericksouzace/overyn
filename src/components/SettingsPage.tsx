import { Download, RotateCcw } from 'lucide-react';
import type { BrowserProfile, ProxyConfig, SecuritySettings } from '../data/overyn';

interface SettingsPageProps {
  profiles: BrowserProfile[];
  proxies: ProxyConfig[];
  security: SecuritySettings;
  onReset: () => void;
}

export function SettingsPage({ profiles, proxies, security, onReset }: SettingsPageProps) {
  const exportData = () => {
    const safeProxies = proxies.map((proxy) => ({ ...proxy, password: undefined }));
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), profiles, proxies: safeProxies, security }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href; anchor.download = 'overyn-config.json'; anchor.click(); URL.revokeObjectURL(href);
  };
  return (
    <main className="page">
      <section className="page-heading"><div><span className="eyebrow">CONFIGURAÇÕES</span><h1>Preferências do Overyn</h1><p>Gerencie os dados locais desta instalação.</p></div></section>
      <section className="settings-card"><div><span className="eyebrow">BACKUP</span><h2>Exportar configuração</h2><p>Gera um JSON com perfis, proxies sem senha e preferências de segurança.</p></div><button className="secondary-button" onClick={exportData}><Download size={16} /> Exportar JSON</button></section>
      <section className="settings-card danger-zone"><div><span className="eyebrow">DADOS LOCAIS</span><h2>Restaurar estado inicial</h2><p>Remove os perfis e proxies locais e restaura as preferências recomendadas.</p></div><button className="danger-outline-button" onClick={onReset}><RotateCcw size={16} /> Restaurar</button></section>
      <section className="about-card"><div className="about-logo">O</div><div><strong>Overyn Desktop</strong><span>Versão 0.4.0 · Windows</span></div><span className="version-chip">BETA</span></section>
    </main>
  );
}
