import { describe, expect, it } from 'vitest';
import { decodeClaims, identityKey, inspectToken, normalizeToken, remaining } from '../src/identity';

const b64 = (value: object) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
/** Unsigned synthetic JWT; claims are display-only and never trusted. */
export const jwt = (claims: object) => `${b64({ alg: 'none', typ: 'JWT' })}.${b64(claims)}.c2lnbmF0dXJl`;
const now = Date.UTC(2026, 10, 4, 12);
const exp = now / 1000 + 3600;
const user = { aud: 'https://storage.azure.com', idtyp: 'user', upn: 'alex@contoso.test', name: 'Alex', oid: 'oid-user', tid: 'tid', scp: 'user_impersonation', exp, iat: exp - 4000 };
const app = { aud: 'https://storage.azure.com/', idtyp: 'app', appid: 'app-id', oid: 'oid-spn', tid: 'tid', exp };

describe('token inspection', () => {
  it('decodes user and application claims without validating signatures', () => {
    expect(decodeClaims(jwt(user))).toMatchObject({ kind: 'user', upn: 'alex@contoso.test', objectId: 'oid-user', audience: 'https://storage.azure.com' });
    expect(decodeClaims(jwt(app))).toMatchObject({ kind: 'app', appId: 'app-id', objectId: 'oid-spn' });
    expect(decodeClaims(jwt({ appid: 'x', oid: 'y' }))?.kind).toBe('app');
    expect(decodeClaims(jwt({ scp: 'x' }))?.kind).toBe('user');
  });
  it('strips a Bearer prefix and rejects whitespace, expiry and empty input', () => {
    expect(normalizeToken('  Bearer abc ')).toBe('abc');
    expect(inspectToken('', 'user', now).errors).toHaveLength(1);
    expect(inspectToken('abc def', 'user', now).errors[0]).toContain('whitespace');
    expect(inspectToken(jwt({ ...user, exp: now / 1000 - 1 }), 'user', now).errors[0]).toContain('expired');
  });
  it('warns on wrong audience, slot mismatch and undecodable tokens', () => {
    expect(inspectToken(jwt({ ...user, aud: 'https://api.fabric.microsoft.com' }), 'user', now).warnings[0]).toContain('Audience');
    expect(inspectToken(jwt(user), 'spn', now).warnings).toContain('This is a user token, not a service principal token.');
    expect(inspectToken(jwt(app), 'user', now).warnings[0]).toContain('service principal');
    expect(inspectToken('opaque-token', 'user', now).warnings[0]).toContain('unverified');
    expect(inspectToken(jwt(app), 'spn', now)).toMatchObject({ errors: [], warnings: [] });
    expect(inspectToken('a.!!!.c', 'user', now).claims.kind).toBe('unknown');
  });
  it('keys identities by principal, not token', () => {
    const a = inspectToken(jwt(user), 'user', now), b = inspectToken(jwt({ ...user, iat: exp - 100 }), 'user', now);
    expect(identityKey('user', a.claims)).toBe(identityKey('user', b.claims));
    expect(identityKey('user', a.claims)).not.toBe(identityKey('spn', a.claims));
    expect(identityKey('user', a.claims)).not.toContain(a.token);
    const opaque = inspectToken('opaque', 'user', now).claims;
    expect(identityKey('user', opaque)).not.toBe(identityKey('user', opaque));
  });
  it('formats remaining lifetime', () => {
    expect(remaining(new Date(now + 90 * 60000), now)).toBe('1 h 30 min left');
    expect(remaining(new Date(now - 1), now)).toBe('expired');
    expect(remaining(undefined, now)).toBe('expiry unknown');
  });
});
