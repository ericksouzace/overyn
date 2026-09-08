import { describe, expect, it } from 'vitest';
import { defaultSecuritySettings, initialProfiles, initialProxies } from './overyn';

describe('Overyn defaults', () => {
  it('starts without fake production data', () => {
    expect(initialProfiles).toEqual([]);
    expect(initialProxies).toEqual([]);
  });

  it('enables closed-fail network protection by default', () => {
    expect(defaultSecuritySettings.blockDirectFallback).toBe(true);
    expect(defaultSecuritySettings.verifyIpBeforeLaunch).toBe(true);
  });
});
