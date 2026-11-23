import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 12_000 },
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000",
    channel: process.env.TEST_BROWSER_CHANNEL,
    viewport: { width: 1365, height: 950 },
  },
});
