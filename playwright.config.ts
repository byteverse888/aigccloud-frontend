import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 端到端测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 测试超时时间 */
  timeout: 30 * 1000,
  
  /* 期望超时时间 */
  expect: {
    timeout: 5000
  },
  
  /* 并行运行测试 */
  fullyParallel: true,
  
  /* CI环境禁止重试 */
  forbidOnly: !!process.env.CI,
  
  /* 失败重试次数 */
  retries: process.env.CI ? 2 : 0,
  
  /* 并行worker数 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 测试报告 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  /* 全局设置 */
  use: {
    /* 基础URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* 追踪失败测试 */
    trace: 'on-first-retry',
    
    /* 截图 */
    screenshot: 'only-on-failure',
    
    /* 视频 */
    video: 'on-first-retry',
  },

  /* 测试项目（浏览器） */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 本地开发时启动开发服务器 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
