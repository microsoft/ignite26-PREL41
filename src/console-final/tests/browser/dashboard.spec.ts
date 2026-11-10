import { expect, test } from '@playwright/test';
import { jwt, kpi, loadData, mockService, REMOVED_COPY, signIn, SPN_TOKEN, USER_TOKEN, visibleWorkspace } from './support';

const exp = Math.floor(Date.now() / 1000) + 3600;

test('sign-in is the first screen and validates tokens before any request', async ({ page }) => {
  const seen = await mockService(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in with an access token' })).toBeVisible();
  await expect(page.locator('.devtools')).toHaveCount(0);
  const body = await page.locator('body').textContent();
  for (const phrase of REMOVED_COPY) expect(body).not.toContain(phrase);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Paste at least one access token');
  await page.getByLabel('My account access token').fill(jwt({ aud: 'https://storage.azure.com', idtyp: 'user', upn: 'old@contoso.test', exp: 1 }));
  await expect(page.locator('#token-user-info')).toContainText('expired');
  await page.getByLabel('My account access token').fill(jwt({ aud: 'https://api.fabric.microsoft.com', idtyp: 'user', upn: 'a@contoso.test', exp }));
  await expect(page.locator('#token-user-info')).toContainText('OneLake expects https://storage.azure.com');
  await page.getByLabel('My account access token').fill(USER_TOKEN);
  await expect(page.locator('#token-user-info')).toContainText('User · alex@contoso.test');
  await page.getByRole('button', { name: '+ Add a service principal token' }).click();
  await page.getByLabel('Service principal access token').fill(USER_TOKEN);
  await expect(page.locator('#token-spn-info')).toContainText('user token, not a service principal');
  expect(seen).toHaveLength(0);
});

test('user and service principal keep isolated data and the switch shows each identity', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const seen = await mockService(page);
  await page.goto('/');
  await signIn(page, { user: USER_TOKEN, spn: SPN_TOKEN });
  const userTab = page.getByRole('radio', { name: /My account/ });
  const spnTab = page.getByRole('radio', { name: /Service principal/ });
  await expect(userTab).toHaveAttribute('aria-checked', 'true');
  await expect(userTab).toContainText('alex@contoso.test');
  await expect(spnTab).toContainText('App app-recall-supplier');
  await expect(page.locator('.devtools')).not.toHaveClass(/open/);

  await loadData(page);
  const supplierLots = () => visibleWorkspace(page).locator('#supplier-lots');
  const tableAccess = () => visibleWorkspace(page).locator('#table-access');
  await expect(kpi(page, 'Current inventory')).toContainText('9 stores', { timeout: 20000 });
  await expect(supplierLots()).toContainText('5 lots');
  await expect(supplierLots()).toContainText('from 3 suppliers');
  for (const supplier of ['SUP-008', 'SUP-014', 'SUP-021']) await expect(supplierLots()).toContainText(supplier);
  await expect(tableAccess()).toContainText('5/5 tables readable');
  await expect(tableAccess()).toContainText('None blocked');
  await expect(visibleWorkspace(page).locator('.lot-card')).toContainText('Synthetic Greek yogurt 500 g');
  await expect(visibleWorkspace(page).getByRole('heading', { name: 'Cold-chain status' })).toHaveCount(0);
  expect([...new Set(seen.map(s => s.table))].sort()).toEqual(['locations', 'lots', 'products', 'store_inventory', 'supplier_certificates']);
  expect(seen.every(s => s.token === USER_TOKEN)).toBe(true);
  await page.screenshot({ path: 'test-results/user-dashboard.png', fullPage: true });

  await spnTab.click();
  await expect(spnTab).toHaveAttribute('aria-checked', 'true');
  await expect(kpi(page, 'Current inventory')).toContainText('Not loaded');
  await expect(tableAccess()).toContainText('0/5 tables readable');
  const before = seen.length;
  await loadData(page);
  expect(seen.slice(before).every(s => s.token === SPN_TOKEN)).toBe(true);
  await expect(visibleWorkspace(page).locator('.notice')).toContainText('4 tables not readable by this identity');
  await expect(supplierLots()).toContainText('2 lots', { timeout: 20000 });
  await expect(supplierLots()).toContainText('from 1 supplier');
  await expect(supplierLots()).toContainText('SUP-014');
  for (const supplier of ['SUP-008', 'SUP-021']) await expect(supplierLots()).not.toContainText(supplier);
  await expect(tableAccess()).toContainText('1/5 tables readable');
  await expect(tableAccess()).toContainText('4 blocked by OneLake');
  await expect(tableAccess().locator('li', { hasText: 'dbo.lots' })).toContainText('Readable');
  await expect(tableAccess().locator('li', { hasText: 'dbo.store_inventory' })).toContainText('BlockedHTTP 403');
  await expect(kpi(page, 'Current inventory')).toContainText('dbo.store_inventory: Access denied. HTTP 403.');
  const lotCard = visibleWorkspace(page).locator('.lot-card');
  await expect(lotCard).toContainText('SUP-014');
  await expect(lotCard).toContainText('AVD-L2');
  await expect(lotCard).toContainText('PRD-007');
  await page.screenshot({ path: 'test-results/spn-dashboard.png', fullPage: true });

  // A lot from another supplier is outside the row rule: only the service principal loses it.
  await visibleWorkspace(page).getByRole('textbox', { name: 'Lot', exact: true }).fill('SYN-0211');
  await expect(lotCard).toContainText('No matching lot in the data returned to this identity.');
  await userTab.click();
  await visibleWorkspace(page).getByRole('textbox', { name: 'Lot', exact: true }).fill('SYN-0211');
  await expect(visibleWorkspace(page).locator('.lot-card')).toContainText('SUP-021');
  await visibleWorkspace(page).getByRole('textbox', { name: 'Lot', exact: true }).fill('YG-2291');
  await expect(supplierLots()).toContainText('from 3 suppliers');
  await userTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(spnTab).toBeFocused();
  await expect(spnTab).toHaveAttribute('aria-checked', 'true');
  await expect(supplierLots()).toContainText('from 1 supplier');
  await page.keyboard.press('ArrowLeft');
  await expect(userTab).toBeFocused();
  await expect(userTab).toHaveAttribute('aria-checked', 'true');
});

test('related lots load history on demand and count the stores they reached', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const seen = await mockService(page);
  await page.goto('/');
  await signIn(page, { user: USER_TOKEN, spn: SPN_TOKEN });
  await loadData(page);
  const card = visibleWorkspace(page).locator('#related-lots');
  await expect(card).toContainText('Not loaded');
  expect(seen.some(s => s.table.endsWith('_history'))).toBe(false);
  await expect(visibleWorkspace(page).locator('#table-access')).toContainText('5/5 tables readable');

  await card.getByRole('button', { name: 'Load history' }).click();
  await expect(visibleWorkspace(page).locator('.notice')).toContainText('Load finished', { timeout: 60000 });
  await expect(card).toContainText('2 related lots', { timeout: 20000 });
  await expect(card).toContainText('YG-2291 is in the list');
  await expect(card).toContainText('Started 2026-10-11 22:00:00 Paris time');
  await expect(card).not.toContainText('YG-2250');
  await expect(card).toContainText('13 stores');
  await expect(card).toContainText('in 2 regions');
  await expect(card.locator('.bars li', { hasText: 'North' })).toContainText('8');
  await expect(card.locator('.bars li', { hasText: 'South' })).toContainText('5');
  await expect(visibleWorkspace(page).locator('#table-access')).toContainText('5/5 tables readable');
  await page.screenshot({ path: 'test-results/related-lots.png', fullPage: true });

  await page.getByRole('radio', { name: /Service principal/ }).click();
  await visibleWorkspace(page).locator('#related-lots').getByRole('button', { name: 'Load history' }).click();
  await expect(visibleWorkspace(page).locator('#related-lots')).toContainText('history.lot_history: Access denied. HTTP 403.', { timeout: 20000 });
});

test('DevTools is a collapsed bottom bar that opens with the shortcut and inspects local data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockService(page);
  await page.goto('/');
  await signIn(page, { user: USER_TOKEN });
  const devtools = page.locator('.devtools');
  const box = await devtools.boundingBox();
  expect(box!.width).toBe(1440);
  expect(Math.round(box!.y + box!.height)).toBe(1000);
  expect(box!.height).toBeLessThan(40);
  await expect(page.getByRole('tablist', { name: 'DevTools panels' })).toHaveCount(0);

  await loadData(page);
  await page.keyboard.press('Control+`');
  await expect(devtools).toHaveClass(/open/);
  expect((await devtools.boundingBox())!.height).toBeGreaterThan(200);
  await page.screenshot({ path: 'test-results/devtools-open.png' });

  await page.getByRole('tab', { name: 'Tables' }).click();
  await devtools.getByRole('button', { name: /^lots/ }).click();
  await devtools.getByRole('button', { name: 'Preview' }).click();
  await expect(devtools.getByRole('region', { name: 'Query results' })).toContainText('YG-2291');

  await page.getByRole('tab', { name: 'SQL' }).click();
  const editor = devtools.getByLabel('SQL query');
  await editor.fill("SELECT current_setting('enable_external_access') AS ext, current_setting('lock_configuration') AS locked");
  await editor.press('Control+Enter');
  await expect(devtools.getByRole('region', { name: 'Query results' })).toContainText('falsetrue');
  await editor.fill('SELECT i FROM range(205) t(i)');
  await devtools.getByRole('button', { name: '▶ Run' }).click();
  await expect(devtools.locator('.dt-pager')).toContainText('Page 1 · 100 rows');
  await devtools.getByRole('button', { name: 'Next' }).click();
  await devtools.getByRole('button', { name: 'Next' }).click();
  await expect(devtools.locator('.dt-pager')).toContainText('Page 3 · 5 rows');
  let external = false;
  await page.route('https://must-not-call.example.test/**', route => { external = true; return route.abort(); });
  await editor.fill("SELECT * FROM read_csv_auto('https://must-not-call.example.test/x')");
  await devtools.getByRole('button', { name: '▶ Run' }).click();
  await expect(devtools.getByRole('alert')).toContainText('External access and extension loading are disabled');
  expect(external).toBe(false);

  await page.getByRole('tab', { name: 'Network' }).click();
  const log = devtools.getByRole('region', { name: 'Network log' });
  await expect(log).toContainText('/read');
  await expect(log).toContainText('POST');
  await expect(log).toContainText('dbo.lots');
  const logText = await log.textContent();
  expect(logText).not.toContain(USER_TOKEN);
  expect(logText).not.toContain('part-a');

  await page.getByRole('tab', { name: 'Identity' }).click();
  await expect(devtools.locator('.dt-claims')).toContainText('alex@contoso.test');
  await expect(devtools.locator('.dt-claims')).toContainText('https://storage.azure.com');
  expect(await devtools.textContent()).not.toContain(USER_TOKEN);

  await page.keyboard.press('Control+`');
  await expect(devtools).not.toHaveClass(/open/);
});

test('rejected tokens and denied tables are explicit, and identities can be added later', async ({ page }) => {
  await mockService(page, { denyInventoryFor: USER_TOKEN });
  await page.goto('/');
  await signIn(page, { user: USER_TOKEN });
  await loadData(page);
  await expect(kpi(page, 'Current inventory')).toContainText('Unavailable or not visible');
  await expect(visibleWorkspace(page).locator('#supplier-lots')).toContainText('5 lots', { timeout: 20000 });
  await expect(visibleWorkspace(page).locator('#table-access li', { hasText: 'dbo.store_inventory' })).toContainText('BlockedHTTP 404');

  await page.getByRole('button', { name: '+ Service principal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Identities' });
  await dialog.getByLabel('Service principal access token').fill(SPN_TOKEN);
  await dialog.getByRole('region', { name: 'Service principal' }).getByRole('button', { name: 'Sign in' }).click();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('radio', { name: /Service principal/ })).toHaveAttribute('aria-checked', 'true');
});

test('a 401 marks the identity expired until its token is replaced', async ({ page }) => {
  await mockService(page, { rejectToken: USER_TOKEN });
  await page.goto('/');
  await signIn(page, { user: USER_TOKEN });
  await visibleWorkspace(page).getByRole('button', { name: 'Load data' }).click();
  await expect(visibleWorkspace(page).locator('.notice')).toContainText('token was rejected');
  await expect(page.locator('.banner.danger')).toContainText('expired or was rejected');
  await expect(page.getByRole('radio', { name: /My account/ })).toContainText('expired');
  await expect(visibleWorkspace(page).getByRole('button', { name: 'Load data' })).toBeDisabled();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in with an access token' })).toBeVisible();
  await expect(page.getByLabel('My account access token')).toHaveValue('');
});

test('narrow viewport stays usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/signin-mobile.png', fullPage: true });
  await mockService(page);
  await signIn(page, { user: USER_TOKEN });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /DevTools/ }).click();
  await page.getByRole('tab', { name: 'Tables' }).focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Identity' })).toBeFocused();
  await page.screenshot({ path: 'test-results/workspace-mobile.png', fullPage: true });
});
