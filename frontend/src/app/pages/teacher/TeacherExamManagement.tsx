import { useState, useEffect, useRef } from "react";
import {
  Edit2, Play, Trash2, Clock, FileSearch, Eye, CheckCircle,
  ChevronLeft, ChevronUp, ChevronDown, Plus, X,
  Users, FileText, BarChart2, TrendingUp
} from "lucide-react";
import {
  getExamPapers, getExamPaperById, getPaperQuestions, createExamPaper,
  updateExamPaper, deleteExamPaper, publishExamPaper, closeExamPaper,
  getExamResults, getPaperGrading, submitStudentGrade,
  ExamPaper, ExamResultDTO, PaperGradingVO, StudentGradeItem,
} from "../../../services/examService";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import { getQuestionList, QuestionBank } from "../../../services/questionBankService";
import { getClassStudents, StudentVO } from "../../../services/classService";
import { Tag, StatCard } from "../../utils";

interface EditableExamQuestion {
  questionId: number;
  questionType: string;
  score: number;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
  analysis: string;
  knowledgePoints?: string;
}

function TeacherExamManagement({ selectedQuizQuestions, setSelectedQuizQuestions }: {
  selectedQuizQuestions: any[];
  setSelectedQuizQuestions: (q: any[]) => void;
}) {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);

  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [examInfo, setExamInfo] = useState({ name: "", courseId: null as number | null, startTime: "", endTime: "" });
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [students, setStudents] = useState<StudentVO[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const editStudentIdsRef = useRef<number[] | null>(null);
  const [bankQuestions, setBankQuestions] = useState<QuestionBank[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Step 2 筛选条件
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterKnowledge, setFilterKnowledge] = useState<string | null>(null);

  // Step 3 可编辑题目快照
  const [editable, setEditable] = useState<EditableExamQuestion[]>([]);

  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [results, setResults] = useState<ExamResultDTO | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // 编辑模式
  const [editingPaperId, setEditingPaperId] = useState<number | null>(null);

  // 批阅模式
  const [gradingPaperId, setGradingPaperId] = useState<number | null>(null);
  const [gradingPaper, setGradingPaper] = useState<PaperGradingVO | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [activeStudentIdx, setActiveStudentIdx] = useState(0);
  const [gradeInputs, setGradeInputs] = useState<Record<number, { score: string; comment: string }>>({});

  // 结果排序
  const [sortKey, setSortKey] = useState<"score" | "studentNo" | "submitTime" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [toast, setToast] = useState<string | null>(null);
  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const loadPapers = () => {
    setLoadingPapers(true);
    getExamPapers(1, 100)
      .then(data => setPapers(data.records || []))
      .catch(() => setPapers([]))
      .finally(() => setLoadingPapers(false));
  };

  useEffect(() => {
    loadPapers();
    getMyCourses()
      .then(data => {
        setCourses(data || []);
      })
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!examInfo.courseId) { setBankQuestions([]); return; }
    setLoadingQuestions(true);
    getQuestionList(1, 500, examInfo.courseId)
      .then(data => setBankQuestions(data.records || []))
      .catch(() => setBankQuestions([]))
      .finally(() => setLoadingQuestions(false));
  }, [examInfo.courseId]);

  useEffect(() => {
    if (!examInfo.courseId) { setStudents([]); setSelectedStudentIds([]); return; }
    setStudentsLoading(true);
    getClassStudents(examInfo.courseId)
      .then(data => {
        const list = data || [];
        setStudents(list);
        if (editStudentIdsRef.current !== null) {
          setSelectedStudentIds(editStudentIdsRef.current);
          editStudentIdsRef.current = null;
        } else {
          setSelectedStudentIds(list.map(s => s.studentId));
        }
      })
      .catch(() => { setStudents([]); setSelectedStudentIds([]); })
      .finally(() => setStudentsLoading(false));
  }, [examInfo.courseId]);

  const stemOf = (q: QuestionBank): string => {
    try {
      const raw = (q as any).content || (q as any).questionContent || "";
      const c = JSON.parse(raw);
      return c.stem || c.question || c.title || raw;
    } catch {
      return (q as any).content || (q as any).questionContent || "";
    }
  };

  const parseContent = (raw?: string): { stem: string; options: { label: string; text: string }[]; answer: string; analysis: string } => {
    const fallback = { stem: raw || "", options: [] as { label: string; text: string }[], answer: "", analysis: "" };
    if (!raw) return fallback;
    try {
      const c = JSON.parse(raw);
      let options: { label: string; text: string }[] = [];
      if (Array.isArray(c.options)) {
        options = c.options.map((o: any) => ({ label: String(o?.label ?? ""), text: String(o?.text ?? o ?? "") }));
      } else if (c.options && typeof c.options === "object") {
        options = Object.entries(c.options).map(([label, text]) => ({ label, text: String(text ?? "") }));
      }
      const answer = Array.isArray(c.answer) ? c.answer.join(",") : (c.answer != null ? String(c.answer) : "");
      return {
        stem: c.stem != null ? String(c.stem) : (c.question != null ? String(c.question) : ""),
        options,
        answer,
        analysis: c.analysis != null ? String(c.analysis) : "",
      };
    } catch {
      return fallback;
    }
  };

  // 知识点筛选选项：直接取自题库中题目自身携带的知识点（knowledgePoints），
  // 而非独立的知识点树表，保证筛选选项与实际题目知识点一一对应。
  const knowledgeOptions = Array.from(new Set(
    bankQuestions.flatMap(q => (q.knowledgePoints || "").split(/[,，、]/).map(s => s.trim()).filter(Boolean))
  )).sort((a, b) => a.localeCompare(b, "zh"));

  const questionTypes = [
    { value: "SINGLE", label: "单选题" },
    { value: "MULTI", label: "多选题" },
    { value: "TRUE_FALSE", label: "判断题" },
    { value: "FILL", label: "填空题" },
    { value: "SHORT", label: "简答题" },
    { value: "COMPREHENSIVE", label: "综合题" },
  ];
  const difficulties = [
    { value: "EASY", label: "简单" },
    { value: "MEDIUM", label: "中等" },
    { value: "HARD", label: "困难" },
  ];

  const filteredQuestions = bankQuestions.filter(q => {
    if (filterType && q.questionType !== filterType) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    if (filterKnowledge) {
      const kps = (q.knowledgePoints || "").split(/[,，、]/).map(s => s.trim()).filter(Boolean);
      if (!kps.includes(filterKnowledge)) return false;
    }
    return true;
  });

  const toggleStudent = (id: number) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllStudents = () => setSelectedStudentIds(students.map(s => s.studentId));
  const clearStudents = () => setSelectedStudentIds([]);

  const buildEditable = (ids: number[]) => {
    const list = ids
      .map(id => {
        const q = bankQuestions.find(b => b.id === id);
        if (!q) return null;
        const c = parseContent((q as any).content);
        return {
          questionId: q.id,
          questionType: q.questionType || "",
          score: 10,
          stem: c.stem,
          options: c.options,
          answer: c.answer,
          analysis: c.analysis,
          knowledgePoints: q.knowledgePoints,
        } as EditableExamQuestion;
      })
      .filter((x): x is EditableExamQuestion => x !== null);
    setEditable(list);
  };

  const updateEditable = (idx: number, patch: Partial<EditableExamQuestion>) => {
    setEditable(prev => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const moveEditable = (idx: number, dir: -1 | 1) => {
    setEditable(prev => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setEditable(prev => prev.map((q, i) => (i === qIdx
      ? { ...q, options: q.options.map((o, j) => (j === optIdx ? { ...o, text } : o)) }
      : q)));
  };

  const relabelOptions = (options: { label: string; text: string }[]) =>
    options.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }));

  const addOption = (qIdx: number) => {
    setEditable(prev => prev.map((q, i) => (i === qIdx
      ? { ...q, options: relabelOptions([...q.options, { label: "", text: "" }]) }
      : q)));
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setEditable(prev => prev.map((q, i) => (i === qIdx
      ? { ...q, options: relabelOptions(q.options.filter((_, j) => j !== optIdx)) }
      : q)));
  };

  const typeLabel = (t?: string) => {
    const map: Record<string, string> = { SINGLE: "单选题", MULTI: "多选题", TRUE_FALSE: "判断题", FILL: "填空题", SHORT: "简答题", COMPREHENSIVE: "综合题" };
    return map[t || ""] || t || "未知";
  };

  const isChoiceType = (t?: string) => ["SINGLE", "MULTI", "TRUE_FALSE"].includes(t || "");
  const isObjectiveType = (t?: string) => ["SINGLE", "MULTI", "FILL", "TRUE_FALSE"].includes(t || "");

  const diffTag = (d?: string) => {
    if (d === "EASY") return <Tag color="green">简单</Tag>;
    if (d === "HARD") return <Tag color="red">困难</Tag>;
    return <Tag color="yellow">中等</Tag>;
  };

  const statusTag = (s?: string) => {
    if (s === "PUBLISHED") return <Tag color="green">已发布</Tag>;
    if (s === "ENDED") return <Tag color="gray">已结束</Tag>;
    return <Tag color="yellow">草稿</Tag>;
  };

  const toggleQuestion = (id: number) => {
    setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openWizard = () => {
    setEditingPaperId(null);
    setSelectedQuestionIds([...selectedQuizQuestions]);
    setSelectedStudentIds([]);
    setStudents([]);
    editStudentIdsRef.current = null;
    setFilterType(null);
    setFilterDifficulty(null);
    setFilterKnowledge(null);
    setEditable([]);
    setShowCreateWizard(true);
    setCreateStep(1);
  };

  const resetWizard = () => {
    setShowCreateWizard(false);
    setCreateStep(1);
    setEditingPaperId(null);
    setExamInfo({ name: "", courseId: null, startTime: "", endTime: "" });
    setSelectedQuestionIds([]);
    setSelectedStudentIds([]);
    setStudents([]);
    editStudentIdsRef.current = null;
    setFilterType(null);
    setFilterDifficulty(null);
    setFilterKnowledge(null);
    setEditable([]);
    setBankQuestions([]);
    setSelectedQuizQuestions([]);
  };

  const goNext = () => {
    if (createStep === 1) {
      if (!examInfo.name.trim()) { showToastMsg("请输入试卷名称"); return; }
      if (!examInfo.courseId) { showToastMsg("请选择课程"); return; }
      if (!examInfo.startTime || !examInfo.endTime) { showToastMsg("请设置开始与结束时间"); return; }
      setCreateStep(2);
    } else if (createStep === 2 && !editingPaperId) {
      if (selectedQuestionIds.length === 0) { showToastMsg("请至少选择一道题目"); return; }
      buildEditable(selectedQuestionIds);
      setCreateStep(3);
    }
  };

  const handleCreateExam = async () => {
    if (!examInfo.name.trim()) { showToastMsg("请输入试卷名称"); return; }
    if (!examInfo.courseId) { showToastMsg("请选择课程"); return; }
    if (!examInfo.startTime || !examInfo.endTime) { showToastMsg("请设置开始与结束时间"); return; }
    if (editable.length === 0) { showToastMsg("请至少选择一道题目"); return; }
    const start = new Date(examInfo.startTime).getTime();
    const end = new Date(examInfo.endTime).getTime();
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));
    const totalScore = editable.reduce((sum, q) => sum + (q.score || 0), 0);
    const targetStudents = selectedStudentIds.join(",");
    const questions = editable.map((q, idx) => {
      const contentObj: Record<string, unknown> = { stem: q.stem };
      if (q.options.length > 0) contentObj.options = q.options.map(o => ({ label: o.label, text: o.text }));
      contentObj.answer = q.answer;
      if (q.analysis) contentObj.analysis = q.analysis;
      return {
        questionId: q.questionId,
        questionNo: idx + 1,
        score: q.score || 0,
        content: JSON.stringify(contentObj),
      };
    });
    try {
      await createExamPaper({
        paperName: examInfo.name.trim(),
        courseId: examInfo.courseId,
        totalScore,
        durationMinutes,
        startTime: examInfo.startTime,
        endTime: examInfo.endTime,
        targetStudents: targetStudents || undefined,
        questions,
      });
      showToastMsg("试卷创建成功");
      resetWizard();
      loadPapers();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "创建失败");
    }
  };

  const openEdit = async (id: number) => {
    setEditingPaperId(id);
    setSelectedQuestionIds([]);
    setFilterType(null);
    setFilterDifficulty(null);
    setFilterKnowledge(null);
    try {
      const paper = await getExamPaperById(id);
      setExamInfo({
        name: paper.paperName || "",
        courseId: paper.courseId ?? null,
        startTime: paper.startTime ? paper.startTime.slice(0, 16) : "",
        endTime: paper.endTime ? paper.endTime.slice(0, 16) : "",
      });
      editStudentIdsRef.current = paper.targetStudents
        ? paper.targetStudents.split(",").map(s => s.trim()).filter(Boolean).map(Number)
        : null;
      const qs = await getPaperQuestions(id);
      setEditable(qs.map(q => ({
        questionId: q.questionId,
        questionType: q.questionType || "",
        score: Number(q.score) || 0,
        stem: q.stem || "",
        options: (q.options && q.options.length > 0)
          ? q.options.map(o => ({ label: o.label, text: o.text }))
          : (isChoiceType(q.questionType) ? [{ label: "A", text: "" }, { label: "B", text: "" }, { label: "C", text: "" }, { label: "D", text: "" }] : []),
        answer: q.answer || "",
        analysis: q.analysis || "",
        knowledgePoints: q.knowledgePoints,
      })));
      setShowCreateWizard(true);
      setCreateStep(1);
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "加载试卷失败");
      setEditingPaperId(null);
    }
  };

  const handleUpdateExam = async () => {
    if (!examInfo.name.trim()) { showToastMsg("请输入试卷名称"); return; }
    if (!examInfo.courseId) { showToastMsg("请选择课程"); return; }
    if (!examInfo.startTime || !examInfo.endTime) { showToastMsg("请设置开始与结束时间"); return; }
    if (editable.length === 0) { showToastMsg("试卷至少需要一道题目"); return; }
    const start = new Date(examInfo.startTime).getTime();
    const end = new Date(examInfo.endTime).getTime();
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));
    const totalScore = editable.reduce((sum, q) => sum + (q.score || 0), 0);
    const targetStudents = selectedStudentIds.join(",");
    const questions = editable.map((q, idx) => {
      const contentObj: Record<string, unknown> = { stem: q.stem };
      if (q.options.length > 0) contentObj.options = q.options.map(o => ({ label: o.label, text: o.text }));
      contentObj.answer = q.answer;
      if (q.analysis) contentObj.analysis = q.analysis;
      return {
        questionId: q.questionId,
        questionNo: idx + 1,
        score: q.score || 0,
        content: JSON.stringify(contentObj),
      };
    });
    try {
      await updateExamPaper(editingPaperId!, {
        paperName: examInfo.name.trim(),
        courseId: examInfo.courseId,
        totalScore,
        durationMinutes,
        startTime: examInfo.startTime,
        endTime: examInfo.endTime,
        targetStudents: targetStudents || undefined,
        questions,
      });
      showToastMsg("试卷已保存");
      setEditingPaperId(null);
      resetWizard();
      loadPapers();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "保存失败");
    }
  };

  const openResults = (id: number) => {
    setSelectedExam(id);
    setResults(null);
    setLoadingResults(true);
    getExamResults(id)
      .then(data => setResults(data))
      .catch(e => { showToastMsg(e instanceof Error ? e.message : "加载结果失败"); setSelectedExam(null); })
      .finally(() => setLoadingResults(false));
  };

  const handlePublish = async (id: number) => {
    try { await publishExamPaper(id); showToastMsg("考试已发布"); loadPapers(); }
    catch (e) { showToastMsg(e instanceof Error ? e.message : "发布失败"); }
  };
  const handleClose = async (id: number) => {
    try { await closeExamPaper(id); showToastMsg("考试已结束"); loadPapers(); }
    catch (e) { showToastMsg(e instanceof Error ? e.message : "操作失败"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该试卷？")) return;
    try { await deleteExamPaper(id); showToastMsg("试卷已删除"); loadPapers(); }
    catch (e) { showToastMsg(e instanceof Error ? e.message : "删除失败"); }
  };

  const openGrading = (id: number) => {
    setGradingPaperId(id);
    setGradingPaper(null);
    setGradingLoading(true);
    setActiveStudentIdx(0);
    setGradeInputs({});
    getPaperGrading(id)
      .then(data => setGradingPaper(data))
      .catch(e => showToastMsg(e instanceof Error ? e.message : "加载批阅失败"))
      .finally(() => setGradingLoading(false));
  };

  const closeGrading = () => { setGradingPaperId(null); setGradingPaper(null); };

  const selectGradingStudent = (idx: number) => { setActiveStudentIdx(idx); setGradeInputs({}); };

  const updateGradeInput = (answerId: number, patch: Partial<{ score: string; comment: string }>) => {
    setGradeInputs(prev => ({ ...prev, [answerId]: { score: "", comment: "", ...(prev[answerId] || {}), ...patch } }));
  };

  const submitGrading = async (recordId: number) => {
    const grades: StudentGradeItem[] = Object.entries(gradeInputs)
      .filter(([, v]) => v.score !== "" && !Number.isNaN(Number(v.score)))
      .map(([answerId, v]) => ({ answerId: Number(answerId), score: Number(v.score), comment: v.comment || undefined }));
    if (grades.length === 0) { showToastMsg("请先对主观题评分"); return; }
    try {
      const total = await submitStudentGrade(recordId, grades);
      showToastMsg(`批阅完成，该生总分 ${total}`);
      setGradeInputs({});
      setGradingLoading(true);
      const data = await getPaperGrading(gradingPaperId!);
      setGradingPaper(data);
      setGradingLoading(false);
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "提交失败");
    }
  };

  const toggleSort = (key: "score" | "studentNo" | "submitTime") => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIndicator = (key: "score" | "studentNo" | "submitTime") => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const fmtTime = (t?: string) => (t ? t.replace("T", " ").slice(0, 16) : "—");

  const durationLabel = (start?: string, end?: string): string => {
    if (!start || !end) return "";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return "";
    const minutes = Math.round(ms / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `（${h}小时${m}分钟）`;
    if (h > 0) return `（${h}小时）`;
    return `（${m}分钟）`;
  };

  const courseCell = (p: ExamPaper) => {
    const c = courses.find(x => x.id === p.courseId);
    const name = c?.courseName || c?.className || p.courseName;
    if (!name) return "—";
    return (
      <>
        {name}
        {c?.semester && <span className="ml-1.5 text-xs text-muted-foreground">{c.semester}</span>}
      </>
    );
  };

  const selectedCourse = courses.find(c => c.id === examInfo.courseId);

  const renderPapers = (list: ExamPaper[]) => (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {list.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">暂无</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">试卷名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">课程</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">起止时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-medium">{p.paperName}</td>
                <td className="px-4 py-3 text-muted-foreground">{courseCell(p)}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtTime(p.startTime)} ~ {fmtTime(p.endTime)}{durationLabel(p.startTime, p.endTime)}</td>
                <td className="px-4 py-3">{statusTag(p.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.status === "DRAFT" && (
                      <>
                        <button onClick={() => openEdit(p.id)} className="inline-flex items-center gap-1 text-xs text-[#969BE7] hover:underline"><Edit2 size={14} />编辑</button>
                        <button onClick={() => handlePublish(p.id)} className="inline-flex items-center gap-1 text-xs text-[#57AE8F] hover:underline"><Play size={14} />发布</button>
                        <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-xs text-[#DD7373] hover:underline"><Trash2 size={14} />删除</button>
                      </>
                    )}
                    {p.status === "PUBLISHED" && (
                      <button onClick={() => handleClose(p.id)} className="inline-flex items-center gap-1 text-xs text-[#E8945C] hover:underline"><Clock size={14} />结束</button>
                    )}
                    {p.status === "ENDED" && (
                      <>
                        <button onClick={() => openGrading(p.id)} className="inline-flex items-center gap-1 text-xs text-[#969BE7] hover:underline"><FileSearch size={14} />批阅({p.ungradedCount ?? 0})</button>
                        <button onClick={() => openResults(p.id)} className="inline-flex items-center gap-1 text-xs text-[#969BE7] hover:underline"><Eye size={14} />结果</button>
                        <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-xs text-[#DD7373] hover:underline"><Trash2 size={14} />删除</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ===== 批阅视图 =====
  if (gradingPaperId !== null) {
    const students = gradingPaper?.students || [];
    const active = students[activeStudentIdx];
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}
        <button onClick={closeGrading} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> 返回试卷列表
        </button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{gradingPaper?.paperName || "批阅"} · 批阅</h2>
          <span className="text-sm text-muted-foreground">满分 {gradingPaper?.totalScore ?? 0}</span>
        </div>
        {gradingLoading ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
        ) : students.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">暂无学生交卷</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 bg-card rounded-lg border border-border p-2 space-y-1 max-h-[70vh] overflow-y-auto">
              {students.map((s, i) => (
                <button key={s.recordId} onClick={() => selectGradingStudent(i)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${i === activeStudentIdx ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50 border border-transparent"}`}>
                  <div className="font-medium">{s.studentName || `学生${s.studentId}`}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">{s.studentNo || "—"}</span>
                    {s.pendingCount > 0 ? <Tag color="orange">未批 {s.pendingCount}</Tag> : <Tag color="green">已批</Tag>}
                  </div>
                </button>
              ))}
            </div>
            <div className="lg:col-span-3 space-y-3">
              {active ? (
                <>
                  <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-sm font-semibold">{active.studentName}</span>
                      <span className="text-xs text-muted-foreground font-mono ml-2">{active.studentNo || "—"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">客观题得分 <span className="font-mono text-foreground">{active.objectiveScore ?? 0}</span></div>
                    <div className="text-xs text-muted-foreground">当前总分 <span className="font-mono text-foreground">{active.totalScore ?? 0}</span></div>
                    <div className="text-xs text-muted-foreground">交卷时间 <span className="font-mono">{fmtTime(active.submitTime)}</span></div>
                  </div>
                  {active.questions.map(q => {
                    const objective = isObjectiveType(q.questionType);
                    const graded = q.graded === 1;
                    const g = gradeInputs[q.answerId];
                    return (
                      <div key={q.answerId} className="bg-card rounded-lg border border-border p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">第 {q.questionNo} 题</span>
                          <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                          <span className="text-xs text-muted-foreground">满分 {q.maxScore ?? 0}</span>
                          {graded && <Tag color="green">已批</Tag>}
                        </div>
                        <p className="text-sm">{q.stem}</p>
                        {(q.options || []).length > 0 && (
                          <div className="space-y-0.5">
                            {(q.options || []).map(o => (
                              <p key={o.label} className="text-xs text-muted-foreground">{o.label}. {o.text}</p>
                            ))}
                          </div>
                        )}
                        <div className="text-xs">
                          <span className="text-muted-foreground">学生答案：</span>
                          <span className="font-medium">{q.studentAnswer || "（未作答）"}</span>
                        </div>
                        {objective ? (
                          <>
                            <div className="text-xs"><span className="text-muted-foreground">正确答案：</span><span className="font-medium text-[#57AE8F]">{q.correctAnswer || "—"}</span></div>
                            <div className="text-xs"><span className="text-muted-foreground">得分：</span><span className="font-medium">{q.score ?? 0}</span></div>
                          </>
                        ) : graded ? (
                          <div className="text-xs space-y-1">
                            <div><span className="text-muted-foreground">已评分数：</span><span className="font-medium">{q.score ?? 0}</span></div>
                            {q.comment && <div><span className="text-muted-foreground">评语：</span><span>{q.comment}</span></div>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 pt-1 flex-wrap">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">评分（0~{q.maxScore ?? 0}）</label>
                            <input type="number" min={0} max={q.maxScore ?? undefined} value={g?.score ?? ""} onChange={e => updateGradeInput(q.answerId, { score: e.target.value })} className="w-24 px-2 py-1 border border-border rounded-md text-sm" />
                            <input placeholder="评语（可选）" value={g?.comment ?? ""} onChange={e => updateGradeInput(q.answerId, { comment: e.target.value })} className="flex-1 min-w-[160px] px-2 py-1 border border-border rounded-md text-sm" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {active.pendingCount > 0 && (
                    <div className="flex justify-end">
                      <button onClick={() => submitGrading(active.recordId)} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">确认完成（汇总总分）</button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== 结果视图 =====
  if (selectedExam !== null) {
    const sortedStudents = [...(results?.studentScores || [])].sort((a, b) => {
      if (!sortKey) return 0;
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "studentNo") return (a.studentNo || "").localeCompare(b.studentNo || "") * dir;
      if (sortKey === "submitTime") {
        const ta = a.submitTime ? new Date(a.submitTime).getTime() : -Infinity;
        const tb = b.submitTime ? new Date(b.submitTime).getTime() : -Infinity;
        return (ta - tb) * dir;
      }
      return ((a.totalScore ?? 0) - (b.totalScore ?? 0)) * dir;
    });
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}
        <button onClick={() => setSelectedExam(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> 返回试卷列表
        </button>
        {loadingResults ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载结果中…</div>
        ) : !results ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">暂无结果</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard count={results.totalStudents ?? 0} label="应考人数" icon={Users} color="blue" />
              <StatCard count={results.submittedCount ?? 0} label="已交卷" icon={FileText} color="green" />
              <StatCard count={results.averageScore ?? 0} label="平均分" icon={BarChart2} color="orange" />
              <StatCard count={results.maxScore ?? 0} label="最高分" icon={TrendingUp} color="purple" />
              <StatCard count={`${results.passRate ?? 0}%`} label="及格率" icon={CheckCircle} color="green" />
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th onClick={() => toggleSort("studentNo")} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground">
                      <span className="inline-flex items-center gap-1">学号{sortIndicator("studentNo")}</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">姓名</th>
                    <th onClick={() => toggleSort("score")} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground">
                      <span className="inline-flex items-center gap-1">分数{sortIndicator("score")}</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                    <th onClick={() => toggleSort("submitTime")} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground">
                      <span className="inline-flex items-center gap-1">交卷时间{sortIndicator("submitTime")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">暂无学生</td></tr>
                  ) : (
                    sortedStudents.map(s => (
                      <tr key={s.studentId} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{s.studentNo || "—"}</td>
                        <td className="px-4 py-3 font-medium">{s.name || `学生${s.studentId}`}</td>
                        <td className="px-4 py-3 font-mono">{s.submitStatus === "SUBMITTED" ? (s.totalScore ?? 0) : 0}</td>
                        <td className="px-4 py-3">{s.submitStatus === "SUBMITTED" ? <Tag color="green">已交卷</Tag> : <Tag color="gray">未交卷</Tag>}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtTime(s.submitTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 题目统计 */}
            {results.questionStats && results.questionStats.length > 0 && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/50">
                  <h3 className="text-sm font-semibold text-foreground">题目统计</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">题号</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">题型</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">题干</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">知识点</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">作答人数</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">正确</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">错误</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">正确率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.questionStats.map((q, idx) => {
                        const rate = q.correctRate ?? 0;
                        const rateColor = rate >= 70 ? "text-[#57AE8F]" : rate >= 40 ? "text-[#E8945C]" : "text-[#DD7373]";
                        const typeMap: Record<string,string> = { SINGLE: "单选", MULTI: "多选", FILL: "填空", SHORT: "简答", COMPREHENSIVE: "综合" };
                        return (
                          <tr key={idx} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-xs">{q.questionNo ?? idx + 1}</td>
                            <td className="px-4 py-2.5"><Tag color="blue">{typeMap[q.questionType] ?? q.questionType ?? "—"}</Tag></td>
                            <td className="px-4 py-2.5 text-xs max-w-xs truncate" title={q.questionStem}>{q.questionStem ?? "—"}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{q.knowledgePoints ?? "—"}</td>
                            <td className="px-4 py-2.5 text-center font-mono">{q.answerCount ?? 0}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-[#57AE8F]">{q.correctCount ?? 0}</td>
                            <td className="px-4 py-2.5 text-center font-mono text-[#DD7373]">{q.wrongCount ?? 0}</td>
                            <td className={`px-4 py-2.5 text-center font-mono font-medium ${rateColor}`}>{rate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ===== 列表 + 建卷视图 =====
  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">考试管理</h2>
        <button onClick={openWizard} className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">
          <Plus size={16} /> 创建考试
        </button>
      </div>

      {showCreateWizard && (
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            {(editingPaperId ? ["基本信息", "编辑试卷"] : ["基本信息", "选择题目", "确认发布"]).map((label, idx) => {
              const step = idx + 1;
              const total = editingPaperId ? 2 : 3;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${createStep >= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{step}</div>
                  <span className={`text-sm ${createStep >= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                  {step < total && <div className="w-8 h-px bg-border" />}
                </div>
              );
            })}
          </div>

          {createStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1">试卷名称</label>
                <input value={examInfo.name} onChange={e => setExamInfo({ ...examInfo, name: e.target.value })} placeholder="如：第1章 单元测验" className="w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">选择课程</label>
                <div className="relative">
                  <button type="button" onClick={() => setCourseDropdownOpen(o => !o)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background flex items-center justify-between gap-2">
                    <span className="truncate">
                      {selectedCourse ? (
                        <>{selectedCourse.courseName || selectedCourse.className || `课程 ${selectedCourse.id}`}<span className="ml-1.5 text-xs text-muted-foreground">{selectedCourse.semester}</span></>
                      ) : (
                        <span className="text-muted-foreground">请选择课程</span>
                      )}
                    </span>
                    <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                  </button>
                  {courseDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setCourseDropdownOpen(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {courses.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground text-center">暂无课程</p>
                        ) : courses.map(c => (
                          <button key={c.id} type="button" onClick={() => { setExamInfo({ ...examInfo, courseId: c.id }); setCourseDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/40 ${examInfo.courseId === c.id ? "bg-primary/5" : ""}`}>
                            <span>{c.courseName || c.className || `课程 ${c.id}`}</span>
                            {c.semester && <span className="ml-1.5 text-xs text-muted-foreground">{c.semester}</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">开始时间</label>
                  <input type="datetime-local" value={examInfo.startTime} onChange={e => setExamInfo({ ...examInfo, startTime: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">结束时间</label>
                  <input type="datetime-local" value={examInfo.endTime} onChange={e => setExamInfo({ ...examInfo, endTime: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">选择学生</label>
                  {students.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <button type="button" onClick={selectAllStudents} className="text-[#969BE7] hover:underline">全选</button>
                      <button type="button" onClick={clearStudents} className="text-[#969BE7] hover:underline">取消全选</button>
                    </div>
                  )}
                </div>
                <div className="border border-border rounded-md p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                  {studentsLoading ? (
                    <p className="text-sm text-muted-foreground col-span-full py-2 text-center">加载学生中…</p>
                  ) : students.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full py-2 text-center">{examInfo.courseId ? "该课程暂无学生" : "请先选择课程"}</p>
                  ) : (
                    students.map(s => {
                      const checked = selectedStudentIds.includes(s.studentId);
                      return (
                        <label key={s.studentId} className={`flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1.5 transition-colors ${checked ? "bg-primary/5" : "hover:bg-accent/40"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.studentId)} />
                          <span className="truncate">{s.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{s.studentNo}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                {students.length > 0 && <p className="text-xs text-muted-foreground mt-1">已选 {selectedStudentIds.length} / {students.length} 名学生</p>}
              </div>
            </div>
          )}

          {createStep === 2 && !editingPaperId && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">题型筛选</label>
                  <div className="flex flex-wrap gap-1">
                    {questionTypes.map(t => (
                      <button key={t.value} onClick={() => setFilterType(filterType === t.value ? null : t.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${filterType === t.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">难度筛选</label>
                  <div className="flex flex-wrap gap-1">
                    {difficulties.map(d => (
                      <button key={d.value} onClick={() => setFilterDifficulty(filterDifficulty === d.value ? null : d.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${filterDifficulty === d.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">知识点筛选</label>
                  <select value={filterKnowledge ?? ""} onChange={e => setFilterKnowledge(e.target.value || null)} className="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background">
                    <option value="">全部知识点</option>
                    {knowledgeOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              {loadingQuestions ? (
                <p className="text-sm text-muted-foreground py-8 text-center">加载题库中…</p>
              ) : bankQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">该课程暂无题目，请先在题库中添加题目</p>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">没有符合条件的题目，请调整筛选条件</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredQuestions.map(q => {
                    const checked = selectedQuestionIds.includes(q.id);
                    const order = selectedQuestionIds.indexOf(q.id);
                    const c = parseContent((q as any).content);
                    return (
                      <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`border rounded-md p-3 cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={checked} readOnly className="mt-1" />
                          {checked && <span className="mt-0.5 text-xs font-semibold text-primary whitespace-nowrap">第{order + 1}题</span>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                              {diffTag(q.difficulty)}
                              <Tag color={q.aiGenerated === 1 ? "blue" : "orange"}>{q.aiGenerated === 1 ? "AI生成" : "手动录入"}</Tag>
                              {(q.knowledgePoints || "").split(/[,，、]/).filter(Boolean).slice(0, 2).map(k => <span key={k} className="text-xs text-muted-foreground">#{k.trim()}</span>)}
                            </div>
                            <p className="text-sm mt-1 line-clamp-2">{c.stem || stemOf(q)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="text-sm text-muted-foreground">已选 {selectedQuestionIds.length} 道题目（按勾选顺序自动编号）</div>
            </div>
          )}

          {createStep === (editingPaperId ? 2 : 3) && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">试卷：</span>{examInfo.name}</p>
                <p><span className="text-muted-foreground">课程：</span>{courses.find(c => c.id === examInfo.courseId)?.courseName || courses.find(c => c.id === examInfo.courseId)?.className || `课程 ${examInfo.courseId}`}</p>
                <p><span className="text-muted-foreground">学生：</span>{selectedStudentIds.length > 0 ? `已选 ${selectedStudentIds.length} 名学生` : "未选择"}</p>
                <p><span className="text-muted-foreground">时间：</span>{fmtTime(examInfo.startTime)} ~ {fmtTime(examInfo.endTime)}</p>
                <p><span className="text-muted-foreground">题目：</span>{editable.length} 道，共 {editable.reduce((s, q) => s + (q.score || 0), 0)} 分</p>
              </div>

              {editable.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无题目</p>
              ) : (
                editable.map((q, idx) => (
                  <div key={q.questionId} className="border border-border rounded-md p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">第 {idx + 1} 题</span>
                      <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                      <span className="text-xs text-muted-foreground">#{q.questionId}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button onClick={() => moveEditable(idx, -1)} disabled={idx === 0} className="p-1 border border-border rounded hover:bg-accent disabled:opacity-30"><ChevronUp size={14} /></button>
                        <button onClick={() => moveEditable(idx, 1)} disabled={idx === editable.length - 1} className="p-1 border border-border rounded hover:bg-accent disabled:opacity-30"><ChevronDown size={14} /></button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">分值</label>
                      <input type="number" value={q.score} onChange={e => updateEditable(idx, { score: Number(e.target.value) || 0 })} className="w-20 px-2 py-1 border border-border rounded-md text-sm" />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">题干</label>
                      <textarea value={q.stem} onChange={e => updateEditable(idx, { stem: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none" />
                    </div>

                    {isChoiceType(q.questionType) && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-muted-foreground block mb-1">选项</label>
                          <button onClick={() => addOption(idx)} className="text-xs text-[#969BE7] hover:underline">+ 添加选项</button>
                        </div>
                        {q.options.map((o, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-5 text-center">{o.label}.</span>
                            <input value={o.text} onChange={e => updateOptionText(idx, oi, e.target.value)} className="flex-1 px-2 py-1 border border-border rounded-md text-sm" />
                            <button onClick={() => removeOption(idx, oi)} className="p-1 text-[#DD7373] hover:bg-[#E88383]/20 rounded" title="删除选项"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">答案</label>
                      <input value={q.answer} onChange={e => updateEditable(idx, { answer: e.target.value })} placeholder={q.questionType === "MULTI" ? "多选答案，如 A,C" : "参考答案"} className="w-full px-2 py-1 border border-border rounded-md text-sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-border">
            <button onClick={() => { if (createStep === 1) resetWizard(); else setCreateStep(s => s - 1); }} className="px-3 py-2 rounded-md text-sm border border-border hover:bg-accent/50">
              {createStep === 1 ? "取消" : "上一步"}
            </button>
            {createStep < (editingPaperId ? 2 : 3) ? (
              <button onClick={goNext} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">下一步</button>
            ) : (
              <button onClick={editingPaperId ? handleUpdateExam : handleCreateExam} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">{editingPaperId ? "保存修改" : "创建并发布"}</button>
            )}
          </div>
        </div>
      )}

      {loadingPapers ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : papers.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center">
          <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">暂无试卷，点击右上角「创建考试」</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">草稿</h3>
            {renderPapers(papers.filter(p => p.status === "DRAFT"))}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">已发布 / 已结束</h3>
            {renderPapers(papers.filter(p => p.status === "PUBLISHED" || p.status === "ENDED"))}
          </div>
        </>
      )}
    </div>
  );
}

export default TeacherExamManagement;
