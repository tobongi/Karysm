import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Do not start the dev server automatically — it must be running separately
  webServer: {
    command: 'echo "Expecting mobile app on :8081"',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 5_000,
  },
});
