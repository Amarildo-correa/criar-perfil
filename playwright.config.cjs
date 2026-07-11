// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['Galaxy Tab S4'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'webkit-tablet',
      use: { ...devices['iPad (gen 11)'] },
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 16'] },
    },
  ],
});
