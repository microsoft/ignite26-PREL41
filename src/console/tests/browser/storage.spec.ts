import { expect, test } from '@playwright/test';
import { signIn, USER_TOKEN } from './support';

test('IDs survive reload, sign-out and a new session without persisting tokens', async ({ page, browser, baseURL }) => {
  await page.goto('/');
  await page.getByLabel('Workspace ID').fill('00000000-0000-0000-0000-000000000003');
  await page.getByLabel('Lakehouse ID').fill('00000000-0000-0000-0000-000000000004');
  await page.getByLabel('My account access token').fill(USER_TOKEN);
  await page.reload();
  await expect(page.getByLabel('Workspace ID')).toHaveValue('00000000-0000-0000-0000-000000000003');
  await expect(page.getByLabel('Lakehouse ID')).toHaveValue('00000000-0000-0000-0000-000000000004');
  await expect(page.getByLabel('My account access token')).toHaveValue('');

  await signIn(page, { user: USER_TOKEN });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Workspace ID')).toHaveValue('00000000-0000-0000-0000-000000000001');
  await expect(page.getByLabel('Lakehouse ID')).toHaveValue('00000000-0000-0000-0000-000000000002');
  const storageState = await page.context().storageState();
  expect(storageState.origins[0].localStorage).toEqual([
    { name: 'recall-console.workspaceId', value: '00000000-0000-0000-0000-000000000001' },
    { name: 'recall-console.lakehouseId', value: '00000000-0000-0000-0000-000000000002' },
  ]);
  const nextSession = await browser.newContext({ baseURL, storageState });
  try {
    const nextPage = await nextSession.newPage();
    await nextPage.goto('/');
    await expect(nextPage.getByLabel('Workspace ID')).toHaveValue('00000000-0000-0000-0000-000000000001');
    await expect(nextPage.getByLabel('Lakehouse ID')).toHaveValue('00000000-0000-0000-0000-000000000002');
    await expect(nextPage.getByLabel('My account access token')).toHaveValue('');
  } finally {
    await nextSession.close();
  }
});

test('unavailable local storage warns without preventing sign-in', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage disabled', 'SecurityError'); },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('IDs cannot be remembered between sessions');
  await signIn(page, { user: USER_TOKEN });
});
