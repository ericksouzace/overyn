import { useEffect, useState } from 'react';
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
import { getProfileStatus, isDesktopRuntime, launchProfile, stopProfile, testProxyConnection } from './lib/tauri';

const PROFILE_KEY = 'overyn.profiles.v1';
const PROXY_KEY = 'overyn.proxies.v1';
const SECURITY_KEY = 'overyn.security.v1';

export default function App() {
  const [active, setActive] = useState<NavId>('overview');
  const [profiles, setProfiles] = useState<BrowserProfile[]>(() => loadStored(PROFILE_KEY, initialProfiles).map((profile) => ({ ...profile, status: 'ready' })));
  const [proxies, setProxies] = useState<ProxyConfig[]>(() => loadStored(PROXY_KEY, initialProxies));
  const [security, setSecurity] = useState<SecuritySettings>(() => loadStored(SECURITY_KEY, defaultSecuritySettings));
  const [profileModal, setProfileModal] = useState<{ open: boolean; profile?: BrowserProfile }>({ open: false });
  const [proxyModal, setProxyModal] = useState<{ open: boolean; proxy?: ProxyConfig }>({ open: false });
  const [testingId, setTestingId] = useState<string>();
  const [profileActionId, setProfileActionId] = useState<string>();
  const [toast, setToast] = useState<string>();

  useEffect(() => saveStored(PROFILE_KEY, profiles.map((profile) => ({ ...profile, status: 'ready' as const }))), [profiles]);
  useEffect(() => saveStored(PROXY_KEY, proxies.map(({ password: _password, ...proxy }) => proxy)), [proxies]);
  useEffect(() => saveStored(SECURITY_KEY, security), [security]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(undefined), 4200); return () => window.clearTimeout(timeout); }, [toast]);

  useEffect(() => {
    if (!isDesktopRuntime()) return;
    const poll = async () => {
      const running = profiles.filter((profile) => profile.status === 'running');
      if (!running.length) return;
      const checks = await Promise.all(running.map(async (profile) => [profile.id, await getProfileStatus(profile.id).catch(() => false)] as const));
      const stopped = new Set(checks.filter(([, alive]) => !alive).map(([id]) => id));
      if (stopped.size) setProfiles((items) => items.map((profile) => stopped.has(profile.id) ? { ...profile, status: 'ready' } : profile));
    };
    const timer = window.setInterval(() => { void poll(); }, 4000);
    return () => window.clearInterval(timer);
  }, [profiles]);

  const handleTestProxy = async (proxy: ProxyConfig) => {
    setTestingId(proxy.id);
    try {
      const result = await testProxyConnection(proxy);
      if (result.ok) {
        setProxies((items) => items.map((item) => item.id === proxy.id ? { ...item, status: 'online', lastIp: result.ip, latencyMs: result.latencyMs } : item));
        setToast(`Proxy validada${result.ip ? ` · IP ${result.ip}` : ''}`);
      } else {
        setProxies((items) => items.map((item) => item.id === proxy.id ? { ...item, status: 'offline' } : item));
        setToast(result.error ?? 'Não foi possível validar a proxy.');
      }
    } finally { setTestingId(undefined); }
  };

  const handleProfileToggle = async (profile: BrowserProfile) => {
    if (!isDesktopRuntime()) { setToast('Abra o Overyn Desktop para iniciar uma sessão real.'); return; }
    setProfileActionId(profile.id);
    try {
      if (profile.status === 'running') {
        await stopProfile(profile.id);
        setProfiles((items) => items.map((item) => item.id === profile.id ? { ...item, status: 'ready' } : item));
        setToast('Perfil encerrado.');
        return;
      }
      const proxy = proxies.find((item) => item.id === profile.proxyId);
      const result = await launchProfile(profile, proxy, security);
      setProfiles((items) => items.map((item) => item.id === profile.id ? { ...item, status: 'running' } : item));
      if (proxy && result.proxyIp) setProxies((items) => items.map((item) => item.id === proxy.id ? { ...item, status: 'online', lastIp: result.proxyIp } : item));
      setToast(`${profile.name} aberto no ${result.browser}.${result.proxyIp ? ` IP ${result.proxyIp}.` : ''}${result.warning ? ` ${result.warning}` : ''}`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : String(error));
    } finally { setProfileActionId(undefined); }
  };

  const handleDeleteProfile = async (profile: BrowserProfile) => {
    if (!window.confirm('Excluir este perfil? Os dados do navegador permanecem no dispositivo nesta versão.')) return;
    setProfileActionId(profile.id);
    try {
      if (profile.status === 'running' && isDesktopRuntime()) await stopProfile(profile.id);
      setProfiles((items) => items.filter((item) => item.id !== profile.id));
    } finally { setProfileActionId(undefined); }
  };

  let page;
  if (active === 'overview') page = <OverviewPage profiles={profiles} proxies={proxies} onCreateProfile={() => setProfileModal({ open: true })} onNavigateProfiles={() => setActive('profiles')} onNavigateProxies={() => setActive('proxies')} />;
  else if (active === 'profiles') page = <ProfilesPage profiles={profiles} proxies={proxies} actionId={profileActionId} onCreate={() => setProfileModal({ open: true })} onEdit={(profile) => setProfileModal({ open: true, profile })} onToggle={handleProfileToggle} onDelete={handleDeleteProfile} />;
  else if (active === 'proxies') page = <ProxiesPage proxies={proxies} testingId={testingId} onCreate={() => setProxyModal({ open: true })} onEdit={(proxy) => setProxyModal({ open: true, proxy })} onDelete={(id) => { if (!window.confirm('Excluir esta proxy?')) return; setProxies((items) => items.filter((proxy) => proxy.id !== id)); setProfiles((items) => items.map((profile) => profile.proxyId === id ? { ...profile, proxyId: undefined } : profile)); }} onTest={handleTestProxy} />;
  else if (active === 'security') page = <SecurityPage settings={security} onChange={setSecurity} />;
  else page = <SettingsPage profiles={profiles} proxies={proxies} security={security} onReset={() => { if (!window.confirm('Restaurar o estado inicial?')) return; setProfiles(initialProfiles); setProxies(initialProxies); setSecurity(defaultSecuritySettings); setToast('Estado inicial restaurado.'); }} />;

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
