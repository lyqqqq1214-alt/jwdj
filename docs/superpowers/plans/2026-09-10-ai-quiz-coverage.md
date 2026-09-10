# 题库「AI辅助覆盖」出题 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「题库整理判断」出现未覆盖知识点时提供「AI辅助覆盖」按钮，点击跳转 AI 出题界面并按未覆盖具体知识点预填（每点一题、默认单选、手动生成），同时把 AI 出题界面的知识点范围从 mock 改为真实知识点。

**Architecture:** 复用现有 `focusQuestion` 跨页传参模式——在 App.tsx 提升 `aiQuizPreset` 状态，`TeacherAiAnalysis` 通过回调触发跳转，`TeacherAIQuiz` 通过 props 接收预设并预填。后端仅修正 `auditQuestionBank` 中 `uncovered` 的层级匹配与 level 过滤。

**Tech Stack:** Java 21 / Spring Boot 3.4.5（后端）；React 18 + Vite + TypeScript（前端）。

## Global Constraints

- **不改测试、不跑测试**（用户明确指示，测试以后再说）。验证仅用 `./mvnw compile`（后端）与 `npm run build`（前端）。
- **不自动 git 提交**：每个任务不执行 commit，是否提交由用户决定。
- 前端 `vite build` 使用 esbuild，**不做类型检查**，仅能捕获语法/import 错误；因此代码需按下方给出的完整片段写，保证类型正确。
- 复用时遵循现有命名与组件（`getMyCourses`/`ClassVO`、`Tag`、`Sparkles` 图标等）。
- 前端包管理器：以 `npm run build` 为准（若仓库用 pnpm，则等价执行 `pnpm build`）。

---

### Task 1: 后端 — 修正「未覆盖知识点」判定

**Files:**
- Modify: `src/main/java/com/example/aitaes/service/impl/AiAnalysisServiceImpl.java`（`auditQuestionBank` 内的 uncovered 计算，约 393~407 行；`matchesAnyKp` 方法后追加新私有方法）

**Interfaces:**
- Consumes: `KnowledgePoint.getKpName() / getLevel()`（entity 已存在）
- Produces: `QuestionBankAuditDTO.getUncoveredKps()` 现返回「level=3 且未被层级匹配覆盖」的具体知识点名单（无 level=3 时回退全部）

- [ ] **Step 1: 替换 uncovered 计算逻辑**

将 `auditQuestionBank` 方法中下面这段（原 393~401 行）：

```java
        List<KnowledgePoint> courseKps = knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>().eq(KnowledgePoint::getCourseId, courseId));
        Set<String> covered = kpCount.keySet();
        List<String> uncovered = courseKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(Objects::nonNull)
                .filter(name -> !covered.contains(name.trim()))
                .distinct()
                .toList();
        Set<String> courseKpNames = courseKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());
```

替换为：

```java
        List<KnowledgePoint> courseKps = knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>().eq(KnowledgePoint::getCourseId, courseId));
        Set<String> covered = kpCount.keySet();
        // 出题目标：优先只取 level=3 的具体知识点；课程无 level=3 时回退为全部
        List<KnowledgePoint> quizTargets = courseKps.stream()
                .filter(kp -> kp.getLevel() != null && kp.getLevel() == 3)
                .toList();
        if (quizTargets.isEmpty()) {
            quizTargets = courseKps;
        }
        List<String> uncovered = quizTargets.stream()
                .map(KnowledgePoint::getKpName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .filter(name -> !isKpCovered(name, covered))
                .distinct()
                .toList();
        Set<String> courseKpNames = courseKps.stream()
                .map(KnowledgePoint::getKpName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());
```

> 说明：`courseKpNames` 保持全层级，继续供 `matchesAnyKp` 做「知识点错标」检测，不随 uncovered 过滤。

- [ ] **Step 2: 追加 `isKpCovered` 私有方法**

在 `matchesAnyKp` 方法（当前 784~799 行）之后追加：

```java
    /** 判断单个知识点名是否已被题库标签覆盖（支持「分类/知识点」层级格式） */
    private boolean isKpCovered(String kpName, Set<String> coveredTags) {
        if (coveredTags.contains(kpName)) {
            return true;
        }
        for (String tag : coveredTags) {
            int idx = tag.lastIndexOf('/');
            if (idx >= 0 && tag.substring(idx + 1).trim().equals(kpName)) {
                return true;
            }
        }
        return false;
    }
```

- [ ] **Step 3: 编译验证**

Run: `./mvnw compile`
Expected: BUILD SUCCESS（仅编译主代码，不触发测试）。

---

### Task 2: 前端服务层 — 修正三个接口类型

**Files:**
- Modify: `frontend/src/services/questionBankService.ts`（`KnowledgePoint` 接口）
- Modify: `frontend/src/services/aiQuizService.ts`（`AiQuestionGenerateRequest`、`AiGeneratedQuestion` 接口）

**Interfaces:**
- Produces: `KnowledgePoint`（含 `kpName / kpCategory / level` 等），供 Task 3 使用；`AiQuestionGenerateRequest` / `AiGeneratedQuestion`，供 Task 3 的 `generateQuestions` 类型对齐。

- [ ] **Step 1: 修正 `KnowledgePoint` 接口**

在 `questionBankService.ts` 中，将：

```ts
export interface KnowledgePoint {
  id: number;
  name: string;
  parentId?: number;
  children?: KnowledgePoint[];
}
```

替换为：

```ts
export interface KnowledgePoint {
  id: number;
  courseId?: number;
  kpName: string;
  kpCategory?: string;
  parentId?: number;
  level?: number;
  difficulty?: string;
  description?: string;
  sortOrder?: number;
}
```

- [ ] **Step 2: 修正 `aiQuizService.ts` 两个接口**

在 `aiQuizService.ts` 中，将：

```ts
export interface AiQuestionGenerateRequest {
  courseId?: number;
  topic?: string;
  questionType?: string;
  difficulty?: string;
  count?: number;
}

export interface AiGeneratedQuestion {
  questionContent?: string;
  options?: string;
  answer?: string;
  questionType?: string;
  difficulty?: string;
  topic?: string;
}
```

替换为：

```ts
export interface AiQuestionGenerateRequest {
  knowledgePoints: string[];
  questionType: string;
  count: number;
  difficulty: string;
  socraticMode: boolean;
}

export interface AiGeneratedQuestion {
  questionType: string;
  stem: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
  knowledgeTags: string[];
  socraticQuestions: string[];
}
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无构建错误（类型错误不会阻断，但改动需保证字段名与后端一致）。

---

### Task 3: TeacherAIQuiz — 课程选择器 + 真实知识点 + 接收预设

**Files:**
- Modify: `frontend/src/app/pages/teacher/TeacherAIQuiz.tsx`

**Interfaces:**
- Consumes: `getKnowledgeTree`/`KnowledgePoint`（Task 2）、`getMyCourses`/`ClassVO`（已有）、`generateQuestions`（已有）
- Produces: 组件新增可选 props `preset?: { courseId: number; knowledgePoints: string[] } | null` 与 `onClearPreset?: () => void`（Task 5 会传入）

- [ ] **Step 1: 更新 import 与组件签名**

将文件顶部 import 段：

```tsx
import React, { useState } from "react";
import { CheckCircle, FileText, Upload, Zap, GripVertical, Brain, Send, Database, X } from "lucide-react";
import { generateQuestions } from "../../../services/aiQuizService";
import { Page } from "../../types";
import { Tag } from "../../utils";
import { questionCategories, aiGeneratedQuestions } from "../../constants";
```

替换为：

```tsx
import React, { useState, useEffect } from "react";
import { CheckCircle, FileText, Upload, Zap, GripVertical, Brain, Send, Database, X } from "lucide-react";
import { generateQuestions } from "../../../services/aiQuizService";
import { getKnowledgeTree, KnowledgePoint } from "../../../services/questionBankService";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import { Page } from "../../types";
import { Tag } from "../../utils";
```

将组件签名：

```tsx
function TeacherAIQuiz({ onNav }: { onNav: (p: Page) => void }) {
```

替换为：

```tsx
function TeacherAIQuiz({ onNav, preset, onClearPreset }: {
  onNav: (p: Page) => void;
  preset?: { courseId: number; knowledgePoints: string[] } | null;
  onClearPreset?: () => void;
}) {
```

- [ ] **Step 2: 新增课程/知识点状态，并清空生成列表初始值**

在 `const [params, setParams] = useState({...})` 之前新增：

```tsx
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgePoint[]>([]);
```

将生成列表状态：

```tsx
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>(aiGeneratedQuestions);
```

替换为：

```tsx
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
```

- [ ] **Step 3: 新增加载课程 / 知识点 / 预设的三个 effect**

在 `const showToastMsg = ...` 这一行之后插入：

```tsx
  // 加载课程列表；带预设时直接选中预设课程
  useEffect(() => {
    getMyCourses().then(cs => {
      setCourses(cs || []);
      if (preset) {
        setSelectedCourseId(preset.courseId);
      } else if (cs.length > 0) {
        setSelectedCourseId(cs[0].id);
      }
    }).catch(() => setCourses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 选中课程 → 加载真实知识点
  useEffect(() => {
    if (selectedCourseId == null) { setKnowledgeTree([]); return; }
    getKnowledgeTree(selectedCourseId)
      .then(kps => setKnowledgeTree(kps || []))
      .catch(() => setKnowledgeTree([]));
  }, [selectedCourseId]);

  // 接收「AI辅助覆盖」预设：预填知识点/数量/题型，手动生成
  useEffect(() => {
    if (!preset) return;
    const kps = preset.knowledgePoints || [];
    setParams(p => ({
      ...p,
      topics: kps,
      types: ["单选"],
      count: Math.min(kps.length, 20),
    }));
    onClearPreset?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  // 真实可选项：优先 level=3 具体知识点，无则回退全部；按 kpCategory 分组
  const selectableKps = knowledgeTree.filter(kp => kp.level === 3);
  const kpsToShow = selectableKps.length > 0 ? selectableKps : knowledgeTree;
  const groupedKps = kpsToShow.reduce<Record<string, KnowledgePoint[]>>((acc, kp) => {
    const cat = kp.kpCategory || "未分类";
    (acc[cat] = acc[cat] || []).push(kp);
    return acc;
  }, {});

  const toggleTopic = (name: string) => {
    setParams(p => ({
      ...p,
      topics: p.topics.includes(name) ? p.topics.filter(t => t !== name) : [...p.topics, name],
    }));
  };
```

- [ ] **Step 4: 左栏顶部加课程选择器，并把知识点范围改为真实知识点**

将左栏开头：

```tsx
      <div className="lg:col-span-1 bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium text-sm">题目生成参数</h3>
        
        <div>
          <label className="text-xs font-medium text-muted-foreground">知识点范围</label>
          <select multiple value={params.topics} onChange={e => setParams({ ...params, topics: Array.from(e.currentTarget.selectedOptions, option => option.value) })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm h-24">
            {questionCategories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
```

替换为：

```tsx
      <div className="lg:col-span-1 bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium text-sm">题目生成参数</h3>

        <div>
          <label className="text-xs font-medium text-muted-foreground">课程</label>
          <select
            value={selectedCourseId ?? ""}
            onChange={e => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          >
            <option value="">选择课程</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseName || c.className}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">知识点范围</label>
          {knowledgeTree.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">暂无知识点，请先为课程导入知识点</p>
          ) : (
            <div className="mt-2 max-h-56 overflow-y-auto border border-border rounded-md p-2 space-y-2">
              {Object.entries(groupedKps).map(([cat, kps]) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{cat}</p>
                  <div className="space-y-1">
                    {kps.map(kp => (
                      <label key={kp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={params.topics.includes(kp.kpName)} onChange={() => toggleTopic(kp.kpName)} className="rounded" />
                        {kp.kpName}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
```

- [ ] **Step 5: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无构建错误。

---

### Task 4: TeacherAiAnalysis — 加「AI辅助覆盖」按钮

**Files:**
- Modify: `frontend/src/app/pages/teacher/TeacherAiAnalysis.tsx`

**Interfaces:**
- Consumes: `audit.uncoveredKps`（已有）、`Sparkles` 图标（已 import）
- Produces: 组件新增必填 prop `onCoverKnowledgePoints: (courseId: number, knowledgePoints: string[]) => void`（Task 5 会传入）

- [ ] **Step 1: 更新组件签名**

将：

```tsx
function TeacherAiAnalysis({ onOpenQuestion }: {
  onOpenQuestion: (id: number, courseId?: number | null) => void;
}) {
```

替换为：

```tsx
function TeacherAiAnalysis({ onOpenQuestion, onCoverKnowledgePoints }: {
  onOpenQuestion: (id: number, courseId?: number | null) => void;
  onCoverKnowledgePoints: (courseId: number, knowledgePoints: string[]) => void;
}) {
```

- [ ] **Step 2: 在「未覆盖知识点」区块加按钮**

将：

```tsx
                  {audit.uncoveredKps.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">未覆盖知识点（{audit.uncoveredKps.length}）</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.uncoveredKps.map(k => <Tag key={k} color="red">{k}</Tag>)}
                      </div>
                    </div>
                  )}
```

替换为：

```tsx
                  {audit.uncoveredKps.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">未覆盖知识点（{audit.uncoveredKps.length}）</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.uncoveredKps.map(k => <Tag key={k} color="red">{k}</Tag>)}
                      </div>
                      <button
                        onClick={() => courseId != null && onCoverKnowledgePoints(courseId, audit.uncoveredKps)}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-[#7F84D6]"
                      >
                        <Sparkles size={13} />AI辅助覆盖（生成 {audit.uncoveredKps.length} 题）
                      </button>
                    </div>
                  )}
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无构建错误。

---

### Task 5: App.tsx — 串联跳转与预设

**Files:**
- Modify: `frontend/src/app/App.tsx`

**Interfaces:**
- Consumes: Task 3 的 `preset`/`onClearPreset`，Task 4 的 `onCoverKnowledgePoints`
- Produces: 完整闭环——题库体检点按钮 → 跳转 AI 出题并预填。

- [ ] **Step 1: 新增 `aiQuizPreset` 状态**

在 `const [focusQuestion, setFocusQuestion] = useState(...)` 之后新增：

```tsx
  const [aiQuizPreset, setAiQuizPreset] = useState<{ courseId: number; knowledgePoints: string[] } | null>(null);
```

- [ ] **Step 2: 给 TeacherAiAnalysis 传回调**

将：

```tsx
        {page === "teacher-ai-analysis" && <TeacherAiAnalysis onOpenQuestion={(id, courseId) => { setFocusQuestion({ id, courseId }); setPage("teacher-bank"); }} />}
```

替换为：

```tsx
        {page === "teacher-ai-analysis" && <TeacherAiAnalysis onOpenQuestion={(id, courseId) => { setFocusQuestion({ id, courseId }); setPage("teacher-bank"); }} onCoverKnowledgePoints={(courseId, kps) => { setAiQuizPreset({ courseId, knowledgePoints: kps }); setPage("teacher-ai-quiz"); }} />}
```

- [ ] **Step 3: 给 TeacherAIQuiz 传 preset 与清理回调**

将：

```tsx
        {page === "teacher-ai-quiz" && <TeacherAIQuiz onNav={setPage} />}
```

替换为：

```tsx
        {page === "teacher-ai-quiz" && <TeacherAIQuiz onNav={setPage} preset={aiQuizPreset} onClearPreset={() => setAiQuizPreset(null)} />}
```

- [ ] **Step 4: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无构建错误。

- [ ] **Step 5: 手工验证（功能闭环）**

1. 启动后端（需 MySQL）与前端 `npm run dev`。
2. 进入「AI 智能分析」→ 选课程 → 「开始题库体检」。
3. 若存在未覆盖知识点，出现红色标签 + 「AI辅助覆盖（生成 N 题）」按钮。
4. 点按钮 → 跳转「AI出题组卷」，课程已选中、知识点已勾选、题型=单选、数量=N、难度=中等。
5. 教师可调整，点「生成题目」→ 调用 `/api/quiz/generate`，逐条审核入库。

---

## Self-Review 记录

- **Spec 覆盖**：spec 第 5.1→Task 1；5.5→Task 2；5.4→Task 3；5.3→Task 4；5.2→Task 5。全部覆盖。
- **占位扫描**：无 TBD/TODO；每步含完整代码与命令。
- **类型一致性**：`preset` 形状 `{ courseId, knowledgePoints }` 在 Task 3（props）与 Task 5（App 传参）一致；`onCoverKnowledgePoints(courseId, knowledgePoints)` 在 Task 4 声明与 Task 5 调用一致。
