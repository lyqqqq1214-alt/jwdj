# 题库题目「AI 生成解析」— 设计文档

日期：2026-09-09
状态：已评审（待实现）

## 背景与目标

题库管理页（`TeacherQuestionBank`）中，题目内容以 JSON 存于 `content` 字段（结构 `{ stem, options, answer, analysis }`）。教师在「编辑题目」弹窗和「手动录题」弹窗里维护题目时，解析（`analysis`）往往需要手工撰写，成本高。

本次改造在两类弹窗的「解析」框旁新增一个「AI 生成」按钮：点击后调用后端 AI，根据当前题目内容（题型、难度、知识点、题干、选项、答案）生成解析文本，并回填到「解析」框中。生成只回填不落库，最终仍由用户点击「保存修改」/「保存题目」持久化。

## 关键决策（已与用户确认）

| 决策点 | 结论 |
|--------|------|
| 按钮出现位置 | **编辑弹窗 + 手动录题弹窗**（两处都加） |
| 实现方式 | **后端新增「生成解析」接口（方案 A）**，前端只回填文本 |
| 生成结果 | **纯文本**直接填入「解析」框，不强制 JSON 结构 |
| 失败处理 | toast 提示（如「AI 服务暂不可用」），按钮可再次点击重试 |
| 是否自动落库 | **否**，仅回填，用户手动保存 |

## 设计

### 1. 后端新增接口（Controller → Service → OllamaService）

- 新增 DTO `AnalysisGenerateRequest`（`src/main/java/com/example/aitaes/dto/`）：
  - `String questionType`（SINGLE/MULTI/FILL/SHORT/COMPREHENSIVE）
  - `String difficulty`（EASY/MEDIUM/HARD）
  - `String knowledgePoints`（逗号分隔）
  - `String stem`
  - `Map<String, String> options`（选择题选项，非选择题为空 Map）
  - `String answer`
- `QuestionBankService` 新增方法 `String generateAnalysis(AnalysisGenerateRequest request)`。
- `QuestionBankServiceImpl` 实现：拼装中文 prompt（题型/难度/知识点/题干/选项/答案），调用现有 `OllamaService.generate(prompt)` 返回解析文本，`trim()` 后返回。
- `QuestionBankController` 新增 `POST /api/question-bank/analysis/generate`，入参 `@RequestBody AnalysisGenerateRequest`，返回 `Result<String>`；沿用类上已有的 `@RequireRole({"TEACHER", "ASSISTANT"})`。
- prompt 要点：要求「资深教师」口吻，说明解题思路、为何选该答案、干扰项为何不对（选择题）；直接返回解析正文，不输出任何额外标记或代码块。

说明：`OllamaService` 名称沿用现状（实际底层由 `OllamaConfig`/`OllamaProperties` 指向本地 Ollama/qwen 模型），本次不做重命名。

### 2. 前端 service

`frontend/src/services/questionBankService.ts` 新增：

- `generateQuestionAnalysis(params)` → `api.post('/question-bank/analysis/generate', params)`，返回 `string`（经 `api.ts` 解包后的 `res.data`）。

### 3. 前端 UI（`TeacherQuestionBank.tsx`）

- 新增状态 `generatingAnalysis: boolean`（两处弹窗不会同时打开，共用一个布尔即可）。
- 「解析」label 行右侧新增一个带 `Brain` 图标的小按钮（`AI 生成`）。
- 点击处理：
  1. 校验题干与答案已填（编辑弹窗 `form.stem`/`form.answer`，录题弹窗 `manualQuestion.stem`/`manualQuestion.answer`），否则 toast 提示并中止。
  2. 用当前表单内容构造 `AnalysisGenerateRequest`：编辑弹窗用 `form`（`options` 由 `{label,text}[]` 转 `Map<String,String>`），录题弹窗用 `manualQuestion`（`optionA~D` 组装成 `Map`）。
  3. 请求期间按钮转圈并禁用，防止重复点击。
  4. 成功后把返回文本填入 `form.analysis` / `manualQuestion.analysis`。
  5. 失败 `catch` → toast（`e.message` 或默认「AI 生成解析失败，请重试」）。

### 4. 不在范围内

- 不自动保存解析到数据库（仍由用户手动保存）。
- 不为「题目列表卡片」新增快速生成入口（本轮仅弹窗）。
- 不重命名/重构 `OllamaService` 命名与 AI 提供方配置。

## 涉及文件

**后端：**
- `src/main/java/com/example/aitaes/dto/AnalysisGenerateRequest.java` — 新增 DTO。
- `src/main/java/com/example/aitaes/service/QuestionBankService.java` — 新增 `generateAnalysis` 方法签名。
- `src/main/java/com/example/aitaes/service/impl/QuestionBankServiceImpl.java` — 实现 prompt 拼装 + 调 `OllamaService.generate`（新增 `OllamaService` 依赖）。
- `src/main/java/com/example/aitaes/controller/QuestionBankController.java` — 新增 `POST /analysis/generate` 端点。

**前端：**
- `frontend/src/services/questionBankService.ts` — 新增 `generateQuestionAnalysis`。
- `frontend/src/app/pages/teacher/TeacherQuestionBank.tsx` — 两处「解析」框旁加按钮 + 生成/回填/加载态/错误处理。

## 测试

- 后端单元测试（`QuestionBankServiceImplTest`）：
  - `generateAnalysis` 正常路径：校验 prompt 含题干/答案，mock `OllamaService.generate` 返回文本，断言返回 trim 后的文本。
  - 题干/答案缺失时抛 `BusinessException`。
  - `OllamaService.generate` 抛异常时向上传播（由 `GlobalExceptionHandler` 统一转 `Result`）。
- 前端以手工验证为主：两处按钮可见、点击后 loading、成功回填、AI 不可用时 toast 且可重试、保存后 `content` 中 `analysis` 正确持久化。
