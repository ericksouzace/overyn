import type { ProxyConfig } from '../data/overyn';

export interface ProxyTestResult {
  ok: boolean;
  ip?: string;
  latencyMs?: number;
  error?: string;
}

export async function testProxyConnection(proxy: ProxyConfig): Promise<ProxyTestResult> {
  if (!('__TAURI_INTERNALS__' in window)) {
    return {
      ok: false,
      error: 'Teste real disponível no aplicativo desktop. No preview web, a conexão não é enviada.',
    };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<ProxyTestResult>('test_proxy_connection', {
    request: {
      protocol: proxy.protocol,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username || null,
      password: proxy.password || null,
    },
  });
}
