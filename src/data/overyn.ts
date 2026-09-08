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
  proxyId?: string | undefined;
  status: 'ready' | 'running';
  createdAt: string;
}

export interface SecuritySettings {
  blockDirectFallback: boolean;
  verifyIpBeforeLaunch: boolean;
  maskProxyCredentials: boolean;
}

export const initialProxies: ProxyConfig[] = [
  {
    id: 'proxy-rj-01',
    name: 'Residencial RJ 01',
    protocol: 'socks5',
    host: '127.0.0.1',
    port: 50101,
    username: '',
    password: '',
    status: 'untested',
  },
];

export const initialProfiles: BrowserProfile[] = [
  {
    id: 'profile-01',
    name: 'Perfil Principal',
    note: 'Ambiente separado para navegação',
    proxyId: 'proxy-rj-01',
    status: 'ready',
    createdAt: 'Hoje',
  },
  {
    id: 'profile-02',
    name: 'Perfil Trabalho',
    note: 'Sessão independente',
    status: 'ready',
    createdAt: 'Hoje',
  },
];

export const defaultSecuritySettings: SecuritySettings = {
  blockDirectFallback: true,
  verifyIpBeforeLaunch: true,
  maskProxyCredentials: true,
};
