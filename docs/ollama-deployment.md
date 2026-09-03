# Ollama 本地大模型部署与验收记录

## 部署信息

- Ollama：0.30.8（Windows 免安装 CLI）
- 模型：`qwen2.5:7b`
- 模型规格：Qwen2 7.6B，GGUF，Q4_K_M，约 4.68 GB
- 服务地址：`http://127.0.0.1:11434`
- 本地运行目录：`D:\jwdj\.ollama-runtime`（已加入 `.gitignore`）

启动命令：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-ollama.ps1
```

## 真实推理验收（2026-07-14）

使用中等难度 TCP 单项选择题 Prompt，要求输出题干、选项、答案、解析、知识点标签及苏格拉底追问。Ollama 自动选择 GPU，`ollama ps` 显示 `100% GPU`。

- 首轮端到端耗时：20.318 秒
- 模型加载耗时：11.840 秒
- Prompt：74 tokens，0.735 秒，100.65 tokens/s
- GPU 输出：336 tokens，7.618 秒，44.11 tokens/s
- JSON 语法校验：通过

首轮测试发现仅指定 `format=json` 时模型可能忽略顶层数组要求，因此项目封装已改用 Ollama JSON Schema 强制 `questions` 数组结构，并保留对历史单对象/数组输出的兼容解析。

JSON Schema 修正后的双题热模型测试：

- 端到端耗时：15.052 秒
- 模型加载耗时：0.209 秒
- GPU 输出：481 tokens，11.331 秒，42.45 tokens/s
- 数量、必填字段和 JSON Schema 校验：全部通过

该轮发现模型可能把 Prompt 中的“JSON”误当考点，因此 Prompt 又增加了目标知识点强约束，并明确禁止把 JSON、Markdown或输出格式作为题目主题。

### 纯 CPU 基准

请求参数通过 `options.num_gpu=0` 强制禁用 GPU，运行期间 `ollama ps` 确认 `PROCESSOR=100% CPU`：

- 端到端耗时：14.514 秒
- CPU 模型加载耗时：10.734 秒
- Prompt：46 tokens，1.188 秒
- CPU 输出：22 tokens，2.453 秒，8.97 tokens/s
- JSON 语法校验：通过

因此本机 Qwen2.5 7B Q4_K_M 的实测生成速度约为：纯 CPU `8.97 tokens/s`，GPU 热模型约 `42-44 tokens/s`。短输出的端到端时间受模型首次加载影响较大。

## 自动化验证

常规离线单元测试：

```powershell
.\mvnw.cmd -Dtest=OllamaServiceImplTest test
```

Ollama 服务运行时，可执行真实集成测试：

```powershell
$env:OLLAMA_LIVE_TEST="true"
.\mvnw.cmd -Dtest=OllamaLiveIntegrationTest test
```
