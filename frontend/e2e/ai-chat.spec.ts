import { test, expect } from '@playwright/test';

/**
 * AI 助手前后端链路测试
 */
test.describe('AI 助手功能测试', () => {
  
  async function login(page: any, username: string = '2024001') {
    await page.goto('/');
    await page.waitForSelector('input[placeholder="请输入学号/工号"]');
    await page.fill('input[placeholder="请输入学号/工号"]', username);
    await page.fill('input[placeholder="请输入密码（不少于6位）"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(2000);
  }

  test('验证学生端 AI 助手气泡展开及对话请求流', async ({ page }) => {
    await login(page);

    // 1. 验证气泡是否存在并点击
    const bubble = page.locator('div.fixed.right-5.bottom-5.w-14.h-14');
    await expect(bubble).toBeVisible();
    await bubble.click();

    // 2. 验证对话窗口展开
    const chatWindow = page.locator('text=AI智能助手').first();
    await expect(chatWindow).toBeVisible();

    // 3. 拦截 AI 对话请求
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/api/ai/chat') && request.method() === 'POST'
    );

    // 4. 输入消息并发送
    const input = page.locator('textarea[placeholder*="输入您的问题"]');
    await input.fill('我的学习情况怎么样？');
    await page.click('button:has(svg[class*="lucide-send"])');

    // 5. 验证请求负载
    const request = await requestPromise;
    const postData = JSON.parse(request.postData() || '{}');
    expect(postData.message).toBe('我的学习情况怎么样？');
    expect(postData.socraticMode).toBeDefined();

    // 6. 验证加载状态
    const typingIndicator = page.locator('div.animate-bounce').first();
    await expect(typingIndicator).toBeVisible();

    // 7. 验证 AI 回复出现 (超时设置长一点，因为 LLM 可能慢)
    const aiMessage = page.locator('div.bg-muted.text-foreground.rounded-bl-md').last();
    await expect(aiMessage).toBeVisible({ timeout: 30000 });
    
    const content = await aiMessage.textContent();
    console.log('AI Response:', content);
    expect(content?.length).toBeGreaterThan(0);
  });

  test('验证学生端苏格拉底模式切换', async ({ page }) => {
    await login(page);
    
    const bubble = page.locator('div.fixed.right-5.bottom-5.w-14.h-14');
    await bubble.click();

    // 验证苏格拉底模式图标存在 (Sparkles)
    const socraticBtn = page.locator('button[title*="苏格拉底"]');
    await expect(socraticBtn).toBeVisible();

    // 点击切换并验证状态 (通过 title 变化)
    const initialTitle = await socraticBtn.getAttribute('title');
    await socraticBtn.click();
    const toggledTitle = await socraticBtn.getAttribute('title');
    expect(initialTitle).not.toBe(toggledTitle);
  });
});
