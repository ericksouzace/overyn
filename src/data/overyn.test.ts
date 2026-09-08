import { describe, expect, it } from 'vitest';
import { defaultSecuritySettings, initialProfiles, initialProxies } from './overyn';

describe('Overyn defaults', () => {
  it('keeps proxy references valid in demo profiles', () => {
    const proxyIds = new Set(initialProxies.map((proxy) => proxy.id));
    const linked = initialProfiles.filter((profile) => profile.proxyId);
    expect(linked.every((profile) => proxyIds.has(profile.proxyId!))).toBe(true);
  });

  it('enables closed-fail network protection by default', () => {
    expect(defaultSecuritySettings.blockDirectFallback).toBe(true);
    expect(defaultSecuritySettings.verifyIpBeforeLaunch).toBe(true);
  });
});
