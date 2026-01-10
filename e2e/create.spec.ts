/**
 * AI创作功能端到端测试
 */
import { test, expect } from '@playwright/test';

test.describe('AI创作页面', () => {
  // 这些测试需要登录状态，使用存储的认证状态
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/create');
  });

  test('创作页面正确加载', async ({ page }) => {
    await expect(page.getByText(/创作|生成/)).toBeVisible();
  });

  test('文生图功能入口存在', async ({ page }) => {
    const txt2imgTab = page.getByText(/文生图|图片生成/);
    await expect(txt2imgTab).toBeVisible();
  });

  test('文生视频功能入口存在', async ({ page }) => {
    const txt2videoTab = page.getByText(/文生视频|视频生成/);
    await expect(txt2videoTab).toBeVisible();
  });

  test('提示词输入框存在', async ({ page }) => {
    const promptInput = page.getByPlaceholder(/提示词|描述|prompt/i);
    await expect(promptInput).toBeVisible();
  });

  test('生成按钮存在', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /生成|开始|创作/i });
    await expect(generateButton).toBeVisible();
  });
});

// 未登录状态测试
test.describe('AI创作页面 - 未登录', () => {
  test('未登录用户访问创作页应提示登录', async ({ page }) => {
    await page.goto('/create');
    
    // 应该看到登录提示或被重定向
    const loginPrompt = page.getByText(/登录|请先登录/);
    const isRedirected = page.url().includes('/login');
    
    expect(await loginPrompt.isVisible() || isRedirected).toBeTruthy();
  });
});
