import { CheckCircle2, LockKeyhole, Network, ShieldCheck } from 'lucide-react';
import type { SecuritySettings } from '../data/overyn';

interface SecurityPageProps {
  settings: SecuritySettings;
  onChange: (settings: SecuritySettings) => void;
}

function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return <button className={`toggle ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} onClick={onClick}><span /></button>;
}

export function SecurityPage({ settings, onChange }: SecurityPageProps) {
  return (
    <main className="page">
      <section className="page-heading"><div><span className="eyebrow">SEGURANÇA</span><h1>Proteção de sessão e rede</h1><p>Controles para reduzir vazamentos acidentais e manter as configurações de cada perfil previsíveis.</p></div></section>
      <section className="security-hero"><div className="security-orb"><ShieldCheck size={32} /></div><div><span className="eyebrow">ESTADO ATUAL</span><h2>Proteção recomendada ativa</h2><p>O Overyn está configurado para não usar a conexão direta quando uma proxy obrigatória falhar.</p></div><span className="healthy-badge"><CheckCircle2 size={15} /> Protegido</span></section>
      <section className="settings-list">
        <div className="setting-row"><div className="setting-icon"><Network size={19} /></div><div><strong>Bloquear fallback para IP direto</strong><span>Se a conexão configurada falhar, o perfil não deve continuar pela rede padrão.</span></div><Toggle checked={settings.blockDirectFallback} onClick={() => onChange({ ...settings, blockDirectFallback: !settings.blockDirectFallback })} /></div>
        <div className="setting-row"><div className="setting-icon"><ShieldCheck size={19} /></div><div><strong>Verificar IP antes de preparar perfil</strong><span>Exige teste de conectividade antes da sessão ser marcada como pronta.</span></div><Toggle checked={settings.verifyIpBeforeLaunch} onClick={() => onChange({ ...settings, verifyIpBeforeLaunch: !settings.verifyIpBeforeLaunch })} /></div>
        <div className="setting-row"><div className="setting-icon"><LockKeyhole size={19} /></div><div><strong>Ocultar credenciais de proxy na interface</strong><span>Mantém senhas fora de tabelas e visualizações rápidas.</span></div><Toggle checked={settings.maskProxyCredentials} onClick={() => onChange({ ...settings, maskProxyCredentials: !settings.maskProxyCredentials })} /></div>
      </section>
      <div className="info-banner"><ShieldCheck size={18} /><div><strong>Escopo de privacidade</strong><span>Estes controles protegem sessões e conexões do próprio aplicativo. Eles não prometem invisibilidade nem contornam políticas de serviços externos.</span></div></div>
    </main>
  );
}
