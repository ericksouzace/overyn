import type { BrowserProfile, ProxyConfig, SecuritySettings } from '../data/overyn';

export interface ProxyTestResult {
  ok: boolean;
  ip?: string | undefined;
  latencyMs?: number | undefined;
  error?: string | undefined;
}

export interface LaunchProfileResult {
  browser: string;
  pid: number;
  proxyIp?: string | undefined;
  warning?: string | undefined;
}

export function isDesktopRuntime(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

async function invokeDesktop<T>(command: string, args: Record<string, unknown>): Promise<T> {
  if (!isDesktopRuntime()) throw new Error('Esta ação precisa ser executada no Overyn Desktop.');
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

function proxyPayload(proxy: ProxyConfig) {
  return {
    protocol: proxy.protocol,
    host: proxy.host,
    port: proxy.port,
    username: proxy.username || null,
    password: proxy.password || null,
  };
}

export async function testProxyConnection(proxy: ProxyConfig): Promise<ProxyTestResult> {
  if (!isDesktopRuntime()) return { ok: false, error: 'Teste real disponível no aplicativo desktop. No preview web, a conexão não é enviada.' };
  return invokeDesktop<ProxyTestResult>('test_proxy_connection', { request: proxyPayload(proxy) });
}

export function launchProfile(profile: BrowserProfile, proxy: ProxyConfig | undefined, security: SecuritySettings): Promise<LaunchProfileResult> {
  return invokeDesktop<LaunchProfileResult>('launch_profile', {
    request: {
      profileId: profile.id,
      startUrl: profile.startUrl || null,
      proxy: proxy ? proxyPayload(proxy) : null,
      verifyIp: security.verifyIpBeforeLaunch,
      blockDirectFallback: security.blockDirectFallback,
    },
  });
}

export function stopProfile(profileId: string): Promise<boolean> {
  return invokeDesktop<boolean>('stop_profile', { profileId });
}

export function getProfileStatus(profileId: string): Promise<boolean> {
  return invokeDesktop<boolean>('profile_status', { profileId });
}
