import { defineConfig, devices } from '@playwright/test';

/**
 * AITAES 前端 E2E 测试 — Playwright 配置
 *
 * 运行前：
 *   1. npm install -D @playwright/test && npx playwright install chromium
 *   2. 确保后端 (8080)、前端 (5173)、MySQL、Redis 都在运行
 *   3. npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
