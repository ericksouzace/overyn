import { useEffect, useMemo, useState } from 'react';
import { OverviewPage } from './components/OverviewPage';
import { ProfileModal } from './components/ProfileModal';
import { ProfilesPage } from './components/ProfilesPage';
import { ProxiesPage } from './components/ProxiesPage';
import { ProxyModal } from './components/ProxyModal';
import { SecurityPage } from './components/SecurityPage';
import { SettingsPage } from './components/SettingsPage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { defaultSecuritySettings, initialProfiles, initialProxies, type BrowserProfile, type NavId, type ProxyConfig, type SecuritySettings } from './data/overyn';
import { loadStored, saveStored } from './lib/storage';
import { testProxyConnection } from './lib/tauri';

const PROFILE_KEY = 'overyn.profiles.v1';
const PROXY_KEY = 'overyn.proxies.v1';
const SECURITY_KEY = 'overyn.security.v1';

export default function App() {
  const [active, setActive] = useState<NavId>('overview');
  const [profiles, setProfiles] = useState<BrowserProfile[]>(() => loadStored(PROFILE_KEY, initialProfiles));
  const [proxies, setProxies] = useState<ProxyConfig[]>(() => loadStored(PROXY_KEY, initialProxies));
  const [security, setSecurity] = useState<SecuritySettings>(() => loadStored(SECURITY_KEY, defaultSecuritySettings));
  const [profileModal, setProfileModal] = useState<{ open: boolean; profile?: BrowserProfile }>({ open: false });
  const [proxyModal, setProxyModal] = useState<{ open: boolean; proxy?: ProxyConfig }>({ open: false });
  const [testingId, setTestingId] = useState<string>();
  const [toast, setToast] = useState<string>();

  useEffect(() => saveStored(PROFILE_KEY, profiles), [profiles]);
  useEffect(() => saveStored(PROXY_KEY, proxies), [proxies]);
  useEffect(() => saveStored(SECURITY_KEY, security), [security]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(undefined), 3600); return () => window.clearTimeout(timeout); }, [toast]);

  const page = useMemo(() => {
    if (active === 'overview') return <OverviewPage profiles={profiles} proxies={proxies} onCreateProfile={() => setProfileModal({ open: true })} onNavigateProfiles={() => setActive('profiles')} onNavigateProxies={() => setActive('proxies')} />;
    if (active === 'profiles') return <ProfilesPage profiles={profiles} proxies={proxies} onCreate={() => setProfileModal({ open: true })} onEdit={(profile) => setProfileModal({ open: true, profile })} onToggle={(id) => setProfiles((items) => items.map((profile) => profile.id === id ? { ...profile, status: profile.status === 'running' ? 'ready' : 'running' } : profile))} onDelete={(id) => { if (window.confirm('Excluir este perfil?')) setProfiles((items) => items.filter((profile) => profile.id !== id)); }} />;
    if (active === 'proxies') return <ProxiesPage proxies={proxies} testingId={testingId} onCreate={() => setProxyModal({ open: true })} onEdit={(proxy) => setProxyModal({ open: true, proxy })} onDelete={(id) => { if (!window.confirm('Excluir esta proxy?')) return; setProxies((items) => items.filter((proxy) => proxy.id !== id)); setProfiles((items) => items.map((profile) => profile.proxyId === id ? { ...profile, proxyId: undefined } : profile)); }} onTest={async (proxy) => { setTestingId(proxy.id); const result = await testProxyConnection(proxy); setTestingId(undefined); if (result.ok) { setProxies((items) => items.map((item) => item.id === proxy.id ? { ...item, status: 'online', lastIp: result.ip, latencyMs: result.latencyMs } : item)); setToast(`Proxy validada${result.ip ? ` · IP ${result.ip}` : ''}`); } else { setProxies((items) => items.map((item) => item.id === proxy.id ? { ...item, status: 'offline' } : item)); setToast(result.error ?? 'Não foi possível validar a proxy.'); } }} />;
    if (active === 'security') return <SecurityPage settings={security} onChange={setSecurity} />;
    return <SettingsPage profiles={profiles} proxies={proxies} security={security} onReset={() => { if (!window.confirm('Restaurar os dados de demonstração?')) return; setProfiles(initialProfiles); setProxies(initialProxies); setSecurity(defaultSecuritySettings); setToast('Dados restaurados.'); }} />;
  }, [active, profiles, proxies, security, testingId]);

  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="app-main"><Topbar /><div className="app-scroll">{page}</div></div>
      <ProfileModal open={profileModal.open} profile={profileModal.profile} proxies={proxies} onClose={() => setProfileModal({ open: false })} onSave={(profile) => { setProfiles((items) => items.some((item) => item.id === profile.id) ? items.map((item) => item.id === profile.id ? profile : item) : [profile, ...items]); setProfileModal({ open: false }); setToast('Perfil salvo.'); }} />
      <ProxyModal open={proxyModal.open} proxy={proxyModal.proxy} onClose={() => setProxyModal({ open: false })} onSave={(proxy) => { setProxies((items) => items.some((item) => item.id === proxy.id) ? items.map((item) => item.id === proxy.id ? proxy : item) : [proxy, ...items]); setProxyModal({ open: false }); setToast('Proxy salva.'); }} />
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
