# 学生在线考试界面增强 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让学生在线考试支持全屏锁定作答、题目导航、截止时间倒计时与自动交卷，并正确处理待考/已完成状态。

**Architecture:** 后端三处小改（`getPendingExams` 排除已交卷、`getExamForStudent` 拦截重复进入、`submitExam` 增加截止宽限期）；前端集中在 `StudentExam` 组件内，用固定定位全屏遮罩覆盖原布局，右侧答题卡导航，倒计时改为距 `endTime`。

**Tech Stack:** Java 21 / Spring Boot / MyBatis Plus；React + TypeScript + Tailwind（前端无单测框架，行为以手工验证为主）。

## Global Constraints

- 后端测试统一在 `src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java`，遵循 Given-When-Then + `@DisplayName` 编号（EX-NN）约定，用 `@ExtendWith(MockitoExtension.class)` + `@Mock`/`@InjectMocks`。
- 后端统一响应 `Result<T>`，异常用 `BusinessException(ResultCode.XXX.getCode(), "中文提示")`。
- 前端所有改动仅限 `frontend/src/app/App.tsx` 的 `StudentExam()` 函数；`examService.ts` 无需改动（`startTime`/`endTime` 字段已存在）。
- 宽限期固定为截止后 **2 分钟**。
- 提交信息使用中文 `feat:` 前缀，与仓库既有风格一致。
- 后端测试运行命令：`./mvnw test -Dtest=ExamServiceImplTest`（项目根目录）。前端构建：`cd frontend && npm run build`。

---

### Task 1: 后端 — `getPendingExams` 排除已交卷试卷

**Files:**
- Modify: `src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java:321-340`
- Test: `src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java`

**Interfaces:**
- Produces: 新增私有方法 `private Set<Long> submittedPaperIds(Long studentId)`，供 `getPendingExams` 与 Task 2 的 `getExamForStudent` 复用。

- [ ] **Step 1: 给现有 `getPendingExams` 相关测试补上新的空 stub（防止 Mockito 返回 null 导致 NPE）**

在 `ExamServiceImplTest` 中，以下 5 个现有测试各加一行 `when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());`（放在各自已有的 `when(examPaperMapper.selectList(...))` 之后即可）：

1. `EX-06 shouldReturnPublishedExams`
2. `EX-24 shouldHideExamWhenNotInTargetClass`
3. `EX-25 shouldShowExamWhenInTargetClass`
4. `EX-31 shouldShowExamOnlyForTargetStudents`
5. `EX-32 shouldHideExamWhenNotInTargetStudents`

例如 `EX-06` 改为：

```java
paper.setStatus("PUBLISHED");
when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));
when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
```

- [ ] **Step 2: 写失败测试 EX-34**

在 `GetPendingExams` 嵌套类内新增：

```java
@Test
@DisplayName("EX-34: 已交卷试卷应移出待考")
void shouldExcludeSubmittedPaperFromPending() {
    paper.setStatus("PUBLISHED");
    when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
    when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
            .thenReturn(List.of(new CourseStudent() {{
                setCourseId(1L); setStudentId(100L);
            }}));
    when(examPaperMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(paper));

    AssessmentRecord record = new AssessmentRecord();
    record.setStudentId(100L);
    record.setAssessmentId(1L);
    when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));

    Assessment assessment = new Assessment();
    assessment.setId(1L);
    assessment.setPaperId(1L);
    when(assessmentMapper.selectBatchIds(any())).thenReturn(List.of(assessment));

    List<ExamPaper> result = examService.getPendingExams(3L);

    assertTrue(result.isEmpty());
}
```

- [ ] **Step 3: 运行测试确认失败**

Run: `./mvnw test -Dtest=ExamServiceImplTest`
Expected: EX-34 失败（当前 `getPendingExams` 不会排除已交卷试卷，返回 1 条）。

- [ ] **Step 4: 实现 `submittedPaperIds` 并在 `getPendingExams` 中过滤**

修改 `getPendingExams`（当前第 321-340 行）：

```java
@Override
public List<ExamPaper> getPendingExams(Long userId) {
    Long studentId = resolveStudentId(userId);
    List<CourseStudent> csList = courseStudentMapper.selectList(
            new LambdaQueryWrapper<CourseStudent>().eq(CourseStudent::getStudentId, studentId));
    if (csList.isEmpty()) return Collections.emptyList();
    Set<Long> enrolled = csList.stream().map(CourseStudent::getCourseId).collect(Collectors.toSet());

    // 已交卷试卷集合（交卷后移出待考）
    Set<Long> submittedPaperIds = submittedPaperIds(studentId);

    List<ExamPaper> papers = examPaperMapper.selectList(
            new LambdaQueryWrapper<ExamPaper>()
                    .eq(ExamPaper::getStatus, "PUBLISHED")
                    .orderByDesc(ExamPaper::getCreateTime));

    LocalDateTime now = LocalDateTime.now();
    return papers.stream()
            .filter(p -> inTargetStudents(studentId, enrolled, p))
            .filter(p -> p.getEndTime() == null || now.isBefore(p.getEndTime()))
            .filter(p -> !submittedPaperIds.contains(p.getId()))
            .collect(Collectors.toList());
}
```

在私有方法区（例如 `resolveStudentId` 之后）新增：

```java
private Set<Long> submittedPaperIds(Long studentId) {
    List<AssessmentRecord> records = assessmentRecordMapper.selectList(
            new LambdaQueryWrapper<AssessmentRecord>().eq(AssessmentRecord::getStudentId, studentId));
    if (records.isEmpty()) return Collections.emptySet();
    Set<Long> assessmentIds = records.stream()
            .map(AssessmentRecord::getAssessmentId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    if (assessmentIds.isEmpty()) return Collections.emptySet();
    return assessmentMapper.selectBatchIds(assessmentIds).stream()
            .map(Assessment::getPaperId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
}
```

（`Objects`、`Assessment`、`AssessmentRecord` 均已 import，见文件头 `java.util.*` 与 `com.example.aitaes.entity.*`。）

- [ ] **Step 5: 运行测试确认通过**

Run: `./mvnw test -Dtest=ExamServiceImplTest`
Expected: 全部通过（EX-34 及现有测试）。

- [ ] **Step 6: 提交**

```bash
git add src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java
git commit -m "feat: 待考列表排除已交卷试卷"
```

---

### Task 2: 后端 — `getExamForStudent` 拦截已交卷学生

**Files:**
- Modify: `src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java:342-397`
- Test: `src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java`

**Interfaces:**
- Consumes: Task 1 的 `submittedPaperIds(Long studentId)`。

- [ ] **Step 1: 给现有 `getExamForStudent` 测试补空 stub**

以下 2 个现有测试各加一行 `when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());`：

1. `EX-07 shouldReturnPaperWithQuestions`
2. `EX-22 shouldReturnOverriddenStem`

例如 `EX-07` 在 `when(examPaperMapper.selectById(1L)).thenReturn(paper);` 之后加：

```java
when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
```

- [ ] **Step 2: 写失败测试 EX-35**

在 `GetExamForStudent` 嵌套类内新增：

```java
@Test
@DisplayName("EX-35: 已交卷学生应禁止再次进入")
void shouldRejectAlreadySubmittedStudent() {
    paper.setStatus("PUBLISHED");
    when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
    when(examPaperMapper.selectById(1L)).thenReturn(paper);

    AssessmentRecord record = new AssessmentRecord();
    record.setStudentId(100L);
    record.setAssessmentId(1L);
    when(assessmentRecordMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(record));
    Assessment assessment = new Assessment();
    assessment.setId(1L);
    assessment.setPaperId(1L);
    when(assessmentMapper.selectBatchIds(any())).thenReturn(List.of(assessment));

    assertThrows(BusinessException.class, () -> examService.getExamForStudent(1L, 3L));
}
```

- [ ] **Step 3: 运行测试确认失败**

Run: `./mvnw test -Dtest=ExamServiceImplTest`
Expected: EX-35 失败（当前 `getExamForStudent` 不拦截已交卷学生）。

- [ ] **Step 4: 实现守卫**

在 `getExamForStudent` 中，时间校验通过后、`inTargetStudents` 校验之前插入（当前第 353-359 行之间）：

```java
if (paper.getEndTime() != null && now.isAfter(paper.getEndTime())) {
    throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试已结束");
}

// 已交卷则禁止再次进入
if (submittedPaperIds(studentId).contains(paperId)) {
    throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "你已完成该考试");
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `./mvnw test -Dtest=ExamServiceImplTest`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java
git commit -m "feat: 已交卷学生禁止再次进入考试"
```

---

### Task 3: 后端 — `submitExam` 截止宽限期

**Files:**
- Modify: `src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java:399-413`
- Test: `src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java`

- [ ] **Step 1: 写失败测试 EX-36（宽限期内可交）与 EX-37（超宽限期拒绝）**

在 `SubmitExam` 嵌套类内新增：

```java
@Test
@DisplayName("EX-36: 截止后2分钟宽限期内仍可交卷")
void shouldAllowSubmitWithinGrace() {
    paper.setEndTime(LocalDateTime.now().minusMinutes(1));
    when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
    when(examPaperMapper.selectById(1L)).thenReturn(paper);
    when(assessmentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(assessment);
    when(assessmentRecordMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

    ExamPaperQuestion epq = new ExamPaperQuestion();
    epq.setQuestionId(10L); epq.setQuestionNo(1); epq.setScore(new BigDecimal("10"));
    when(examPaperQuestionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(epq));
    when(questionBankMapper.selectById(10L)).thenReturn(question);

    SubmitExamResultDTO result = examService.submitExam(1L, 3L, Map.of(10L, "2"));

    assertEquals(new BigDecimal("10"), result.getObjectiveScore());
}

@Test
@DisplayName("EX-37: 超过宽限期应拒绝交卷")
void shouldRejectSubmitAfterGrace() {
    paper.setEndTime(LocalDateTime.now().minusMinutes(10));
    when(studentMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(student);
    when(examPaperMapper.selectById(1L)).thenReturn(paper);

    assertThrows(BusinessException.class, () -> examService.submitExam(1L, 3L, Map.of(10L, "2")));
}
```

（`assessment` 字段在 `SubmitExam` 嵌套类的 `setUp` 中已定义，`paper` 由外层 `setUp` 置为 `PUBLISHED`、`startTime = now-1h`。）

- [ ] **Step 2: 运行测试确认失败**

Run: `./mvnw test -Dtest=ExamServiceImplTest`
Expected: EX-36、EX-37 失败（当前 `submitExam` 对 `now > endTime` 一律拒绝）。

- [ ] **Step 3: 实现宽限期（直接读卷 + 放宽时间校验）**

将 `submitExam` 开头（当前第 399-413 行）：

```java
    @Override
    @Transactional
    public SubmitExamResultDTO submitExam(Long paperId, Long userId, Map<Long, String> answers) {
        Long studentId = resolveStudentId(userId);
        ExamPaper paper = getPaperById(paperId);
        if ("DRAFT".equals(paper.getStatus()) || "ENDED".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试不可用");
        }
        LocalDateTime now = LocalDateTime.now();
        if (paper.getStartTime() != null && now.isBefore(paper.getStartTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试尚未开始");
        }
        if (paper.getEndTime() != null && now.isAfter(paper.getEndTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试已结束，无法交卷");
        }
```

替换为：

```java
    @Override
    @Transactional
    public SubmitExamResultDTO submitExam(Long paperId, Long userId, Map<Long, String> answers) {
        Long studentId = resolveStudentId(userId);
        // 直接读卷，跳过 normalizeEnded，以允许截止瞬间的自动交卷
        ExamPaper paper = examPaperMapper.selectById(paperId);
        if (paper == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "试卷不存在");
        }
        if ("DRAFT".equals(paper.getStatus()) || "ENDED".equals(paper.getStatus())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试不可用");
        }
        LocalDateTime now = LocalDateTime.now();
        if (paper.getStartTime() != null && now.isBefore(paper.getStartTime())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试尚未开始");
        }
        // 宽限期：截止后 2 分钟内仍可交卷，容忍自动交卷的网络延迟
        if (paper.getEndTime() != null && now.isAfter(paper.getEndTime().plusMinutes(2))) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "考试已结束，无法交卷");
        }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `./mvnw test -Dtest=ExamServiceImplTest`
Expected: 全部通过（含 EX-36、EX-37 与既有 `SubmitExam` 测试）。

- [ ] **Step 5: 提交**

```bash
git add src/main/java/com/example/aitaes/service/impl/ExamServiceImpl.java src/test/java/com/example/aitaes/service/impl/ExamServiceImplTest.java
git commit -m "feat: 交卷宽限期支持截止自动交卷"
```

---

### Task 4: 前端 — 倒计时改为「距截止」并自动交卷（逻辑）

**Files:**
- Modify: `frontend/src/app/App.tsx`（`StudentExam()` 函数内，约 11484-11550 行）

**Interfaces:**
- Produces: 内部函数 `doSubmit(isAuto: boolean)`；refs `autoSubmittedRef`、`hasDeadlineRef`。供 Task 5 的 `handleSubmitExam`/渲染复用。

- [ ] **Step 1: 新增 refs**

在 `StudentExam()` 的 `const [reviewResult, ...]` 声明之后新增：

```tsx
  const autoSubmittedRef = useRef(false);
  const hasDeadlineRef = useRef(false);
```

- [ ] **Step 2: 修改 `startExam`，按 `endTime` 初始化倒计时**

将（当前 11526 行）`setTimeLeft((vo.durationMinutes || 60) * 60);` 所在的 `startExam` 改为：

```tsx
  const startExam = async (paper: ExamPaper) => {
    try {
      const vo = await getStudentExam(paper.id);
      setActiveExam(vo);
      setCurrentQuestion(0);
      setAnswers({});
      setSubmittedResult(null);
      setReviewResult(null);
      autoSubmittedRef.current = false;
      const endMs = vo.endTime ? new Date(vo.endTime).getTime() : null;
      hasDeadlineRef.current = endMs != null;
      setTimeLeft(endMs ? Math.max(0, Math.floor((endMs - Date.now()) / 1000)) : 0);
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "无法开始考试");
    }
  };
```

- [ ] **Step 3: 抽出 `doSubmit`，`handleSubmitExam` 复用**

将 `handleSubmitExam`（当前 11540-11550 行）替换为：

```tsx
  const doSubmit = async (isAuto: boolean) => {
    if (!activeExam) return;
    try {
      const result = await submitExam(activeExam.paperId, answers);
      setSubmittedResult(result);
      setShowConfirmModal(false);
      if (isAuto) showToastMsg("时间到，已自动交卷");
      load();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "交卷失败");
    }
  };

  const handleSubmitExam = () => doSubmit(false);
```

- [ ] **Step 4: 新增自动交卷 effect**

在 `handleSubmitExam`（Step 3 已改写为 `() => doSubmit(false)`）定义之后新增：

```tsx
  useEffect(() => {
    if (activeExam && hasDeadlineRef.current && timeLeft === 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      doSubmit(true);
    }
  }, [timeLeft, activeExam]);
```

- [ ] **Step 5: 前端构建自检**

Run: `cd frontend && npm run build`
Expected: 构建成功（无语法错误）。

- [ ] **Step 6: 提交**

```bash
git add frontend/src/app/App.tsx
git commit -m "feat: 考试倒计时改为距截止并支持自动交卷"
```

---

### Task 5: 前端 — 全屏锁定 + 浏览器拦截 + 右侧答题卡导航 + 「距截止」标签

**Files:**
- Modify: `frontend/src/app/App.tsx`（`StudentExam()` 函数内，考试作答渲染块约 11676-11773 行；状态声明区）

- [ ] **Step 1: 新增 `navigatorCollapsed` 状态**

在 refs 声明（Task 4 Step 1 新增的两行）之后新增：

```tsx
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
```

- [ ] **Step 2: 新增 `beforeunload` 拦截 effect**

在自动交卷 effect 之后新增：

```tsx
  useEffect(() => {
    if (!activeExam || submittedResult) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activeExam, submittedResult]);
```

- [ ] **Step 3: 重写考试作答渲染块（全屏遮罩 + 答题卡 + 标签）**

将整个 `if (activeExam) { ... }` 渲染块（当前 11676-11773 行）替换为以下完整代码：

```tsx
  // ===== 考试作答（全屏） =====
  if (activeExam) {
    const total = activeExam.questions.length;
    return (
      <div className="fixed inset-0 z-[10000] bg-background overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
          {toast && (
            <div className="fixed top-6 right-6 z-[10001] px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
            </div>
          )}
          <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">{activeExam.paperName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">共 {total} 题 · 满分 {activeExam.totalScore ?? "—"}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock size={14} />距截止
              </span>
              <span className="font-mono text-lg font-semibold text-primary">{fmtClock(timeLeft)}</span>
              <button onClick={() => setShowConfirmModal(true)} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">交卷</button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>第 {currentQuestion + 1} / {total} 题</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${total ? ((currentQuestion + 1) / total) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="flex gap-5 items-start">
            <div className="flex-1 min-w-0 space-y-5">
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <Tag color="blue">{typeLabel(q?.questionType)}</Tag>
                  <span className="text-sm text-muted-foreground">本题 {q?.score ?? "—"} 分</span>
                </div>
                <p className="text-base whitespace-pre-wrap">{q?.stem}</p>

                <div className="mt-4 space-y-2">
                  {hasOptions ? (
                    q!.options!.map(o => {
                      const selected = isMulti
                        ? (answers[q!.questionId] || "").split(",").filter(Boolean).includes(o.label)
                        : answers[q!.questionId] === o.label;
                      return (
                        <button
                          key={o.label}
                          onClick={() => setOptionAnswer(q!.questionId, o.label)}
                          className={`w-full text-left px-4 py-2.5 rounded-md border text-sm transition-colors ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/50"}`}
                        >
                          <span className="font-medium mr-2">{o.label}.</span>{o.text}
                        </button>
                      );
                    })
                  ) : qType === "TRUE_FALSE" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {["TRUE", "FALSE"].map(v => {
                        const selected = answers[q!.questionId] === v;
                        return (
                          <button
                            key={v}
                            onClick={() => setAnswers(prev => ({ ...prev, [q!.questionId]: v }))}
                            className={`px-4 py-2.5 rounded-md border text-sm transition-colors ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/50"}`}
                          >
                            {v === "TRUE" ? "正确" : "错误"}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      value={answers[q!.questionId] || ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [q!.questionId]: e.target.value }))}
                      rows={5}
                      placeholder="请输入你的答案…"
                      className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentQuestion(i => Math.max(0, i - 1))} disabled={currentQuestion === 0} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent/50 disabled:opacity-40">上一题</button>
                <button onClick={() => setCurrentQuestion(i => Math.min(total - 1, i + 1))} disabled={currentQuestion >= total - 1} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent/50 disabled:opacity-40">下一题</button>
              </div>
            </div>

            <div className={`${navigatorCollapsed ? "w-10" : "w-56"} shrink-0 transition-all duration-200`}>
              <div className="bg-card rounded-lg border border-border p-3 sticky top-6">
                <div className="flex items-center justify-between">
                  {!navigatorCollapsed && <span className="text-sm font-medium">答题卡</span>}
                  <button onClick={() => setNavigatorCollapsed(c => !c)} className="p-1 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground" title={navigatorCollapsed ? "展开" : "收起"}>
                    {navigatorCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                {!navigatorCollapsed && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {activeExam.questions.map((qq, i) => {
                      const answered = answers[qq.questionId] !== undefined && answers[qq.questionId] !== "";
                      const current = i === currentQuestion;
                      return (
                        <button
                          key={qq.questionNo}
                          onClick={() => setCurrentQuestion(i)}
                          className={`h-8 rounded-md text-xs font-medium transition-colors ${current ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""} ${answered ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                        >
                          {qq.questionNo}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showConfirmModal && (
            <div className="fixed inset-0 z-[10001] bg-black/40 flex items-center justify-center p-4">
              <div className="bg-card rounded-lg border border-border p-6 w-full max-w-sm space-y-4">
                <h3 className="font-semibold text-foreground">确认交卷？</h3>
                <p className="text-sm text-muted-foreground">已作答 {Object.keys(answers).length} / {total} 题，交卷后无法修改。</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent/50">再检查一下</button>
                  <button onClick={handleSubmitExam} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">确认交卷</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: 前端构建自检**

Run: `cd frontend && npm run build`
Expected: 构建成功。

- [ ] **Step 5: 手工验证**

运行前端后以学生身份进入在线考试：
- 点击「开始考试」→ 界面占满全屏，侧边栏/顶栏/AI 悬浮按钮均不可见。
- 右上角倒计时显示「距截止」，数值为距 `endTime` 的剩余时间。
- 右侧答题卡列出所有题号，点击可跳转；已作答题号高亮；点击 `>` 收起、`<` 展开。
- 刷新页面弹出浏览器离开警告。

- [ ] **Step 6: 提交**

```bash
git add frontend/src/app/App.tsx
git commit -m "feat: 考试全屏锁定与答题卡导航"
```

---

### Task 6: 前端 — 待考卡片显示起始时间 + 未开始禁用按钮

**Files:**
- Modify: `frontend/src/app/App.tsx`（`StudentExam()` 列表视图的待考卡片，约 11799-11810 行）

- [ ] **Step 1: 改写待考卡片**

将（当前 11799-11810 行）：

```tsx
            {pendingExams.map(p => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground">{p.paperName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.courseName}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>满分 {p.totalScore ?? "—"}</span>
                  <span>时长 {p.durationMinutes ?? "—"} 分钟</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">截止：{fmtDate(p.endTime)}</p>
                <button onClick={() => startExam(p)} className="mt-4 w-full px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">开始考试</button>
              </div>
            ))}
```

替换为：

```tsx
            {pendingExams.map(p => {
              const notStarted = p.startTime && new Date(p.startTime).getTime() > Date.now();
              return (
                <div key={p.id} className="bg-card rounded-lg border border-border p-5">
                  <h3 className="font-semibold text-foreground">{p.paperName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.courseName}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>满分 {p.totalScore ?? "—"}</span>
                    <span>时长 {p.durationMinutes ?? "—"} 分钟</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">开始：{fmtDate(p.startTime)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">截止：{fmtDate(p.endTime)}</p>
                  <button
                    onClick={() => startExam(p)}
                    disabled={notStarted}
                    className="mt-4 w-full px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {notStarted ? "未开始" : "开始考试"}
                  </button>
                </div>
              );
            })}
```

- [ ] **Step 2: 前端构建自检**

Run: `cd frontend && npm run build`
Expected: 构建成功。

- [ ] **Step 3: 手工验证**

- 待考卡片同时显示「开始」与「截止」时间。
- 未到起始时间的试卷按钮置灰、显示「未开始」且不可点击。

- [ ] **Step 4: 提交**

```bash
git add frontend/src/app/App.tsx
git commit -m "feat: 待考卡片显示起始时间并禁用未开始按钮"
```

---

## 完成校验

全部任务完成后，在项目根目录运行一次完整后端测试：

```bash
./mvnw test
```

确认全部通过后，手工回归学生在线考试主流程：待考（含起始时间/禁用）→ 开始（全屏、倒计时、答题卡）→ 交卷（手动/自动）→ 已完成列表。
