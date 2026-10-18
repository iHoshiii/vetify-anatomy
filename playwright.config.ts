import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:5176', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5176', reuseExistingServer: !process.env.CI, timeout: 60000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'narrow', use: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true } },
  ],
})
