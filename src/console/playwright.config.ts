import { defineConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH = resolve('node_modules/.cache/ms-playwright');
process.env.TMPDIR = resolve('node_modules/.cache/browser-tmp');
mkdirSync(process.env.TMPDIR, { recursive: true });

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:5178', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev -- --port 5178',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
