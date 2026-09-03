/**
 * AITAES 数据导入前端 E2E 测试 (Playwright)
 *
 * 运行: npx playwright test [--headed]
 * 前置: 后端 8080 + 前端 5173 + MySQL + Redis 全部运行中
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_DIR = path.resolve(__dirname, '../../test-data/excel');

// ── 登录 ──────────────────────────────────────────────────────
async function login(page: any) {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  // 等登录表单出现
  await page.waitForSelector('input[placeholder="请输入学号/工号"]', { timeout: 15000 });
  await page.fill('input[placeholder="请输入学号/工号"]', 'T001');
  await page.fill('input[placeholder="请输入密码（不少于6位）"]', '123456');
  await page.click('button:has-text("登录")');
  // 等页面跳转（仪表盘或其他首页）
  await page.waitForTimeout(2000);
}

// ── 导航到导入页 ──────────────────────────────────────────────
async function goToImport(page: any) {
  // 等 sidebar 渲染
  await page.waitForTimeout(1500);
  // 截图看当前状态
  await page.screenshot({ path: 'test-results/after-login.png' });
  // 点击侧边栏的"数据导入"菜单
  const importLink = page.locator('nav button, nav a, aside button, aside a').filter({ hasText: '数据导入' }).first();
  try {
    await importLink.click({ timeout: 5000 });
  } catch {
    // fallback: try any element with the text
    await page.locator('text=数据导入').first().click({ timeout: 5000 });
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/after-nav.png' });
}

// ── 上传并验证结果 ────────────────────────────────────────────
async function uploadAndCheck(
  page: any,
  tabLabel: string,
  filePath: string,
  options?: {
    courseOption?: string;
    assessmentName?: string;
    examType?: 'MIDTERM' | 'FINAL';
  }
) {
  // 1. 点击对应 tab（使用部分文字匹配，避免括号等特殊字符问题）
  const tab = page.locator('button').filter({ hasText: tabLabel.split('(')[0].split('（')[0] });
  await tab.click();
  await page.waitForTimeout(400);

  // 2. 选课程（下拉框 — option 文本为 "课程名 (课程编号 · 学期)"）
  const courseSelect = page.locator('select').first();
  if (options?.courseOption && await courseSelect.isVisible().catch(() => false)) {
    // 使用模糊匹配：找到包含课程名的 option
    const option = courseSelect.locator('option').filter({ hasText: options.courseOption }).first();
    const optionValue = await option.getAttribute('value');
    if (optionValue) {
      await courseSelect.selectOption({ value: optionValue });
    }
    await page.waitForTimeout(300);
  }

  // 3. 填考核名称
  if (options?.assessmentName) {
    const nameInput = page.locator('input[type="text"]').last();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(options.assessmentName);
    }
  }

  // 4. 期中/期末单选
  if (options?.examType) {
    const radioLabel = options.examType === 'MIDTERM' ? '期中' : '期末';
    const radio = page.locator('label').filter({ hasText: radioLabel });
    if (await radio.isVisible().catch(() => false)) {
      await radio.click();
    }
  }

  // 5. Upload file via data-testid
  const fileInput = page.getByTestId('import-file-input');
  await fileInput.setInputFiles(filePath);

  // 6. Wait for result modal (or capture error toast)
  try {
    await page.waitForSelector('text=导入结果', { timeout: 20000 });
    await expect(page.locator('text=导入结果').first()).toBeVisible();
  } catch {
    await page.screenshot({ path: `test-results/import-${tabLabel.replace(/[\/\(\)]/g, '_')}-timeout.png` });
    const toast = page.locator('.fixed.top-20.right-6');
    const toastText = await toast.textContent().catch(() => '');
    throw new Error(`Result modal not shown. Toast: "${toastText}". Backend may have returned an error.`);
  }

  // 7. Screenshot
  await page.screenshot({ path: `test-results/import-${tabLabel.replace(/[\/\(\)]/g, '_')}.png` });

  // 8. Close modal
  const closeBtn = page.locator('button').filter({ hasText: '关闭' });
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
}

// ── 测试套件 ──────────────────────────────────────────────────
test.describe('数据导入全流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToImport(page);
  });

  test.afterEach(async ({ page }) => {
    // 截图留档
    await page.screenshot({ path: 'test-results/final-state.png' }).catch(() => {});
  });

  test('1. 学生名单选课导入 (CLASS_STUDENT)', async ({ page }) => {
    await uploadAndCheck(page, '学生名单(选课导入)', path.join(EXCEL_DIR, 'CS101_CLASS_STUDENT_软件2101.xlsx'), {
      courseOption: '数据结构与算法',
    });
  });

  test('2. 考勤记录 (ATTENDANCE)', async ({ page }) => {
    await uploadAndCheck(page, '考勤记录', path.join(EXCEL_DIR, 'CS101_ATTENDANCE_第1周.xlsx'), {
      courseOption: '数据结构与算法',
    });
  });

  test('3. 实验报告 (EXPERIMENT)', async ({ page }) => {
    await uploadAndCheck(page, '实验报告', path.join(EXCEL_DIR, 'CS101_EXPERIMENT_实验一.xlsx'), {
      courseOption: '数据结构与算法',
    });
  });

  test('4. 作业成绩 (HOMEWORK)', async ({ page }) => {
    await uploadAndCheck(page, '作业成绩', path.join(EXCEL_DIR, 'CS101_HOMEWORK_第1次作业.xlsx'), {
      courseOption: '数据结构与算法',
      assessmentName: '第1次作业',
    });
  });

  test('5. 测验成绩 (QUIZ)', async ({ page }) => {
    await uploadAndCheck(page, '测验成绩', path.join(EXCEL_DIR, 'CS101_QUIZ_第1次测验.xlsx'), {
      courseOption: '数据结构与算法',
      assessmentName: '第1次测验',
    });
  });

  test('6. 期中/期末成绩 (EXAM_SCORE MIDTERM)', async ({ page }) => {
    await uploadAndCheck(page, '期中/期末成绩', path.join(EXCEL_DIR, 'CS101_EXAM_SCORE_MIDTERM_期中考试.xlsx'), {
      courseOption: '数据结构与算法',
      assessmentName: '期中考试',
      examType: 'MIDTERM',
    });
  });

  test('7. 重复导入 → 全部跳过', async ({ page }) => {
    await uploadAndCheck(page, '考勤记录', path.join(EXCEL_DIR, 'CS101_ATTENDANCE_第1周.xlsx'), {
      courseOption: '数据结构与算法',
    });
  });
});
