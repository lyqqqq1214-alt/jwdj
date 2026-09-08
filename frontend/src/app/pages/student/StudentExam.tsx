import { useState, useEffect, useRef } from "react";
import { CheckCircle, ChevronLeft, Clock, FileText, Eye, ChevronRight } from "lucide-react";
import { getPendingExams, getMyExamRecords, getStudentExam, submitExam, getMyExamResult, ExamPaper, StudentExamRecordVO, StudentExamVO, SubmitExamResultDTO, StudentExamResultVO } from "../../../services/examService";
import { Tag } from "../../utils";

function StudentExam() {
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [pendingExams, setPendingExams] = useState<ExamPaper[]>([]);
  const [records, setRecords] = useState<StudentExamRecordVO[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeExam, setActiveExam] = useState<StudentExamVO | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<SubmitExamResultDTO | null>(null);

  const [reviewResult, setReviewResult] = useState<StudentExamResultVO | null>(null);
  const autoSubmittedRef = useRef(false);
  const hasDeadlineRef = useRef(false);
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const load = () => {
    setLoading(true);
    Promise.all([getPendingExams(), getMyExamRecords()])
      .then(([p, r]) => { setPendingExams(p || []); setRecords(r || []); })
      .catch(() => { setPendingExams([]); setRecords([]); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!activeExam) return;
    const timer = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [activeExam]);

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

  const exitExam = () => {
    setActiveExam(null);
    setSubmittedResult(null);
    setReviewResult(null);
    setShowConfirmModal(false);
    load();
  };

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

  useEffect(() => {
    if (activeExam && hasDeadlineRef.current && timeLeft === 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      doSubmit(true);
    }
  }, [timeLeft, activeExam]);

  useEffect(() => {
    if (!activeExam || submittedResult) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activeExam, submittedResult]);

  const openReview = async (record: StudentExamRecordVO) => {
    try {
      const r = await getMyExamResult(record.paperId);
      setReviewResult(r);
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "无法加载作答详情");
    }
  };

  const q = activeExam?.questions[currentQuestion];
  const qType = q?.questionType || "";
  const isMulti = qType === "MULTI";
  const hasOptions = !!q?.options && q.options.length > 0;

  const setOptionAnswer = (questionId: number, label: string) => {
    setAnswers(prev => {
      if (!isMulti) return { ...prev, [questionId]: label };
      const cur = (prev[questionId] || "").split(",").filter(Boolean);
      const idx = cur.indexOf(label);
      if (idx >= 0) cur.splice(idx, 1); else cur.push(label);
      return { ...prev, [questionId]: cur.join(",") };
    });
  };

  const typeLabel = (t?: string) => {
    const map: Record<string, string> = { SINGLE: "单选题", MULTI: "多选题", FILL: "填空题", SHORT: "简答题", COMPREHENSIVE: "综合题", TRUE_FALSE: "判断题" };
    return map[t || ""] || "题目";
  };

  const isObjective = (t?: string) => ["SINGLE", "MULTI", "FILL", "TRUE_FALSE"].includes(t || "");

  const fmtDate = (t?: string) => (t ? t.replace("T", " ").slice(0, 16) : "—");
  const fmtClock = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // ===== 回看结果 =====
  if (reviewResult) {
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}
        <button onClick={() => setReviewResult(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> 返回
        </button>
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">{reviewResult.paperName}</h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <span>客观题得分：<span className="font-semibold">{reviewResult.objectiveScore ?? 0}</span></span>
            <span>主观题待批：<span className="font-semibold">{reviewResult.subjectivePending ?? 0}</span> 题</span>
            <span>总分：<span className="font-semibold">{reviewResult.myScore ?? 0}</span> / {reviewResult.totalScore ?? "—"}</span>
            <span className="text-muted-foreground">交卷时间：{fmtDate(reviewResult.submitTime)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {reviewResult.answers.map(a => (
            <div key={a.questionNo} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">第{a.questionNo}题 · {typeLabel(a.questionType)}</span>
                {isObjective(a.questionType) ? (
                  a.isCorrect === 1 ? <Tag color="green">回答正确</Tag> : <Tag color="red">回答错误</Tag>
                ) : (
                  a.graded === 1 ? <Tag color="green">已批阅</Tag> : <Tag color="yellow">待批阅</Tag>
                )}
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{a.stem}</p>
              {a.options && a.options.length > 0 && (
                <div className="mt-2 space-y-1">
                  {a.options.map(o => <p key={o.label} className="text-sm text-muted-foreground">{o.label}. {o.text}</p>)}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">我的答案</p>
                  <p className="text-sm whitespace-pre-wrap">{a.studentAnswer || "（未作答）"}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">正确答案</p>
                  <p className="text-sm whitespace-pre-wrap">{a.correctAnswer || "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span>得分：<span className="font-semibold">{a.score ?? 0}</span> / {a.maxScore ?? "—"}</span>
                {!isObjective(a.questionType) && a.comment && (
                  <span className="text-muted-foreground">评语：{a.comment}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== 交卷结果 =====
  if (submittedResult) {
    return (
      <div className="space-y-5">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-[#57AE8F] mb-3" />
          <h2 className="text-xl font-semibold text-foreground">交卷成功</h2>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div>
              <p className="text-3xl font-semibold text-primary">{submittedResult.objectiveScore ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">客观题得分</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-3xl font-semibold text-foreground">{submittedResult.subjectiveCount ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">主观题待批阅</p>
            </div>
          </div>
          <button onClick={exitExam} className="mt-6 px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">返回列表</button>
        </div>
      </div>
    );
  }

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

  // ===== 列表视图 =====
  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        <button onClick={() => setTab("pending")} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>待考</button>
        <button onClick={() => setTab("completed")} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "completed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>已完成</button>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : tab === "pending" ? (
        pendingExams.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无待考考试</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )
      ) : (
        records.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无已完成考试</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">试卷</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">课程</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">得分</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">交卷时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.recordId} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.paperName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.courseName || "—"}</td>
                    <td className="px-4 py-3 font-mono">{r.myScore ?? 0} / {r.totalScore ?? "—"}</td>
                    <td className="px-4 py-3">{r.subjectivePending && r.subjectivePending > 0 ? <Tag color="yellow">待批阅</Tag> : <Tag color="green">已出分</Tag>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtDate(r.submitTime)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openReview(r)} className="inline-flex items-center gap-1 text-xs text-[#969BE7] hover:underline"><Eye size={14} />查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

export default StudentExam;
