import { defineConfig, devices } from '@playwright/test'

// The pixel baselines are exact, and Chromium rasterizes differently on other
// platforms, so the suite only runs inside e2e/run.sh's linux/arm64 container.
if (process.env.E2E_CONTAINER !== '1') {
  throw new Error('Run the suite through `npm run test:e2e`, which uses the pinned container.')
}

const contactEnv = {
  RESEND_API_KEY: 're_test',
  CONTACT_TO: 'test@example.com',
  CONTACT_FROM: 'site@example.com',
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  retries: 0,
  workers: process.env.CI ? '100%' : undefined,
  forbidOnly: true,
  // A missing baseline fails without being written: new screenshots are approved
  // only through `--update-snapshots`, never by a rerun.
  updateSnapshots: 'none',
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: { maxDiffPixels: 0, threshold: 0, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: 'http://127.0.0.1:8080',
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: 'node e2e/fake-resend.mjs',
      url: 'http://127.0.0.1:8099/__health',
      reuseExistingServer: false,
    },
    {
      command: 'node server/index.js',
      url: 'http://127.0.0.1:8080/health',
      env: { PORT: '8080', ACCESS_LOG: 'false', ...contactEnv, RESEND_BASE_URL: 'http://127.0.0.1:8099' },
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'node server/index.js',
      url: 'http://127.0.0.1:8081/health',
      env: { PORT: '8081', ACCESS_LOG: 'false' },
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
