const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ...(process.env.CI ? [["github"]] : []),
  ],
  use: {
    baseURL: "https://www.amtrak.com",
    screenshot: "only-on-failure",
    video: "on",
    trace: "on-first-retry",
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "msedge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
