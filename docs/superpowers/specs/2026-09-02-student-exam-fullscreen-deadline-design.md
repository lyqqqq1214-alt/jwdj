# 学生在线考试界面增强 — 设计文档

日期：2026-09-02
状态：已评审（待实现）

## 背景与目标

学生在线考试界面（`StudentExam`）目前存在以下问题：

1. 考试界面渲染在 `AppShell` 的 `<main>` 内，侧边栏与顶栏仍可见，且可在未交卷时随意离开。
2. 一次只显示一道题，只能通过「上一题/下一题」切换，无法快速跳转。
3. 右上角倒计时是「考试时长」倒计时（`durationMinutes`），而非「距试卷截止时间」的倒计时。
4. 学生交卷后，在截止时间前该试卷仍出现在「待考」栏，且可再次进入。
5. 「待考」栏未显示考试起始时间。

本次改造将上述问题一并解决。

## 关键决策（已与用户确认）

| 决策点 | 结论 |
|--------|------|
| 倒计时归零（到达截止时间） | **自动交卷** |
| 未到起始时间时的「开始考试」按钮 | **置灰禁用**，并显示起始时间 |
| 「不交卷无法退出」的严格程度 | **全屏遮罩 + 浏览器返回/刷新/关闭拦截** |

## 设计

### 1. 全屏考试 + 退出锁定（前端）

- `activeExam` 非空时，渲染一个 `position: fixed; inset: 0; z-index: 10000` 的全屏遮罩层（高于侧边栏、顶栏、AI 悬浮按钮 `z-[9999]`），背景使用 `bg-background`。
- 遮罩内不再渲染任何关闭/返回按钮，唯一退出路径为「交卷」。
- 考试进行中监听 `beforeunload`（刷新/关闭/返回时弹出警告），在交卷成功或退出考试后移除监听。

实现要点：
- 在 `StudentExam` 内部新增一个 `useEffect`，依赖「正在作答」状态（`activeExam` 非空且尚未交卷，即 `submittedResult === null`）：满足时 `window.addEventListener('beforeunload', handler)`；不满足或卸载时移除。
- 全屏遮罩用一个 `<div className="fixed inset-0 z-[10000] bg-background overflow-y-auto">` 包裹考试 UI（现有答题 UI 结构迁移进来）。

### 2. 右侧题目导航（可收起）

- 遮罩右侧新增题目导航面板，按 `questionNo` 以数字网格列出所有 `questions`。
- 点击序号 → `setCurrentQuestion(index)` 跳转。
- 当前题高亮；已作答题目标记（基于 `answers`）。
- 面板可收起/展开（一个 toggle 按钮）。

### 3. 截止时间倒计时 + 自动交卷

- 倒计时初始值改为 `Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)`，并标注「距截止」。
- 归零时触发自动交卷（复用现有 `submitExam` 调用），需防止重复触发（仅在归零瞬间触发一次）。
- `endTime` 为空时（理论上已发布试卷必有 `endTime`）不启动倒计时、不自动交卷。
- 自动交卷失败时，保留「交卷」确认路径供重试，并给出错误提示。

### 4. 待考 / 已完成 状态处理

**前端待考卡片：**
- 显示 `开始：startTime`（已有时 `截止：endTime`）。
- 当 `now < startTime` 时，「开始考试」按钮置灰、不可点击。

**后端 `getPendingExams`：**
- 查询学生所有 `AssessmentRecord`，取其 `Assessment.paperId` 集合；过滤掉已交卷的试卷。
- 效果：已交卷试卷即使未到截止时间，也不再出现在待考，且无法再次开始。

**后端 `getExamForStudent`：**
- 增加「已交卷」守卫：若该学生对该试卷的 `Assessment` 已存在 `AssessmentRecord`，抛出「你已完成该考试」。
- 作为纵深防御，防止前端异常路径下重复进入。

### 5. 后端自动交卷支持

`submitExam` 当前在 `now > endTime` 时拒绝，且经 `getPaperById` → `normalizeEnded` 在截止后自动将状态置为 `ENDED`，导致截止瞬间的自动交卷请求必然被拒。

改动：
- `submitExam` 改为直接 `examPaperMapper.selectById(paperId)` 读取试卷（跳过 `normalizeEnded`）。
- 时间校验放宽为宽限期：`now.isAfter(endTime.plusMinutes(2))` 才拒绝「考试已结束」；`now.isBefore(startTime)` 仍拒绝「考试尚未开始」。
- 仍拒绝 `DRAFT` / 教师已手动关闭（`ENDED`）的试卷。
- 宽限期仅用于容忍自动交卷的网络延迟（前端在归零即提交），2 分钟内允许，超出仍拒绝。

### 6. 不在范围内

- `StudentExamLegacy`（未渲染的死代码）不处理。
- 自动交卷请求失败后的持久化/重试队列不做（见上：失败时回退到手动确认交卷路径）。

## 涉及文件

**前端：**
- `frontend/src/app/App.tsx` — `StudentExam()` 组件重构（全屏遮罩、题目导航、截止倒计时、自动交卷、待考卡片起始时间与按钮禁用）。
- `frontend/src/services/examService.ts` — 无需改动（字段已齐全：`startTime`、`endTime`）。

**后端：**
- `src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java`
  - `getPendingExams` — 排除已交卷试卷。
  - `getExamForStudent` — 增加已交卷守卫。
  - `submitExam` — 宽限期 + 跳过 `normalizeEnded`。

## 测试

- 后端单元测试（`ExamServiceImplTest`）：
  - `getPendingExams` 排除已交卷试卷、保留未交卷试卷。
  - `getExamForStudent` 对已交卷学生抛异常。
  - `submitExam` 在截止后 2 分钟宽限期内仍可提交、超出拒绝。
- 前端行为以手工验证为主（全屏遮罩、导航跳转、倒计时归零自动交卷、待考按钮禁用）。
