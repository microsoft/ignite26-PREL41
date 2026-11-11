export type Slot = 'user' | 'spn';
export const SLOTS: readonly Slot[] = ['user', 'spn'];
export const SLOT_LABEL: Record<Slot, string> = { user: 'My account', spn: 'Service principal' };
export const STORAGE_AUDIENCES = ['https://storage.azure.com', 'https://storage.azure.com/'];

export interface TokenClaims {
  kind: 'user' | 'app' | 'unknown';
  name?: string;
  upn?: string;
  appId?: string;
  objectId?: string;
  tenantId?: string;
  audience?: string;
  issuedAt?: Date;
  expiresAt?: Date;
}

export interface TokenInspection {
  token: string;
  claims: TokenClaims;
  errors: string[];
  warnings: string[];
}

function base64UrlDecode(part: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Invalid base64url segment.');
  const padded = part.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined;
const epoch = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : undefined;

/** Reads display claims without validating the signature; the service remains the authority. */
export function decodeClaims(token: string): TokenClaims | undefined {
  const parts = token.split('.');
  if (parts.length !== 3) return;
  try {
    const payload: unknown = JSON.parse(base64UrlDecode(parts[1]));
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
    const p = payload as Record<string, unknown>;
    const delegated = typeof p.scp === 'string' || typeof p.upn === 'string' || typeof p.unique_name === 'string';
    const kind = p.idtyp === 'app' ? 'app' : p.idtyp === 'user' ? 'user' : delegated ? 'user' : typeof p.appid === 'string' || typeof p.azp === 'string' ? 'app' : 'unknown';
    return {
      kind,
      name: text(p.name) ?? text(p.app_displayname),
      upn: text(p.upn) ?? text(p.unique_name) ?? text(p.preferred_username),
      appId: text(p.appid) ?? text(p.azp),
      objectId: text(p.oid),
      tenantId: text(p.tid),
      audience: Array.isArray(p.aud) ? p.aud.filter(a => typeof a === 'string').join(' ') : text(p.aud),
      issuedAt: epoch(p.iat),
      expiresAt: epoch(p.exp),
    };
  } catch { return; }
}

export function normalizeToken(raw: string): string {
  return raw.trim().replace(/^Bearer\s+/i, '').trim();
}

export function inspectToken(raw: string, slot: Slot, now = Date.now()): TokenInspection {
  const token = normalizeToken(raw);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!token) errors.push('Paste an access token.');
  else if (/\s/.test(token)) errors.push('The token contains whitespace. Paste only the token value.');
  else if (token.length > 16384) errors.push('The token is too long.');
  const claims = token && !errors.length ? decodeClaims(token) : undefined;
  if (token && !errors.length && !claims) warnings.push('Claims could not be decoded. The identity is unverified.');
  if (claims) {
    if (claims.audience && !STORAGE_AUDIENCES.includes(claims.audience))
      warnings.push(`Audience is ${claims.audience}; OneLake expects https://storage.azure.com.`);
    if (claims.expiresAt && claims.expiresAt.getTime() <= now) errors.push('This token has expired. Generate a new one.');
    if (slot === 'spn' && claims.kind === 'user') warnings.push('This is a user token, not a service principal token.');
    if (slot === 'user' && claims.kind === 'app') warnings.push('This is an application (service principal) token.');
  }
  return { token, claims: claims ?? { kind: 'unknown' }, errors, warnings };
}

export function identityName(claims: TokenClaims): string {
  return claims.upn ?? claims.name ?? (claims.appId ? `App ${claims.appId}` : 'Unverified identity');
}

/** Stable per-principal key: a different object ID means a different identity. */
export function identityKey(slot: Slot, claims: TokenClaims): string {
  return `${slot}:${claims.objectId ?? claims.appId ?? `unverified-${crypto.randomUUID()}`}`;
}

export function remaining(expiresAt: Date | undefined, now = Date.now()): string {
  if (!expiresAt) return 'expiry unknown';
  const ms = expiresAt.getTime() - now;
  if (ms <= 0) return 'expired';
  const minutes = Math.floor(ms / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min left` : `${minutes} min left`;
}
