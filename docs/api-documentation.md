# AITAES API 接口文档

> **项目**：基于AI的数智化教学分析评价系统  
> **Base URL**：`http://localhost:8080`  
> **版本**：v3.0 | 最后更新：2026-07-10

---

## 目录

- [一、通用规范](#一通用规范)
- [二、数据采集模块](#二数据采集模块)
- [三、数据源管理](#三数据源管理)
- [四、评价计算引擎](#四评价计算引擎)
- [五、报告管理](#五报告管理)
- [六、仪表盘](#六仪表盘)
- [七、Excel 导出](#七excel-导出)
- [八、全局异常处理](#八全局异常处理)
- [附录 A：接口速查表](#附录-a接口速查表)
- [附录 B：枚举值一览](#附录-b枚举值一览)

---

## 一、通用规范

### 1.1 统一响应格式

所有接口返回统一 JSON 结构，由 `Result<T>` 包装：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | `int` | 业务状态码，与 HTTP 状态码保持一致 |
| `message` | `string` | 人类可读的提示信息 |
| `data` | `object` / `null` / `array` | 响应负载，无数据时为 `null` |

### 1.2 状态码定义

| code | 枚举常量 | 含义 |
|------|----------|------|
| `200` | `SUCCESS` | 操作成功 |
| `206` | `IMPORT_PARTIAL` | 部分成功（导入含失败行） |
| `400` | `BAD_REQUEST` | 请求参数错误 |
| `401` | `UNAUTHORIZED` | 未授权（预留） |
| `403` | `FORBIDDEN` | 无访问权限（预留） |
| `404` | `NOT_FOUND` | 资源不存在 |
| `500` | `INTERNAL_ERROR` | 服务器内部错误 |

> 所有异常由 `GlobalExceptionHandler` 统一拦截，保证前端始终收到上述 JSON 结构，不会出现 HTML 错误页或裸堆栈。

### 1.3 学期格式

统一使用 `YYYY-YYYY-N` 格式：

- `2025-2026-1` — 2025-2026 学年第一学期
- `2025-2026-2` — 2025-2026 学年第二学期

### 1.4 分页规范

分页接口统一使用 MyBatis-Plus `IPage` 分页对象，响应 `data` 结构如下：

```json
{
  "records": [ ... ],
  "total": 100,
  "size": 10,
  "current": 1,
  "pages": 10
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `records` | `array` | 当前页数据列表 |
| `total` | `long` | 总记录数 |
| `size` | `long` | 每页条数 |
| `current` | `long` | 当前页码 |
| `pages` | `long` | 总页数 |

---

## 二、数据采集模块

### 2.1 上传文件导入数据

```
POST /api/import/upload
Content-Type: multipart/form-data
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | `File` | ✅ | 上传文件，支持 `.xlsx` / `.xls` / `.csv` |
| `importType` | `String` | ✅ | 导入类型，见下方枚举 |
| `courseId` | `Long` | ❌* | 归属课程 ID（成绩/考勤/实验/选课名单导入必填，优先于文件名解析） |
| `assessmentName` | `String` | ❌* | 考核名称（`HOMEWORK`/`QUIZ`/`EXAM_SCORE` 必填，如"第1次作业"） |
| `assessmentType` | `String` | ❌* | 考核类型，仅 `EXAM_SCORE`：`MIDTERM`（期中）/ `FINAL`（期末） |
| `sourceId` | `Long` | ❌ | 关联的数据源 ID，用于追踪数据来源 |

> *标注 ❌\* 的参数：前端页面必传；直接调 API 时可省略并回退到文件名约定解析（见下）。

**importType 枚举**

| 值 | 导入目标表 | 唯一键 |
|----|-----------|--------|
| `TEACHER` | 教师表 | 工号 |
| `STUDENT` | 学生表 | 学号 |
| `COURSE` | 课程表 | 课程编号 |
| `SCORE` | 评价分数表（遗留） | 课程编号 + 学号 + 指标编号 |
| `INDICATOR` | 评价指标表（遗留） | 指标编号 |
| `CLASS_STUDENT` | 学生表 + 选课关联表 | 学号 + 课程编号 |
| `HOMEWORK` | 考核表 + 成绩记录 + 扣分明细 | 考核名称 + 学号 |
| `QUIZ` | 考核表 + 成绩记录 + 扣分明细 | 考核名称 + 学号 |
| `ATTENDANCE` | 考勤记录表 | 课程编号 + 学号 + 日期 |
| `EXPERIMENT` | 实验报告表 | — |
| `EXAM_SCORE` | 考核表 + 成绩记录 + 扣分明细（期中/期末） | 考核名称 + 学号 |
| `KNOWLEDGE_POINT` | 知识点库表 | 课程编号 + 知识点名称 |

**课程归属**：成绩/考勤/实验/选课名单导入优先使用 `courseId` 参数；未传时回退文件名约定 `{课程编号}_{类型}_{描述}.xlsx`（如 `CS-NET-001_HOMEWORK_第1次作业.xlsx`）自动解析课程。两者均无法确定课程时返回 `status=FAILED`。完整表格格式规范见 [import-templates.md](import-templates.md)。

**Excel 列模板**

| importType | 表头列（第一行必须与中文完全匹配） |
|------------|----------------------------------|
| `TEACHER` | 工号、姓名、性别、学院、系/部门、职称、邮箱、联系电话 |
| `STUDENT` | 学号、姓名、性别、学院、专业、班级、年级、邮箱 |
| `COURSE` | 课程编号、课程名称、授课教师工号、学分、课程类型、学期、课程描述 |
| `SCORE` | 课程编号、学号、指标编号、评分、评价意见、学期、评价时间 |
| `INDICATOR` | 指标编号、指标名称、指标类别、权重、父级指标编号、指标层级、指标说明、排序号 |
| `CLASS_STUDENT` | 学号、姓名、性别、学院、专业、班级、年级、邮箱 |
| `HOMEWORK` | 序号、学号、姓名、第1题得分、扣分知识点、…(动态题目列)、总成绩、最薄弱知识点 |
| `QUIZ` | 同 `HOMEWORK`（序号、学号、姓名、第1题得分、扣分知识点、…、总成绩、最薄弱知识点） |
| `ATTENDANCE` | 学号、姓名、日期、状态、第几周、节次、备注 |
| `EXPERIMENT` | 学号、姓名、实验名称、实验次数、分数、提交时间、备注 |
| `EXAM_SCORE` | 同 `HOMEWORK`（序号、学号、姓名、第1题得分、扣分知识点、…、总成绩、最薄弱知识点） |

**响应 — 全部成功** `200`

```json
{
  "code": 200,
  "message": "导入成功: 成功100行, 跳过0行",
  "data": {
    "totalRows": 100,
    "successRows": 100,
    "failRows": 0,
    "skippedRows": 0,
    "status": "SUCCESS",
    "errors": [],
    "warnings": []
  }
}
```

**响应 — 部分成功** `200`（code=200，结果由 `data.status` 表达）

```json
{
  "code": 200,
  "message": "部分导入成功: 成功80行, 失败15行, 跳过5行",
  "data": {
    "totalRows": 100,
    "successRows": 80,
    "failRows": 15,
    "skippedRows": 5,
    "status": "PARTIAL",
    "errors": [
      "第15行: 学生不存在: S2024099（请先导入学生名单）",
      "第16行: 第2列数据格式错误 - 无法转换为数字"
    ],
    "warnings": [
      "第3行: 学号已存在，跳过: S2024001"
    ]
  }
}
```

**响应 — 全部失败** `200`（code=200，`data.status=FAILED`）

```json
{
  "code": 200,
  "message": "导入失败",
  "data": {
    "totalRows": 0,
    "successRows": 0,
    "failRows": 0,
    "skippedRows": 0,
    "status": "FAILED",
    "errors": ["无法确定归属课程：请在页面选择课程后重新上传（或将文件命名为 {课程编号}_类型_名称.xlsx）"],
    "warnings": []
  }
}
```

> 注意：无论导入结果如何，HTTP 状态与业务码均为 200，导入结果通过 `data.status` / `failRows` / `errors` 判断（v3.1 起不再使用 206/500 业务码，避免前端拦截器丢失错误明细）。

**ImportResultDTO 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalRows` | `int` | 数据总行数（成功 + 失败 + 跳过） |
| `successRows` | `int` | 成功导入行数（与数据库实际写入一致） |
| `failRows` | `int` | 失败行数 |
| `skippedRows` | `int` | 跳过行数（重复数据等非致命情况） |
| `status` | `String` | `SUCCESS` / `PARTIAL` / `FAILED`（0 数据行视为 `FAILED`） |
| `errors` | `List<String>` | 错误详情（含 Excel 行号），最多返回前 100 条 |
| `warnings` | `List<String>` | 警告详情（跳过原因），最多返回前 100 条 |

**业务规则**

- 每 500 行一个批次，批次独立提交，某批失败不影响其他批次
- 行级诚实计数：课程/学生不存在、格式错误、插入失败均计入 `failRows` 并返回原因
- 基于唯一键自动去重：重复行跳过并计入 `skippedRows` 与 `warnings`（不计入成功）
- `errors` / `warnings` 各最多返回 100 条，超出部分截断
- 导入结束后自动写入 `t_data_import_log` 日志表（含失败结果）

---

## 三、数据源管理

### 3.1 分页查询数据源

```
GET /api/datasource?pageNum=1&pageSize=10&sourceType=EXCEL
```

| 参数 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| `pageNum` | `int` | `1` | ❌ | 页码 |
| `pageSize` | `int` | `10` | ❌ | 每页条数 |
| `sourceType` | `String` | — | ❌ | 类型过滤，不传则查全部 |

**响应**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "sourceName": "教师信息Excel",
        "sourceType": "EXCEL",
        "filePath": "/uploads/teachers.xlsx",
        "description": "2025秋季学期教师数据",
        "status": "ACTIVE",
        "createTime": "2025-09-01T10:00:00",
        "updateTime": "2025-09-01T10:00:00"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

### 3.2 查询数据源详情

```
GET /api/datasource/{id}
```

| 参数 | 位置 | 类型 | 说明 |
|------|------|------|------|
| `id` | Path | `Long` | 数据源 ID |

**响应** `data` 为单个 `DataSource` 对象，结构同 3.1 中 `records` 元素。

**异常**：资源不存在时返回 `404`。

### 3.3 新增数据源

```
POST /api/datasource
Content-Type: application/json
```

**请求体**

```json
{
  "sourceName": "教师信息Excel",
  "sourceType": "EXCEL",
  "filePath": "/uploads/teachers.xlsx",
  "description": "2025秋季学期教师数据",
  "status": "ACTIVE"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sourceName` | `String` | ✅ | 数据源名称 |
| `sourceType` | `String` | ✅ | `EXCEL` / `TXT` / `CSV` / `DB` / `API` |
| `filePath` | `String` | ❌ | 文件路径 |
| `description` | `String` | ❌ | 备注说明 |
| `status` | `String` | ❌ | `ACTIVE`（默认）/ `INACTIVE` |

**响应** `data` 为创建后的完整 `DataSource` 对象（含自增 ID 和时间戳）。

### 3.4 更新数据源

```
PUT /api/datasource/{id}
Content-Type: application/json
```

请求体字段同 3.3 新增，仅需传入需要更新的字段（但 `id` 由路径参数传入，无需在 body 中重复）。

### 3.5 删除数据源

```
DELETE /api/datasource/{id}
```

**响应** `data` 为 `null`，`code=200` 表示删除成功。

> 删除为逻辑删除（`deleted` 字段置 1），数据不会物理清除。

### 3.6 查询激活的数据源（下拉列表）

```
GET /api/datasource/active
```

**响应**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "sourceName": "教师信息Excel",
      "sourceType": "EXCEL",
      "status": "ACTIVE"
    }
  ]
}
```

> 仅返回 `status = 'ACTIVE'` 且未被逻辑删除的数据源。

---

## 四、全局异常处理

所有异常由 `GlobalExceptionHandler` 统一拦截，保证前端始终收到一致的 JSON 响应。

| 异常类型 | 响应 code | message 示例 | 触发场景 |
|----------|-----------|-------------|---------|
| `BusinessException` | 自定义 | 按业务抛出内容 | 业务规则不满足时 |
| `MethodArgumentNotValidException` | `400` | `sourceName: 不能为空` | `@Valid` 校验失败 |
| `MaxUploadSizeExceededException` | `400` | 上传文件大小超出限制（最大10MB） | 文件超过 `spring.servlet.multipart.max-file-size` |
| `MissingServletRequestParameterException` | `400` | `缺少必填参数: importType` | 缺少 `@RequestParam(required=true)` 参数 |
| `Exception`（兜底） | `500` | 服务器内部错误 | 未预期的运行时异常 |

**常见业务异常示例**

| HTTP 状态 | 响应 code | message | 触发条件 |
|-----------|-----------|---------|---------|
| 200 | 400 | 不支持的文件格式，仅支持: .xlsx, .xls, .csv | 上传非表格文件 |
| 200 | 400 | 上传文件不能为空 | 未选择文件 |
| 200 | 400 | 不支持的导入类型: XXX | `importType` 不在枚举中 |
| 200 | 404 | 课程不存在: id=999 | 查询不存在的资源 |

---

## 附录 A：接口速查表

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 导入 | `POST` | `/api/import/upload` | 上传文件导入数据 |
| 数据源 | `GET` | `/api/datasource` | 分页查询列表 |
| 数据源 | `GET` | `/api/datasource/{id}` | 查询详情 |
| 数据源 | `POST` | `/api/datasource` | 新增 |
| 数据源 | `PUT` | `/api/datasource/{id}` | 更新 |
| 数据源 | `DELETE` | `/api/datasource/{id}` | 删除（逻辑删除） |
| 数据源 | `GET` | `/api/datasource/active` | 激活列表（下拉用） |

**共计 8 个接口**，覆盖 2 大模块。

## 附录 B：枚举值一览

### sourceType（数据源类型）

| 值 | 说明 |
|----|------|
| `EXCEL` | Excel 文件 |
| `TXT` | 文本文件 |
| `CSV` | CSV 文件 |
| `DB` | 数据库直连 |
| `API` | 外部 API |

### importType（导入类型）

| 值 | 说明 |
|----|------|
| `TEACHER` | 教师信息 |
| `STUDENT` | 学生信息 |
| `COURSE` | 课程信息 |
| `HOMEWORK` | 作业成绩 |
| `QUIZ` | 测验成绩 |
| `ATTENDANCE` | 考勤记录 |
| `EXPERIMENT` | 实验报告 |
| `EXAM_SCORE` | 考试成绩 |
| `KNOWLEDGE_POINT` | 知识点 |
| `CLASS_STUDENT` | 班级学生名单 |

### status（数据源状态 / 导入状态）

| 值 | 适用场景 | 说明 |
|----|---------|------|
| `ACTIVE` | 数据源 | 激活可用 |
| `INACTIVE` | 数据源 | 已停用 |
| `SUCCESS` | 导入结果 | 全部成功 |
| `PARTIAL` | 导入结果 | 部分成功 |
| `FAILED` | 导入结果 | 全部失败 |
