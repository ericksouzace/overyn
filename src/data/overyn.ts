export type NavId = 'overview' | 'profiles' | 'proxies' | 'security' | 'settings';
export type ProxyProtocol = 'http' | 'https' | 'socks5';

export interface ProxyConfig {
  id: string;
  name: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  username?: string | undefined;
  password?: string | undefined;
  lastIp?: string | undefined;
  latencyMs?: number | undefined;
  status: 'untested' | 'online' | 'offline';
}

export interface BrowserProfile {
  id: string;
  name: string;
  note: string;
  startUrl?: string | undefined;
  proxyId?: string | undefined;
  status: 'ready' | 'running';
  createdAt: string;
}

export interface SecuritySettings {
  blockDirectFallback: boolean;
  verifyIpBeforeLaunch: boolean;
  maskProxyCredentials: boolean;
}

export const initialProxies: ProxyConfig[] = [];
export const initialProfiles: BrowserProfile[] = [];

export const defaultSecuritySettings: SecuritySettings = {
  blockDirectFallback: true,
  verifyIpBeforeLaunch: true,
  maskProxyCredentials: true,
};
