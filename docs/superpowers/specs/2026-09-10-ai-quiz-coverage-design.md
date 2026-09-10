# 题库「AI辅助覆盖」出题 — 设计文档

- 日期：2026-09-10
- 分支：develop
- 状态：待实现

## 1. 目标

在「题库整理判断」出现未覆盖知识点时，提供「AI辅助覆盖」按钮入口；点击后跳转到 AI 出题界面，按未覆盖的具体知识点预填（每个知识点一题、默认单选题），教师手动触发出题。同时把 AI 出题界面的「知识点范围」从硬编码 mock 数据改为课程真实知识点。

## 2. 已确认的决策

| 决策点 | 结论 |
|--------|------|
| 跳转后行为 | **预填，手动生成**（不自动调 AI），教师可调整题型/难度后手动点「生成题目」 |
| 每个知识点一题的默认题型 | **单选题** |
| 「未覆盖知识点」粒度 | **只统计 level=3 具体知识点**；课程无 level=3 时回退为全部层级 |
| 后端小修 | **做**：修复「未覆盖」判定的层级匹配 bug + 按 level=3 过滤 |
| 测试 | **本次不改测试、不跑测试**，测试以后再说 |

## 3. 现状梳理

- [TeacherAiAnalysis.tsx](frontend/src/app/pages/teacher/TeacherAiAnalysis.tsx) 的「题库整理判断」已通过 `/api/ai-analysis/question-bank-audit` 拿到 `uncoveredKps`（未覆盖知识点），但只作红色标签展示，无操作入口。
- [TeacherAIQuiz.tsx](frontend/src/app/pages/teacher/TeacherAIQuiz.tsx) 的「知识点范围」使用硬编码 mock 数据 `questionCategories`（TCP/IP 那批写死的），非真实知识点；且该页面**没有课程选择器**。
- 真实知识点来源：`/api/question-bank/knowledge-tree?courseId=` → `t_knowledge_point` 表（实体 `KnowledgePoint`：`kpName / kpCategory / parentId / level / difficulty / sortOrder`）。
- AI 出题后端 `/api/quiz/generate` 已支持 `knowledgePoints[] + questionType + count(1~20) + difficulty + socraticMode`，一次调用即可按多个知识点各出题。
- 导航与跨页传参沿用现有 `focusQuestion` 模式（App.tsx 提升状态 + 回调）。

## 4. 架构与数据流

### 4.1 跨页传参（复用 focusQuestion 模式）

在 [App.tsx](frontend/src/app/App.tsx) 新增状态：

```ts
const [aiQuizPreset, setAiQuizPreset] = useState<{
  courseId: number;
  knowledgePoints: string[];
} | null>(null);
```

- `TeacherAiAnalysis` 新增 prop `onCoverKnowledgePoints(courseId, knowledgePoints)`；点击按钮时调用，App 内 `setAiQuizPreset({ courseId, knowledgePoints })` 并 `setPage("teacher-ai-quiz")`。
- 预设题型固定为「单选」，在 `TeacherAIQuiz` 内应用（不放进 preset，避免冗余字段）。
- `TeacherAIQuiz` 新增 prop `preset` 与 `onClearPreset`。

### 4.2 数据流图

```
题库体检(TeacherAiAnalysis)
  └─ audit.uncoveredKps.length > 0
       └─ 点「AI辅助覆盖(N)」
            └─ onCoverKnowledgePoints(courseId, uncoveredKps)
                 └─ App: setAiQuizPreset(...) + setPage("teacher-ai-quiz")
                      └─ TeacherAIQuiz 接收 preset
                           ├─ 选中课程 courseId
                           ├─ getKnowledgeTree(courseId) → 真实知识点
                           ├─ 预填 topics=uncoveredKps、count=min(N,20)、types=["单选"]
                           └─ 教师手动点「生成题目」→ /api/quiz/generate → 审核入库
```

## 5. 改动清单（按文件）

### 5.1 后端 — AiAnalysisServiceImpl.java（唯一后端改动）

方法：`auditQuestionBank(Long courseId)` 中「知识点覆盖」的 `uncovered` 计算（约 393~401 行）。

现状问题：用 `kpName` 直接比对题目标签，而题库标签经迁移已是 `分类/知识点`（如 `进程管理/进程与线程`）层级格式，导致已覆盖的知识点被误判为「未覆盖」。

改动：

1. 新增私有方法 `isKpCovered(String kpName, Set<String> coveredTags)`：当 `coveredTags` 含 `kpName`，或含任意以 `/kpName` 结尾的标签（即 `分类/kpName`）时返回 true。逻辑与现有 `matchesAnyKp` 对齐。
2. 计算「出题目标知识点」集合：
   - 若课程存在 `level == 3` 的知识点，则只取这些；
   - 否则回退为全部知识点（兼容无层级/扁平课程）。
3. `uncovered` = 上述目标集合中 `!isKpCovered(name, covered)` 的去重名单。

> 说明：该改动不改 `kpCoverage`、`issues`、`suggestions` 等其它字段；不改测试（本次不跑测试）。

### 5.2 App.tsx

- 新增 `aiQuizPreset` 状态（见 4.1）。
- `TeacherAiAnalysis` 渲染处补充 `onCoverKnowledgePoints={(courseId, kps) => { setAiQuizPreset({ courseId, knowledgePoints: kps }); setPage("teacher-ai-quiz"); }}`。
- `TeacherAIQuiz` 渲染处补充 `preset={aiQuizPreset}` 与 `onClearPreset={() => setAiQuizPreset(null)}`。

### 5.3 TeacherAiAnalysis.tsx

- 组件 prop 新增 `onCoverKnowledgePoints: (courseId: number, knowledgePoints: string[]) => void`。
- 在「未覆盖知识点（N）」区块（`audit.uncoveredKps.length > 0` 时）下方新增主按钮：

  ```tsx
  <button onClick={() => onCoverKnowledgePoints(courseId!, audit.uncoveredKps)}>
    <Brain /> AI辅助覆盖（生成 {audit.uncoveredKps.length} 题）
  </button>
  ```

### 5.4 TeacherAIQuiz.tsx

1. **新增课程选择器**：复用 `getMyCourses()` 加载课程，顶部加 `<select>`；选中课程后 `getKnowledgeTree(courseId)` 拉取真实知识点。
2. **知识点范围改为真实知识点**：用真实知识点替换 `questionCategories`，按 `kpCategory` 分组、checkbox 多选；只展示 `level == 3` 的可选项，无 level-3 时回退全部。
3. **接收预设**：`useEffect` 监听 `preset`，若存在则：
   - 设置课程为 `preset.courseId`；
   - 知识点树加载完成后，`topics = preset.knowledgePoints`（与可选项取交集以保证勾选态一致）；
   - `count = min(preset.knowledgePoints.length, 20)`（后端上限 20）；
   - `types = ["单选"]`、`difficulty = "中等"`；
   - 调 `onClearPreset()` 清空，避免重复触发。
4. 移除 `aiGeneratedQuestions` / `questionCategories` 的 mock 初始数据依赖，生成的题目列表初始为空态（进入时无题目，生成后才有）。

### 5.5 服务层接口修正（顺带清理）

- [questionBankService.ts](frontend/src/services/questionBankService.ts)：`KnowledgePoint` 接口字段改为与后端实体一致：`id, courseId, kpName, kpCategory, parentId, level, difficulty, description, sortOrder`（替换当前错误的 `name / children`）。
- [aiQuizService.ts](frontend/src/services/aiQuizService.ts)：
  - `AiQuestionGenerateRequest` 改为 `{ knowledgePoints: string[]; questionType: string; count: number; difficulty: string; socraticMode: boolean }`（与后端 `AiQuestionGenerateRequest` 一致）。
  - `AiGeneratedQuestion` 改为 `{ questionType, stem, options: Record<string,string>, answer, explanation, knowledgeTags: string[], socraticQuestions: string[] }`（与后端 `AiGeneratedQuestionDTO` 一致）。

## 6. 错误处理

- 课程列表 / 知识点树加载失败：静默降级为空，展示「暂无知识点」空态，不阻断页面。
- `uncoveredKps.length > 20`：`count` 截断为 20，并在按钮/界面提示「一次最多生成 20 题」。
- 生成失败：沿用现有 toast 提示（`error.message` 或「无法连接本地大模型服务」）。

## 7. 测试

- 本次**不改测试、不跑测试**（用户明确指示，测试以后再说）。
- 后续补测点（记档，暂不执行）：后端 `isKpCovered` 层级匹配 + level=3 过滤；前端预填/跳转行为手工验证。

## 8. 已知依赖（不在本次范围）

- `t_knowledge_point` 目前无 UI 导入入口（`KNOWLEDGE_POINT` 枚举与 Excel DTO 存在，但缺对应 import strategy），数据靠 `test-data/rich_data.sql` 等 SQL 灌入。**表里有数据即本功能可用**；是否补知识点导入策略另行确认。
