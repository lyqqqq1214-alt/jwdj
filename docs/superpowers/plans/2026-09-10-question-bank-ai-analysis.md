# 题库题目「AI 生成解析」实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在题库「编辑题目」和「手动录题」两个弹窗的「解析」框旁新增「AI 生成」按钮，点击后调用后端 AI 生成解析文本并回填到框内（不自动落库）。

**Architecture:** 后端在 `QuestionBankController` 新增 `POST /api/question-bank/analysis/generate`，由 `QuestionBankService.generateAnalysis` 拼装中文 prompt 并复用现有 `OllamaService.generate(prompt)` 返回纯文本；前端新增 `generateQuestionAnalysis` service 函数，并在两处弹窗加按钮、loading 态、错误 toast。

**Tech Stack:** Java 21 / Spring Boot 3.4.5 / MyBatis Plus / JUnit 5 + Mockito；React 18 + TypeScript（Vite）；lucide-react 图标（`Brain` 已引入）。

## Global Constraints

- 后端所有接口统一返回 `Result<T>`（`com.example.aitaes.common.Result`）。
- `QuestionBankController` 类级已带 `@RequireRole({"TEACHER", "ASSISTANT"})`，新增端点自动继承，无需重复标注。
- Service 实现类使用 Lombok `@RequiredArgsConstructor`，新增依赖用 `private final` 字段即可自动注入。
- 单元测试遵循 Given-When-Then + `@DisplayName` + `@Nested` 内聚分组，`@ExtendWith(MockitoExtension.class)` + `@Mock`/`@InjectMocks`。
- 测试 ID 沿用现有递增序号（`QB-08` 起）。
- 前端 AI 调用复用 `api` 实例（`frontend/src/services/api.ts`，响应拦截器会把 `Result` 解包，业务方法返回 `res.data`）。
- 中文提示词与 UI 文案。
- 前端构建命令：`npm run build`（Vite，可捕获 import/语法错误；不含 tsc 全量类型检查）。

---

### Task 1: 后端服务 — `generateAnalysis`（TDD）

**Files:**
- Create: `src/main/java/com/example/aitaes/dto/AnalysisGenerateRequest.java`
- Modify: `src/main/java/com/example/aitaes/service/QuestionBankService.java`
- Modify: `src/main/java/com/example/aitaes/service/impl/QuestionBankServiceImpl.java`
- Test: `src/test/java/com/example/aitaes/service/impl/QuestionBankServiceImplTest.java`

**Interfaces:**
- Consumes: `com.example.aitaes.service.OllamaService#generate(String prompt)`（已存在，返回 `String`）。
- Produces: `String QuestionBankService#generateAnalysis(AnalysisGenerateRequest request)`；DTO `AnalysisGenerateRequest`（字段：`questionType/difficulty/knowledgePoints/stem/options(Map<String,String>)/answer`）。

- [ ] **Step 1: 新增 DTO 与失败测试**

创建 `src/main/java/com/example/aitaes/dto/AnalysisGenerateRequest.java`：

```java
package com.example.aitaes.dto;

import lombok.Data;

import java.util.Map;

/**
 * AI 生成题目解析请求
 */
@Data
public class AnalysisGenerateRequest {
    /** 题型：SINGLE/MULTI/FILL/SHORT/COMPREHENSIVE */
    private String questionType;
    /** 难度：EASY/MEDIUM/HARD */
    private String difficulty;
    /** 知识点（逗号分隔） */
    private String knowledgePoints;
    /** 题干 */
    private String stem;
    /** 选项（选择题；非选择题为空 Map） */
    private Map<String, String> options;
    /** 答案 */
    private String answer;
}
```

在 `QuestionBankServiceImplTest.java` 顶部新增 import：

```java
import com.example.aitaes.dto.AnalysisGenerateRequest;
import com.example.aitaes.service.OllamaService;
import java.util.Map;
```

在测试类字段区（`@InjectMocks` 之后）新增 mock：

```java
    @Mock private OllamaService ollamaService;
```

在测试类末尾（`KnowledgeTree` 嵌套类之后、类右大括号之前）新增嵌套类：

```java
    @Nested
    @DisplayName("generateAnalysis — AI 生成解析")
    class GenerateAnalysis {

        private AnalysisGenerateRequest request;

        @BeforeEach
        void setUp() {
            request = new AnalysisGenerateRequest();
            request.setQuestionType("SINGLE");
            request.setDifficulty("MEDIUM");
            request.setKnowledgePoints("网络层/路由协议");
            request.setStem("以下哪个协议工作在传输层？");
            request.setOptions(Map.of("A", "IP", "B", "TCP", "C", "ARP", "D", "ICMP"));
            request.setAnswer("B");
        }

        @Test
        @DisplayName("QB-08: 应调用 AI 并返回去除首尾空白的解析文本")
        void shouldGenerateAndTrim() {
            when(ollamaService.generate(anyString())).thenReturn("  解析内容  \n");

            String result = questionBankService.generateAnalysis(request);

            assertEquals("解析内容", result);
            verify(ollamaService).generate(anyString());
        }

        @Test
        @DisplayName("QB-09: 题干为空应抛出异常且不调用 AI")
        void shouldThrow_WhenStemBlank() {
            request.setStem("  ");

            assertThrows(BusinessException.class, () -> questionBankService.generateAnalysis(request));
            verify(ollamaService, never()).generate(anyString());
        }

        @Test
        @DisplayName("QB-10: 答案为空应抛出异常且不调用 AI")
        void shouldThrow_WhenAnswerBlank() {
            request.setAnswer(null);

            assertThrows(BusinessException.class, () -> questionBankService.generateAnalysis(request));
            verify(ollamaService, never()).generate(anyString());
        }
    }
```

- [ ] **Step 2: 运行测试确认失败**

Run: `./mvnw test -Dtest=QuestionBankServiceImplTest`
Expected: 编译失败（`generateAnalysis` 方法不存在）或 `QB-08/09/10` 报「cannot find symbol」。

- [ ] **Step 3: 实现接口方法与服务实现**

在 `QuestionBankService.java` 顶部新增 import：

```java
import com.example.aitaes.dto.AnalysisGenerateRequest;
```

在接口末尾（`getKnowledgeTree` 之后、接口右大括号之前）新增方法签名：

```java
    /**
     * 根据题目内容调用 AI 生成解析文本
     *
     * @param request 题目内容
     * @return 解析文本
     */
    String generateAnalysis(AnalysisGenerateRequest request);
```

在 `QuestionBankServiceImpl.java` 顶部新增 import：

```java
import com.example.aitaes.dto.AnalysisGenerateRequest;
import com.example.aitaes.service.OllamaService;
```

在字段区（`teacherMapper` 之后）新增依赖：

```java
    private final OllamaService ollamaService;
```

在实现类末尾（`getKnowledgeTree` 之后、类右大括号之前）新增方法与私有 helper：

```java
    @Override
    public String generateAnalysis(AnalysisGenerateRequest request) {
        if (request == null || !StringUtils.hasText(request.getStem())
                || !StringUtils.hasText(request.getAnswer())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "题干和答案不能为空");
        }
        String analysis = ollamaService.generate(buildAnalysisPrompt(request));
        return analysis == null ? "" : analysis.trim();
    }

    private String buildAnalysisPrompt(AnalysisGenerateRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一名资深教师，请为下面这道题目撰写简洁、准确的解析。\n\n");
        prompt.append("【题型】").append(StringUtils.hasText(request.getQuestionType())
                ? request.getQuestionType() : "未指定").append("\n");
        prompt.append("【难度】").append(StringUtils.hasText(request.getDifficulty())
                ? request.getDifficulty() : "未指定").append("\n");
        prompt.append("【知识点】").append(StringUtils.hasText(request.getKnowledgePoints())
                ? request.getKnowledgePoints() : "未指定").append("\n");
        prompt.append("【题干】").append(request.getStem()).append("\n");
        boolean hasOptions = request.getOptions() != null && !request.getOptions().isEmpty();
        if (hasOptions) {
            prompt.append("【选项】\n");
            request.getOptions().forEach((k, v) -> prompt.append(k).append(". ").append(v).append("\n"));
        }
        prompt.append("【答案】").append(request.getAnswer()).append("\n\n");
        prompt.append("请直接返回解析正文：说明解题思路、该答案为何正确");
        if (hasOptions) {
            prompt.append("、其他选项为何不正确");
        }
        prompt.append("。不要输出任何额外说明、标题或代码块标记。");
        return prompt.toString();
    }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `./mvnw test -Dtest=QuestionBankServiceImplTest`
Expected: BUILD SUCCESS，`QB-08/09/10` 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/main/java/com/example/aitaes/dto/AnalysisGenerateRequest.java \
        src/main/java/com/example/aitaes/service/QuestionBankService.java \
        src/main/java/com/example/aitaes/service/impl/QuestionBankServiceImpl.java \
        src/test/java/com/example/aitaes/service/impl/QuestionBankServiceImplTest.java
git commit -m "feat(question-bank): 后端 AI 生成解析服务方法"
```

---

### Task 2: 后端控制器 — 暴露接口

**Files:**
- Modify: `src/main/java/com/example/aitaes/controller/QuestionBankController.java`

**Interfaces:**
- Consumes: `String QuestionBankService#generateAnalysis(AnalysisGenerateRequest)`（Task 1 产出）。
- Produces: `POST /api/question-bank/analysis/generate`，返回 `Result<String>`。

- [ ] **Step 1: 新增端点**

在 `QuestionBankController.java` 顶部新增 import：

```java
import com.example.aitaes.dto.AnalysisGenerateRequest;
```

在 `knowledgeTree` 方法之后、类右大括号之前新增方法：

```java
    /**
     * AI 生成题目解析
     */
    @PostMapping("/analysis/generate")
    public Result<String> generateAnalysis(@RequestBody AnalysisGenerateRequest request) {
        return Result.success(questionBankService.generateAnalysis(request));
    }
```

（`Result`、`@PostMapping`、`@RequestBody` 均已 import，`questionBankService` 字段已存在。）

- [ ] **Step 2: 编译确认**

Run: `./mvnw compile`
Expected: BUILD SUCCESS。

- [ ] **Step 3: 提交**

```bash
git add src/main/java/com/example/aitaes/controller/QuestionBankController.java
git commit -m "feat(question-bank): 暴露 AI 生成解析接口"
```

---

### Task 3: 前端 — service 函数 + 两处按钮

**Files:**
- Modify: `frontend/src/services/questionBankService.ts`
- Modify: `frontend/src/app/pages/teacher/TeacherQuestionBank.tsx`

**Interfaces:**
- Consumes: `POST /api/question-bank/analysis/generate`（Task 2 产出）；`api` 实例（`frontend/src/services/api.ts`）；`Brain` 图标（已在 `TeacherQuestionBank.tsx` 顶部引入）。
- Produces: `generateQuestionAnalysis(params)` 返回 `Promise<string>`；`TeacherQuestionBank` 内 `handleGenerateAnalysis` + `generatingAnalysis` 状态。

- [ ] **Step 1: 新增 service 函数**

在 `frontend/src/services/questionBankService.ts` 末尾新增：

```ts
export interface AnalysisGenerateRequest {
  questionType?: string;
  difficulty?: string;
  knowledgePoints?: string;
  stem?: string;
  options?: Record<string, string>;
  answer?: string;
}

export async function generateQuestionAnalysis(params: AnalysisGenerateRequest) {
  const res = await api.post('/question-bank/analysis/generate', params);
  return res.data as string;
}
```

- [ ] **Step 2: 组件新增状态、依赖与处理器**

在 `TeacherQuestionBank.tsx` 第 4 行 import 处追加 `generateQuestionAnalysis`：

```ts
import { getQuestionList, getQuestionById, updateQuestion, deleteQuestion, createQuestion, updateQuestionLabels, generateQuestionAnalysis, QuestionBank } from "../../../services/questionBankService";
```

（即把 `generateQuestionAnalysis` 加进该 import 的具名导入列表。）

在状态声明区（第 33 行 `const [saving, setSaving] = useState(false);` 之后）新增：

```ts
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
```

在 `handleSave` 之后、`// 从题库体检跳转而来` 之前新增两个函数：

```tsx
  const generateAnalysisCore = async (payload: {
    questionType?: string; difficulty?: string; knowledgePoints?: string;
    stem: string; options: Record<string, string>; answer: string;
  }) => {
    setGeneratingAnalysis(true);
    try {
      return await generateQuestionAnalysis(payload);
    } catch (e) {
      showToastMsg(e instanceof Error && e.message ? e.message : "AI 生成解析失败，请重试");
      return null;
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (editing) {
      if (!form.stem.trim() || !form.answer.trim()) { showToastMsg("请先填写题干和答案"); return; }
      const options: Record<string, string> = {};
      form.options.forEach(o => { if (o.label.trim()) options[o.label.trim()] = o.text; });
      const analysis = await generateAnalysisCore({
        questionType: form.questionType, difficulty: form.difficulty,
        knowledgePoints: form.knowledgePoints, stem: form.stem, options, answer: form.answer,
      });
      if (analysis != null) setForm(f => ({ ...f, analysis }));
    } else if (showManualQuestionModal) {
      if (!manualQuestion.stem.trim() || !manualQuestion.answer.trim()) { showToastMsg("请先填写题干和答案"); return; }
      const options: Record<string, string> = {};
      if (["SINGLE", "MULTI"].includes(manualQuestion.questionType)) {
        (["A", "B", "C", "D"] as const).forEach(l => {
          const v = manualQuestion[`option${l}`].trim();
          if (v) options[l] = v;
        });
      }
      const analysis = await generateAnalysisCore({
        questionType: manualQuestion.questionType, difficulty: manualQuestion.difficulty,
        knowledgePoints: manualQuestion.knowledgePoints, stem: manualQuestion.stem, options, answer: manualQuestion.answer,
      });
      if (analysis != null) setManualQuestion(p => ({ ...p, analysis }));
    }
  };
```

- [ ] **Step 3: 编辑弹窗「解析」框旁加按钮**

将第 651-655 行的「解析」块（编辑弹窗内）：

```tsx
              <div>
                <label className="block text-xs text-muted-foreground mb-1">解析</label>
                <textarea value={form.analysis} onChange={e => setForm(f => ({ ...f, analysis: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y" />
              </div>
```

替换为：

```tsx
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">解析</label>
                  <button onClick={handleGenerateAnalysis} disabled={generatingAnalysis}
                    className="flex items-center gap-1 text-xs text-primary hover:text-[#7F84D6] disabled:opacity-50">
                    {generatingAnalysis ? <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Brain size={13} />}
                    {generatingAnalysis ? "生成中…" : "AI 生成"}
                  </button>
                </div>
                <textarea value={form.analysis} onChange={e => setForm(f => ({ ...f, analysis: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y" />
              </div>
```

- [ ] **Step 4: 手动录题弹窗「解析」框旁加按钮**

将第 680 行（手动录题弹窗内）的单行 textarea：

```tsx
              <textarea value={manualQuestion.analysis} onChange={e => setManualQuestion(p => ({ ...p, analysis: e.target.value }))} rows={3} placeholder="答案解析（可选）" className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none" />
```

替换为：

```tsx
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">解析</label>
                  <button onClick={handleGenerateAnalysis} disabled={generatingAnalysis}
                    className="flex items-center gap-1 text-xs text-primary hover:text-[#7F84D6] disabled:opacity-50">
                    {generatingAnalysis ? <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Brain size={13} />}
                    {generatingAnalysis ? "生成中…" : "AI 生成"}
                  </button>
                </div>
                <textarea value={manualQuestion.analysis} onChange={e => setManualQuestion(p => ({ ...p, analysis: e.target.value }))} rows={3} placeholder="答案解析（可选）" className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none" />
              </div>
```

- [ ] **Step 5: 前端构建确认**

Run: `cd frontend && npm run build`
Expected: 构建成功（无 import/语法错误）。

- [ ] **Step 6: 手工验证**

启动后端（`./mvnw spring-boot:run`，需本地 Ollama 运行）与前端（`cd frontend && npm run dev`），在浏览器验证：
- 两个弹窗「解析」旁均出现「AI 生成」按钮。
- 未填题干/答案时点击 → toast 提示「请先填写题干和答案」。
- 填写后点击 → 按钮转圈「生成中…」并禁用；成功后解析文本回填。
- 关闭 Ollama 后点击 → toast 提示错误，按钮可再次点击重试。
- 点击「保存修改」/「保存题目」后，题目 `content` 中 `analysis` 正确持久化。

- [ ] **Step 7: 提交**

```bash
git add frontend/src/services/questionBankService.ts \
        frontend/src/app/pages/teacher/TeacherQuestionBank.tsx
git commit -m "feat(question-bank): 题库弹窗 AI 生成解析按钮"
```
