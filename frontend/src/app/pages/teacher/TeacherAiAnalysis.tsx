import { useState, useEffect } from "react";
import {
  Sparkles, CheckCircle, ChevronDown, Calendar, Target, AlertTriangle,
  BarChart3, FileText, BookMarked, RotateCcw, BookOpen, Clock, AlertCircle, ArrowRight
} from "lucide-react";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import {
  getAiAnalysisReport, getQuestionBankAudit, AiAnalysisReport,
  QuestionBankAudit, assessmentTypeLabel, questionTypeLabel,
  difficultyLabel, issueCategoryLabel,
} from "../../../services/aiAnalysisService";
import { Tag, StatCard } from "../../utils";

function TeacherAiAnalysis({ onOpenQuestion, onCoverKnowledgePoints }: {
  onOpenQuestion: (id: number, courseId?: number | null) => void;
  onCoverKnowledgePoints: (courseId: number, knowledgePoints: string[]) => void;
}) {
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [report, setReport] = useState<AiAnalysisReport | null>(null);
  const [audit, setAudit] = useState<QuestionBankAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getMyCourses().then(cs => {
      setCourses(cs);
      if (cs.length > 0) setCourseId(cs[0].id);
    }).catch(() => { /* 忽略，保留空态 */ });
  }, []);

  const showToastMsg = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const handleGenerate = async () => {
    if (!courseId || loading) return;
    setLoading(true);
    try {
      setReport(await getAiAnalysisReport(courseId));
      showToastMsg("AI 分析报告已生成");
    } catch {
      showToastMsg("分析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!courseId || auditing) return;
    setAuditing(true);
    try {
      setAudit(await getQuestionBankAudit(courseId));
      showToastMsg("题库体检完成");
    } catch {
      showToastMsg("题库体检失败，请稍后重试");
    } finally {
      setAuditing(false);
    }
  };

  const levelTag = (l: string) =>
    l === "预警" ? <Tag color="red">预警</Tag> : l === "关注" ? <Tag color="yellow">关注</Tag> : <Tag color="green">正常</Tag>;
  const suggestionTag = (s: string) =>
    s === "RETEACH" ? <Tag color="red">重点再讲</Tag> : s === "REINFORCE" ? <Tag color="yellow">建议巩固</Tag> : <Tag color="green">掌握良好</Tag>;
  const riskTag = (r: string) => (r === "HIGH" ? <Tag color="red">高风险</Tag> : <Tag color="yellow">中风险</Tag>);
  const pctText = (v?: number | null) => (v != null ? `${Number(v).toFixed(1)}%` : "—");
  const scoreText = (v?: number | null) => (v != null ? Number(v).toFixed(1) : "—");

  const attWarnCount = report ? report.attendance.students.filter(s => s.level === "预警").length : 0;
  const reteachCount = report ? report.knowledge.filter(k => k.suggestion === "RETEACH").length : 0;
  const highCount = report ? report.alerts.filter(a => a.riskLevel === "HIGH").length : 0;

  const issueColor = (c: string) =>
    c === "INVALID_DIFFICULTY" ? "orange" : c === "UNMATCHED_KNOWLEDGE_POINT" ? "yellow" : "red";

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      {/* 顶部：课程选择 + 一键生成 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI 智能分析</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              自动分析教学短板并提前预警：到课率、知识点、作业与考试成绩，一键生成模块化报告
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={courseId ?? ""} onChange={e => setCourseId(parseInt(e.target.value))}
              className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
              {courses.length === 0 && <option value="">暂无课程</option>}
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.courseName} · {c.semester}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
          </div>
          <button onClick={handleGenerate} disabled={!courseId || loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Sparkles size={14} />{loading ? "分析中…" : report ? "重新生成报告" : "生成分析报告"}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Sparkles size={36} className="mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            选择课程后点击「生成分析报告」，AI 将自动完成到课率短板、知识点再讲建议、
            学生综合预警、成绩分析与评价反馈的全模块分析
          </p>
        </div>
      ) : (
        <>
          {/* AI 总评 */}
          <div className="bg-card rounded-xl border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-semibold">AI 总评</h3>
              {!report.aiAvailable && <Tag color="gray">本地规则总结 · AI 大模型暂不可用</Tag>}
              <span className="ml-auto text-xs text-muted-foreground">
                {report.courseName} · {report.semester} · 生成于 {report.generatedAt}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{report.aiSummary}</p>
          </div>

          {/* 模块一：到课率短板分析 */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <h3 className="font-semibold">模块一 · 到课率短板分析</h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>参考项 · 班级平均到课率：
                  <span className="font-mono font-semibold text-primary ml-1">{pctText(report.attendance.classAvgRate)}</span>
                </span>
                <span>预警线 80%</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-2 pr-4">学号</th><th className="pb-2 pr-4">姓名</th>
                    <th className="pb-2 pr-4">出勤</th><th className="pb-2 pr-4">迟到</th>
                    <th className="pb-2 pr-4">请假</th><th className="pb-2 pr-4">缺勤</th>
                    <th className="pb-2 pr-4">到课率</th><th className="pb-2">等级</th>
                  </tr>
                </thead>
                <tbody>
                  {report.attendance.students.slice(0, 10).map(s => (
                    <tr key={s.studentId} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono text-xs">{s.studentNo}</td>
                      <td className="py-2 pr-4">{s.name}</td>
                      <td className="py-2 pr-4 font-mono">{s.presentCount}</td>
                      <td className="py-2 pr-4 font-mono">{s.lateCount}</td>
                      <td className="py-2 pr-4 font-mono">{s.leaveCount}</td>
                      <td className={`py-2 pr-4 font-mono ${s.absentCount > 0 ? "text-[#DD7373] font-medium" : ""}`}>{s.absentCount}</td>
                      <td className="py-2 pr-4 font-mono">{pctText(s.attendanceRate)}</td>
                      <td className="py-2">{levelTag(s.level)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.attendance.students.length > 10 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  仅展示到课率最低的 10 名学生（共 {report.attendance.students.length} 人），其中 {attWarnCount} 人触发预警
                </p>
              )}
            </div>
          </div>

          {/* 模块二 + 模块三 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 模块二：知识点再讲建议 */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-primary" />
                <h3 className="font-semibold">模块二 · 知识点再讲建议</h3>
                {reteachCount > 0 && <Tag color="red">{reteachCount} 个建议重点再讲</Tag>}
              </div>
              <div className="space-y-3">
                {report.knowledge.length === 0 && (
                  <p className="text-sm text-muted-foreground">暂无知识点掌握度数据，请先导入成绩数据</p>
                )}
                {report.knowledge.map(k => (
                  <div key={k.kpName}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{k.kpName}</span>
                      {suggestionTag(k.suggestion)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${k.classAvgRate < 50 ? "bg-[#E88383]" : k.classAvgRate < 70 ? "bg-[#F5C069]" : "bg-[#74C2A0]"}`}
                          style={{ width: `${Math.min(100, Number(k.classAvgRate))}%` }} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground w-24 text-right">
                        {pctText(k.classAvgRate)} · 薄弱 {k.weakStudentCount}/{k.studentCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 模块三：学生综合预警 */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-[#E8945C]" />
                <h3 className="font-semibold">模块三 · 学生综合预警</h3>
                <span className="text-xs text-muted-foreground">
                  {report.alerts.length} 人（高风险 {highCount}）
                </span>
              </div>
              {report.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无预警学生，整体学情健康</p>
              ) : (
                <div className="space-y-3">
                  {report.alerts.map(a => (
                    <div key={a.studentId} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm">{a.name}
                          <span className="font-mono text-xs text-muted-foreground ml-2">{a.studentNo}</span>
                        </span>
                        {riskTag(a.riskLevel)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1.5 font-mono">
                        到课率 {pctText(a.attendanceRate)} · 作业 {scoreText(a.homeworkAvg)} · 考试 {scoreText(a.examAvg)}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {a.reasons.map((r, i) => <Tag key={i} color="red">{r}</Tag>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 模块四 + 模块五 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 模块四：成绩分析 */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-primary" />
                <h3 className="font-semibold">模块四 · 作业/考试成绩分析</h3>
                <span className="text-xs text-muted-foreground">得分率及格线 60%</span>
              </div>
              {report.scores.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无考核数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="pb-2 pr-4">考核</th><th className="pb-2 pr-4">类型</th>
                        <th className="pb-2 pr-4">平均分</th><th className="pb-2 pr-4">得分率</th>
                        <th className="pb-2 pr-4">低分</th><th className="pb-2">缺考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.scores.map(s => (
                        <tr key={s.assessmentId} className="border-b border-border/50">
                          <td className="py-2 pr-4">{s.assessmentName}</td>
                          <td className="py-2 pr-4"><Tag color="blue">{assessmentTypeLabel(s.assessmentType)}</Tag></td>
                          <td className="py-2 pr-4 font-mono">{scoreText(s.avgScore)}</td>
                          <td className={`py-2 pr-4 font-mono ${Number(s.scoreRate) < 60 ? "text-[#DD7373] font-medium" : ""}`}>
                            {pctText(s.scoreRate)}
                          </td>
                          <td className={`py-2 pr-4 font-mono ${s.lowScoreCount > 0 ? "text-[#E8945C]" : ""}`}>{s.lowScoreCount}</td>
                          <td className={`py-2 font-mono ${s.absentCount > 0 ? "text-[#DD7373]" : ""}`}>{s.absentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 模块五：教学评价反馈 */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-primary" />
                <h3 className="font-semibold">模块五 · 教学评价反馈</h3>
                <span className="text-xs text-muted-foreground">考核暴露的薄弱点，反哺教学</span>
              </div>
              {report.feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无薄弱点反馈数据</p>
              ) : (
                <div className="space-y-2">
                  {report.feedback.map(f => (
                    <div key={f.kpName} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                      <div className="text-sm">
                        <span className="font-medium">{f.kpName}</span>
                        {f.aspect && <span className="text-xs text-muted-foreground ml-2">薄弱方面：{f.aspect}</span>}
                      </div>
                      <Tag color="orange">{f.count} 人次失分</Tag>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 题库整理判断 */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookMarked size={16} className="text-primary" />
            <h3 className="font-semibold">题库整理判断</h3>
            <span className="text-xs text-muted-foreground">题型分布 · 难度分布 · 知识点覆盖 · 疑似重复题 · 内容完整性</span>
          </div>
          <button onClick={handleAudit} disabled={!courseId || auditing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors">
            <RotateCcw size={14} />{auditing ? "体检中…" : "开始题库体检"}
          </button>
        </div>

        {!audit ? (
          <p className="text-sm text-muted-foreground">对课程题库进行 AI 体检，识别需要整理的题目与覆盖空缺</p>
        ) : (
          <div className="space-y-4">
            {/* 概览数字 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard count={audit.total} label="题目总数" icon={BookOpen} color="blue" />
              <StatCard count={audit.aiGenerated} label="AI 生成" icon={Sparkles} color="purple" />
              <StatCard count={audit.pendingReview} label="待审核" icon={Clock} color="orange" />
              <StatCard count={audit.duplicates.length} label="疑似重复组" icon={AlertCircle} color="green" />
              <StatCard count={audit.unusedCount} label="未使用题" icon={FileText} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 题型分布 + 覆盖 */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">题型分布</p>
                  <div className="flex flex-wrap gap-2">
                    {audit.typeDistribution.length === 0 && <span className="text-sm text-muted-foreground">题库为空</span>}
                    {audit.typeDistribution.map(t => (
                      <Tag key={t.questionType} color="blue">{questionTypeLabel(t.questionType)} × {t.count}</Tag>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">难度分布</p>
                  {audit.difficultyDistribution.length === 0 ? (
                    <span className="text-sm text-muted-foreground">题库为空</span>
                  ) : (
                    <div className="space-y-1.5">
                      {audit.difficultyDistribution.map(d => {
                        const max = Math.max(1, ...audit.difficultyDistribution.map(x => x.count));
                        const barColor = d.difficulty === "UNLABELED" ? "bg-[#E88383]"
                          : d.difficulty === "HARD" ? "bg-[#F2A56B]"
                          : d.difficulty === "MEDIUM" ? "bg-[#969BE7]" : "bg-[#74C2A0]";
                        return (
                          <div key={d.difficulty} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{difficultyLabel(d.difficulty)}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.round((d.count / max) * 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono w-6 text-right flex-shrink-0">{d.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">知识点覆盖 TOP</p>
                  <div className="flex flex-wrap gap-2">
                    {audit.kpCoverage.slice(0, 8).map(k => (
                      <Tag key={k.kpName} color="green">{k.kpName} × {k.questionCount}</Tag>
                    ))}
                  </div>
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
                </div>
                {audit.avgClarity != null && (
                  <p className="text-xs text-muted-foreground">
                    AI 质量均分：清晰度 {Number(audit.avgClarity).toFixed(1)} ·
                    难度匹配 {audit.avgDifficultyMatch != null ? Number(audit.avgDifficultyMatch).toFixed(1) : "—"} ·
                    歧义性 {audit.avgAmbiguity != null ? Number(audit.avgAmbiguity).toFixed(1) : "—"} ·
                    知识点覆盖 {audit.avgKpCoverage != null ? Number(audit.avgKpCoverage).toFixed(1) : "—"}（满分 5）
                  </p>
                )}
              </div>

              {/* 建议 + AI 判断 */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">整理建议</p>
                  <ul className="space-y-1.5">
                    {audit.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle size={14} className="text-[#E8945C] mt-0.5 flex-shrink-0" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-xs font-semibold">AI 综合判断</span>
                    {!audit.aiAvailable && <Tag color="gray">规则建议 · AI 大模型暂不可用</Tag>}
                  </div>
                  <p className="text-sm leading-relaxed">{audit.aiJudgment}</p>
                </div>
                {audit.duplicates.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">疑似重复题（题干相同 · 左右滑动）</p>
                    <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
                      {audit.duplicates.map((d, i) => (
                        <div key={i} className="flex-shrink-0 w-64 border border-border rounded-lg px-3 py-2.5 snap-start">
                          <span className="line-clamp-2 text-sm text-foreground/90">{d.stem}</span>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {d.questionIds.map(qid => (
                              <button
                                key={qid}
                                onClick={() => onOpenQuestion(qid, courseId)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono border border-border rounded-md hover:bg-accent/40 hover:border-primary/40 hover:text-primary transition-colors"
                              >
                                #{qid}
                                <ArrowRight size={11} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 问题清单 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">问题清单（{audit.issues.length}）</p>
                <span className="text-xs text-muted-foreground">点击题目跳转到题库编辑</span>
              </div>
              {audit.issues.length === 0 ? (
                <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-6 text-center">
                  <CheckCircle size={20} className="mx-auto mb-2 text-[#74C2A0]" />
                  未发现明显问题，题库结构健康
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {audit.issues.map((it, i) => (
                    <button
                      key={`${it.questionId}-${i}`}
                      onClick={() => onOpenQuestion(it.questionId, courseId)}
                      className="w-full flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2.5 text-left hover:bg-accent/40 hover:border-primary/40 transition-colors group"
                    >
                      <Tag color={issueColor(it.category)}>{issueCategoryLabel(it.category)}</Tag>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{questionTypeLabel(it.questionType)}</span>
                      <span className="text-xs text-muted-foreground font-mono flex-shrink-0">#{it.questionId}</span>
                      <span className="line-clamp-1 flex-1 text-foreground/90">{it.stem || "（无法解析）"}</span>
                      {it.detail && <span className="text-xs text-muted-foreground flex-shrink-0 max-w-40 truncate">{it.detail}</span>}
                      <ArrowRight size={14} className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherAiAnalysis;
