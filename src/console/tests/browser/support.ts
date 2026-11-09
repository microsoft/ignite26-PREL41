import { expect, type Page } from '@playwright/test';
import { tableFromIPC, tableToIPC } from 'apache-arrow';
import { fixtureTables } from './fixtures';

export const ENDPOINT = 'https://synthetic.example.test';
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
/** Unsigned synthetic JWTs. The app only decodes display claims; the mocked service decides access. */
export const jwt = (claims: object) => `${b64({ alg: 'none', typ: 'JWT' })}.${b64(claims)}.c3ludGhldGlj`;
const exp = Math.floor(Date.now() / 1000) + 3600;
export const USER_TOKEN = jwt({ aud: 'https://storage.azure.com', idtyp: 'user', upn: 'alex@contoso.test', name: 'Alex', oid: 'oid-user', tid: 'tid-1', scp: 'user_impersonation', exp });
export const SPN_TOKEN = jwt({ aud: 'https://storage.azure.com', idtyp: 'app', appid: 'app-recall-supplier', oid: 'oid-spn', tid: 'tid-1', exp });
export const REMOVED_COPY = ['Clarity from source', 'Every detail matters', 'A journey, not a guess', 'supporting detail', 'Evidence first', 'Developer workspace'];

export async function mockService(page: Page, options: { denyInventoryFor?: string; rejectToken?: string } = {}) {
  const full = fixtureTables('full'), restricted = fixtureTables('restricted');
  const seen: { table: string; token: string }[] = [];
  await page.route(`${ENDPOINT}/**`, async route => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
    const request = route.request();
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    const token = (request.headers().authorization ?? '').replace(/^Bearer /, '');
    const match = /\/tables\/([^/]+)\/(read|readStream\/.+)$/.exec(new URL(request.url()).pathname)!;
    const table = decodeURIComponent(match[1]);
    seen.push({ table, token });
    if (token === options.rejectToken) { await route.fulfill({ status: 401, headers, body: 'expired synthetic' }); return; }
    if (token === options.denyInventoryFor && table === 'store_inventory') { await route.fulfill({ status: 404, headers, body: 'not visible' }); return; }
    const tables = token === SPN_TOKEN ? restricted : token === USER_TOKEN ? full : undefined;
    if (!tables) { await route.fulfill({ status: 401, headers }); return; }
    // The synthetic supplier role grants the service principal dbo.lots only.
    if (token === SPN_TOKEN && table !== 'lots') { await route.fulfill({ status: 403, headers, body: 'denied synthetic' }); return; }
    if (match[2] === 'read') {
      expect(request.method()).toBe('POST');
      if (table === 'shipment_history') expect(request.postDataJSON()).toEqual({ columns: ['lot_id', 'store_id'] });
      await route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify({
        streams: table === 'lots' ? [{ id: 'part-a' }, { id: 'part-b' }] : [{ id: 'only' }] }) });
      return;
    }
    let data = tables[table];
    if (table === 'lots') {
      const all = tableFromIPC(data), half = Math.ceil(all.numRows / 2);
      data = tableToIPC(match[2].endsWith('part-a') ? all.slice(0, half) : all.slice(half), 'stream');
    }
    await route.fulfill({ headers, contentType: 'application/vnd.apache.arrow.stream', body: Buffer.from(data) });
  });
  return seen;
}

export async function signIn(page: Page, tokens: { user?: string; spn?: string }) {
  await expect(page.getByRole('heading', { name: 'Recall Console' })).toBeVisible();
  await page.getByLabel('Table API endpoint').fill(ENDPOINT);
  await page.getByLabel('Workspace ID').fill('00000000-0000-0000-0000-000000000001');
  await page.getByLabel('Lakehouse ID').fill('00000000-0000-0000-0000-000000000002');
  if (tokens.user) await page.getByLabel('My account access token').fill(tokens.user);
  if (tokens.spn) {
    await page.getByRole('button', { name: '+ Add a service principal token' }).click();
    await page.getByLabel('Service principal access token').fill(tokens.spn);
  }
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('radiogroup', { name: 'Active identity' })).toBeVisible();
}
export const visibleWorkspace = (page: Page) => page.locator('.workspace:visible');
export async function loadData(page: Page) {
  await visibleWorkspace(page).getByRole('button', { name: /Load data|Reload data/ }).click();
  await expect(visibleWorkspace(page).locator('.notice')).toContainText('Load finished', { timeout: 60000 });
}
export const kpi = (page: Page, name: string) => visibleWorkspace(page).locator('.kpi', { hasText: name });
