import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: "http://localhost:4174",
  },
  webServer: {
    command: "npx http-server . -p 4174 -s -c-1",
    url: "http://localhost:4174",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
})
