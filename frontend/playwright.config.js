import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'),
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  webServer: [
    {
      command: 'node src/index.js',
      cwd: fileURLToPath(new URL('../backend/', import.meta.url)),
      url: 'http://127.0.0.1:3001/health',
      timeout: 45000,
      reuseExistingServer: false,
      env: { NODE_ENV: 'test', PORT: '3001', APP_ORIGIN: 'http://localhost:5173' },
    },
    {
      command: 'node node_modules/vite/bin/vite.js',
      cwd: fileURLToPath(new URL('./', import.meta.url)),
      url: 'http://localhost:5173/daftar',
      timeout: 30000,
      reuseExistingServer: false,
    },
  ],
});
