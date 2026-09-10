import { useState, useEffect, useRef } from "react";
import { CheckCircle, Plus, Upload, Brain, Target, FileText, Database, Search, BookMarked, X } from "lucide-react";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import { getQuestionList, getQuestionById, updateQuestion, deleteQuestion, createQuestion, updateQuestionLabels, generateQuestionAnalysis, QuestionBank } from "../../../services/questionBankService";
import { Page } from "../../types";
import { Tag } from "../../utils";

function TeacherQuestionBank({ onNav, setSelectedQuizQuestions, filterSourceType, setFilterSourceType, focusQuestion, onClearFocusQuestion }: {
  onNav: (p: Page) => void;
  setSelectedQuizQuestions: (ids: number[]) => void;
  filterSourceType: string | null;
  setFilterSourceType: (type: string | null) => void;
  focusQuestion?: { id: number; courseId?: number | null } | null;
  onClearFocusQuestion?: () => void;
}) {
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(filterSourceType || null);
  const [searchText, setSearchText] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<QuestionBank | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [form, setForm] = useState({
    questionType: "SINGLE",
    difficulty: "EASY",
    knowledgePoints: "",
    stem: "",
    options: [] as { label: string; text: string }[],
    answer: "",
    analysis: "",
  });
  const scrolledRef = useRef<number | null>(null);
  const [showManualQuestionModal, setShowManualQuestionModal] = useState(false);
  const [manualQuestion, setManualQuestion] = useState({
    courseId: "", questionType: "SINGLE", difficulty: "MEDIUM", stem: "",
    optionA: "", optionB: "", optionC: "", optionD: "", answer: "", analysis: "", knowledgePoints: "",
  });
  const [editingLabels, setEditingLabels] = useState<QuestionBank | null>(null);
  const [labelDraft, setLabelDraft] = useState({ knowledgePoints: "", difficulty: "MEDIUM" });

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  // 加载课程列表
  useEffect(() => {
    getMyCourses().then(data => setCourses(data || [])).catch(() => setCourses([]));
  }, []);

  // 加载题库列表（selectedCourseId 为 null 时加载全部）
  const loadQuestions = () => {
    setLoading(true);
    getQuestionList(1, 500, selectedCourseId ?? undefined)
      .then(data => setQuestions(data.records || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadQuestions, [selectedCourseId]);

  // 解析题目内容 JSON，提取题干
  const stemOf = (q: QuestionBank): string => {
    try {
      const raw = q.content || q.questionContent || "";
      const c = JSON.parse(raw);
      return c.stem || c.question || c.title || raw;
    } catch {
      return q.content || q.questionContent || "";
    }
  };

  // ─── 编辑题目 ────────────────────────────────────────────────────────────────
  const parseContent = (q: QuestionBank) => {
    let stem = "", answer = "", analysis = "", options: { label: string; text: string }[] = [];
    try {
      const raw = q.content || q.questionContent || "";
      const c = JSON.parse(raw);
      stem = c.stem || c.question || c.title || "";
      answer = c.answer ?? "";
      analysis = c.analysis || c.explanation || "";
      if (c.options) {
        if (Array.isArray(c.options)) {
          options = c.options.map((o: any) => ({ label: o.label || "", text: o.text || o.content || "" }));
        } else if (typeof c.options === "object") {
          options = Object.entries(c.options).map(([label, text]) => ({ label, text: String(text) }));
        }
      }
    } catch {
      stem = q.content || q.questionContent || "";
    }
    return { stem, answer, analysis, options };
  };

  const openEdit = (q: QuestionBank) => {
    const parsed = parseContent(q);
    setForm({
      questionType: q.questionType || "SINGLE",
      difficulty: q.difficulty || "EASY",
      knowledgePoints: q.knowledgePoints || "",
      stem: parsed.stem,
      options: parsed.options,
      answer: parsed.answer,
      analysis: parsed.analysis,
    });
    setEditing(q);
  };

  const handleEditClick = (q: QuestionBank) => {
    setHighlightId(q.id);
    openEdit(q);
  };

  const isChoice = form.questionType === "SINGLE" || form.questionType === "MULTI";

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { label: String.fromCharCode(65 + f.options.length), text: "" }] }));
  const updateOption = (i: number, patch: Partial<{ label: string; text: string }>) =>
    setForm(f => ({ ...f, options: f.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) }));
  const removeOption = (i: number) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!editing) return;
    if (!form.stem.trim()) { showToastMsg("题干不能为空"); return; }
    const contentObj: any = { stem: form.stem, answer: form.answer, analysis: form.analysis };
    if (isChoice) {
      const opts: Record<string, string> = {};
      form.options.forEach(o => { if (o.label.trim()) opts[o.label.trim()] = o.text; });
      contentObj.options = opts;
    }
    setSaving(true);
    try {
      await updateQuestion(editing.id, {
        questionType: form.questionType,
        difficulty: form.difficulty,
        knowledgePoints: form.knowledgePoints,
        content: JSON.stringify(contentObj),
      });
      showToastMsg("题目已更新");
      setEditing(null);
      loadQuestions();
    } catch {
      showToastMsg("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

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

  // 从题库体检跳转而来：定位并打开对应题目
  useEffect(() => {
    if (!focusQuestion?.id) return;
    if (focusQuestion.courseId) setSelectedCourseId(focusQuestion.courseId);
    getQuestionById(focusQuestion.id)
      .then(q => {
        setHighlightId(q.id);
        openEdit(q);
      })
      .catch(() => showToastMsg("未找到该题目"));
    onClearFocusQuestion?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusQuestion]);

  // 题目出现后滚动到可视区域
  useEffect(() => {
    if (highlightId == null) return;
    const el = document.getElementById(`question-${highlightId}`);
    if (el && scrolledRef.current !== highlightId) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledRef.current = highlightId;
    }
  }, [highlightId, questions]);

  const filteredQuestions = questions.filter(q => {
    if (selectedTopic && !(q.knowledgePoints || "").includes(selectedTopic)) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(q.questionType || "")) return false;
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(q.difficulty || "")) return false;
    if (selectedSourceType === "ai-generated" && q.aiGenerated !== 1) return false;
    if (selectedSourceType === "teacher-upload" && q.aiGenerated === 1) return false;
    if (searchText) {
      const stem = stemOf(q).toLowerCase();
      if (!stem.includes(searchText.toLowerCase())) return false;
    }
    return true;
  });

  const toggleQuestionSelection = (id: number) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleTypeSelection = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleDifficultySelection = (difficulty: string) => {
    setSelectedDifficulties(prev => prev.includes(difficulty) ? prev.filter(d => d !== difficulty) : [...prev, difficulty]);
  };

  const handleAddToQuiz = () => {
    setSelectedQuizQuestions(selectedQuestions);
    setFilterSourceType(null);
    onNav("teacher-exam");
    showToastMsg(`已选择 ${selectedQuestions.length} 道题目，正在跳转组卷...`);
  };

  const handleDelete = (id: number) => {
    if (!confirm("确定删除此题目？")) return;
    deleteQuestion(id).then(() => {
      showToastMsg("题目已删除");
      loadQuestions();
    }).catch(() => showToastMsg("删除失败"));
  };

  const openManualQuestionModal = () => {
    setManualQuestion({
      courseId: selectedCourseId ? String(selectedCourseId) : (courses[0] ? String(courses[0].id) : ""),
      questionType: "SINGLE", difficulty: "MEDIUM", stem: "", optionA: "", optionB: "", optionC: "", optionD: "", answer: "", analysis: "", knowledgePoints: "",
    });
    setShowManualQuestionModal(true);
  };

  const saveManualQuestion = async () => {
    const choice = ["SINGLE", "MULTI"].includes(manualQuestion.questionType);
    if (!manualQuestion.courseId || !manualQuestion.stem.trim() || !manualQuestion.answer.trim() || !manualQuestion.knowledgePoints.trim()) {
      showToastMsg("请填写课程、题干、答案和知识点");
      return;
    }
    if (choice && [manualQuestion.optionA, manualQuestion.optionB, manualQuestion.optionC, manualQuestion.optionD].some(v => !v.trim())) {
      showToastMsg("选择题请完整填写 A、B、C、D 四个选项");
      return;
    }
    try {
      await createQuestion({
        courseId: Number(manualQuestion.courseId),
        questionType: manualQuestion.questionType,
        difficulty: manualQuestion.difficulty,
        knowledgePoints: manualQuestion.knowledgePoints.trim(),
        aiGenerated: 0,
        status: "APPROVED",
        content: JSON.stringify({
          stem: manualQuestion.stem.trim(),
          options: choice ? { A: manualQuestion.optionA.trim(), B: manualQuestion.optionB.trim(), C: manualQuestion.optionC.trim(), D: manualQuestion.optionD.trim() } : {},
          answer: manualQuestion.answer.trim(),
          analysis: manualQuestion.analysis.trim(),
        }),
      });
      setShowManualQuestionModal(false);
      showToastMsg("题目已加入题库");
      loadQuestions();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "保存题目失败");
    }
  };

  const openLabelEditor = (question: QuestionBank) => {
    setEditingLabels(question);
    setLabelDraft({ knowledgePoints: question.knowledgePoints || "", difficulty: question.difficulty || "MEDIUM" });
  };

  const saveLabels = async () => {
    if (!editingLabels) return;
    if (!labelDraft.knowledgePoints.trim()) { showToastMsg("请填写知识点"); return; }
    try {
      await updateQuestionLabels(editingLabels.id, labelDraft.knowledgePoints.trim(), labelDraft.difficulty);
      setEditingLabels(null);
      showToastMsg("知识点和难度标签已更新");
      loadQuestions();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "更新标签失败");
    }
  };

  const handleUploadExam = () => {
    setUploadedFile("计算机网络考研真题.pdf");
    showToastMsg("文件上传成功");
  };

  const handleAiExtract = () => {
    setAiExtracting(true);
    setTimeout(() => {
      setAiExtracting(false);
      setExtractedCount(12);
      showToastMsg(`AI已从试卷中提取 ${extractedCount} 道题目`);
    }, 2000);
  };

  const handleAddToBank = () => {
    showToastMsg(`已将 ${extractedCount} 道题目添加到题库`);
    setShowUploadModal(false);
    setUploadedFile(null);
    setExtractedCount(0);
  };

  const questionTypes = [
    { value: "SINGLE", label: "单选题" },
    { value: "MULTI", label: "多选题" },
    { value: "FILL", label: "填空题" },
    { value: "SHORT", label: "简答题" },
    { value: "COMPREHENSIVE", label: "综合题" },
  ];

  const difficulties = [
    { value: "EASY", label: "简单" },
    { value: "MEDIUM", label: "中等" },
    { value: "HARD", label: "困难" },
  ];

  const sourceTypes = [
    { value: "ai-generated", label: "AI生成", icon: Brain },
    { value: "teacher-upload", label: "教师上传", icon: Upload },
  ];

  const typeLabel = (t?: string) => questionTypes.find(qt => qt.value === t)?.label || t || "未知";
  const difficultyLabel = (d?: string) => difficulties.find(dd => dd.value === d)?.label || d || "未知";

  const stats = {
    total: questions.length,
    choice: questions.filter(q => q.questionType === "SINGLE" || q.questionType === "MULTI").length,
    text: questions.filter(q => ["FILL", "SHORT", "COMPREHENSIVE"].includes(q.questionType || "")).length,
    ai: questions.filter(q => q.aiGenerated === 1).length,
  };

  // 知识点选项：从题库数据中提取
  const knowledgeOptions = Array.from(new Set(
    questions.flatMap(q => (q.knowledgePoints || "").split(/[,，、]/).map(s => s.trim()).filter(Boolean))
  )).sort((a, b) => a.localeCompare(b, "zh"));

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">题库管理</h2>
          {courses.length > 0 && (
            <select
              value={selectedCourseId ?? ""}
              onChange={e => {
                const v = e.target.value;
                setSelectedCourseId(v === "" ? null : Number(v));
              }}
              className="px-3 py-1.5 border border-border rounded-md text-sm bg-background"
            >
              <option value="">全部课程</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.courseName || c.className}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openManualQuestionModal} className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md text-sm hover:bg-primary/10">
            <Plus size={14} />手动录题
          </button>
          <button onClick={() => onNav("teacher-ai-quiz")} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
            <Plus size={14} />AI生成题目
          </button>
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
            <Upload size={14} />导入试卷
          </button>
          {selectedQuestions.length > 0 && (
            <button onClick={handleAddToQuiz} className="flex items-center gap-2 px-4 py-2 bg-[#74C2A0] text-white rounded-md text-sm hover:bg-[#5FAF8E]">
              <Plus size={14} />加入组卷 ({selectedQuestions.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "题库总量", value: stats.total, icon: BookMarked, color: "blue" },
          { label: "选择题", value: stats.choice, icon: Target, color: "green" },
          { label: "问答题", value: stats.text, icon: FileText, color: "purple" },
          { label: "AI生成", value: stats.ai, icon: Brain, color: "cyan" },
        ].map(item => (
          <div key={item.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color === "blue" ? "bg-[#969BE7]/25" : item.color === "green" ? "bg-[#74C2A0]/25" : item.color === "purple" ? "bg-[#969BE7]/25" : "bg-[#55AEC2]/25"}`}>
                <item.icon size={18} className={item.color === "blue" ? "text-[#969BE7]" : item.color === "green" ? "text-[#57AE8F]" : item.color === "purple" ? "text-[#969BE7]" : "text-[#55AEC2]"} />
              </div>
              <div>
                <p className="font-mono text-xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Search size={14} className="text-muted-foreground" />搜索题目
            </h3>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
              placeholder="输入题干关键词..."
            />
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">题型筛选</h3>
            <div className="flex flex-wrap gap-1">
              {questionTypes.map(t => (
                <button key={t.value} onClick={() => toggleTypeSelection(t.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedTypes.includes(t.value) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <button onClick={() => setSelectedTypes([])} className="mt-2 text-xs text-primary hover:underline">清除筛选</button>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">难度筛选</h3>
            <div className="flex flex-wrap gap-1">
              {difficulties.map(d => (
                <button key={d.value} onClick={() => toggleDifficultySelection(d.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedDifficulties.includes(d.value) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            {selectedDifficulties.length > 0 && (
              <button onClick={() => setSelectedDifficulties([])} className="mt-2 text-xs text-primary hover:underline">清除筛选</button>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">来源筛选</h3>
            <div className="space-y-1">
              <button onClick={() => { setSelectedSourceType(null); setFilterSourceType(null); }} className={`w-full text-left text-sm hover:bg-accent rounded px-3 py-2 flex items-center gap-2 ${!selectedSourceType ? "bg-primary/10 text-primary" : ""}`}>
                <Database size={12} />全部来源
              </button>
              {sourceTypes.map(s => (
                <button key={s.value} onClick={() => { setSelectedSourceType(selectedSourceType === s.value ? null : s.value); setFilterSourceType(selectedSourceType === s.value ? null : s.value); }} className={`w-full text-left text-sm hover:bg-accent rounded px-3 py-2 flex items-center gap-2 ${selectedSourceType === s.value ? "bg-primary/10 text-primary" : ""}`}>
                  <s.icon size={12} />{s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">知识点筛选</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {knowledgeOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无知识点数据</p>
              )}
              {knowledgeOptions.map(kp => (
                <button key={kp} onClick={() => setSelectedTopic(selectedTopic === kp ? null : kp)} className={`w-full text-left text-sm hover:bg-accent rounded px-2 py-1.5 ${selectedTopic === kp ? "bg-primary/10 text-primary" : ""}`}>
                  {kp}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 lg:flex lg:flex-col">
          <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col flex-1">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-sm">题目列表</h3>
                <span className="text-xs text-muted-foreground">共 {filteredQuestions.length} 道题目</span>
                {loading && <span className="text-xs text-primary">加载中...</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadQuestions} className="text-xs text-muted-foreground hover:text-primary">刷新</button>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto p-4 bg-background max-h-[600px] lg:max-h-none lg:flex-1 lg:min-h-0">
              {filteredQuestions.map(q => (
                <div key={q.id} id={`question-${q.id}`} className={`bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/40 transition-all ${highlightId === q.id ? "ring-2 ring-primary/40 border-primary/40" : ""}`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                    {q.knowledgePoints && <Tag color="gray">{q.knowledgePoints}</Tag>}
                    <Tag color={q.difficulty === "EASY" ? "green" : q.difficulty === "MEDIUM" ? "blue" : "red"}>{difficultyLabel(q.difficulty)}</Tag>
                    {q.aiGenerated === 1 && <Tag color="cyan"><Brain size={10} className="inline mr-1" />AI生成</Tag>}
                  </div>
                  <p className="text-sm leading-relaxed">{stemOf(q)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {q.createTime && <span>创建时间：{q.createTime.slice(0, 10)}</span>}
                    <span>使用次数：{q.usageCount || 0}</span>
                    {q.status && <span>状态：{q.status}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                      <input type="checkbox" checked={selectedQuestions.includes(q.id)} onChange={() => toggleQuestionSelection(q.id)} className="rounded" />
                      选择
                    </label>
                    <div className="flex-1" />
                    <button onClick={() => { toggleQuestionSelection(q.id); setTimeout(() => handleAddToQuiz(), 100); }} className="px-2.5 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 whitespace-nowrap">
                      加入组卷
                    </button>
                    <button onClick={() => handleEditClick(q)} className="px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-accent whitespace-nowrap">编辑</button>
                    <button onClick={() => openLabelEditor(q)} className="px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-accent whitespace-nowrap">编辑标签</button>
                    <button onClick={() => handleDelete(q.id)} className="px-2.5 py-1.5 text-xs text-[#DD7373] hover:bg-[#E88383]/20 rounded-md whitespace-nowrap">删除</button>
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && !loading && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <BookMarked size={32} className="mx-auto mb-3 opacity-50" />
                  <p>暂无符合条件的题目</p>
                  <button onClick={() => onNav("teacher-ai-quiz")} className="mt-3 text-primary hover:underline">去AI生成</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">上传试卷并提取题目</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadedFile(null); setExtractedCount(0); }}><X size={16} /></button>
            </div>
            <p className="text-xs text-muted-foreground">上传已有的试卷或练习题，AI会自动识别并提取题目到题库中</p>

            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${uploadedFile ? "border-primary bg-primary/5" : "border-border hover:border-primary"} cursor-pointer transition-colors`} onClick={handleUploadExam}>
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileText size={20} />
                  <span className="text-sm font-medium">{uploadedFile}</span>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium text-sm">拖拽文件到此处，或点击上传</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 .pdf, .doc, .docx 格式</p>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div className="space-y-4">
                <div className="bg-[#969BE7]/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#6E719E] mb-2">AI智能分析</h4>
                  <div className="space-y-2 text-xs text-[#969BE7]">
                    <div className="flex items-center justify-between">
                      <span>正在分析试卷内容...</span>
                      {aiExtracting && <div className="w-4 h-4 border-2 border-[#969BE7]/55 border-t-blue-700 rounded-full animate-spin" />}
                    </div>
                    {extractedCount > 0 && (
                      <>
                        <p>已识别题目类型：选择题 {Math.floor(extractedCount * 0.5)} 道，判断题 {Math.floor(extractedCount * 0.2)} 道，问答题 {Math.floor(extractedCount * 0.3)} 道</p>
                        <p>知识点分布：TCP/IP协议、HTTP协议、网络安全等</p>
                      </>
                    )}
                  </div>
                </div>

                {!aiExtracting && extractedCount === 0 && (
                  <button onClick={handleAiExtract} className="w-full py-3 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] flex items-center justify-center gap-2">
                    <Brain size={16} />AI提取题目
                  </button>
                )}

                {extractedCount > 0 && (
                  <div className="flex gap-3">
                    <button onClick={() => { setShowUploadModal(false); setUploadedFile(null); setExtractedCount(0); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
                    <button onClick={handleAddToBank} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">
                      添加 {extractedCount} 道题目到题库
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold">编辑题目 #{editing.id}</h3>
              <button onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">题型</label>
                  <select value={form.questionType} onChange={e => setForm(f => ({ ...f, questionType: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                    {questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">难度</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                    {difficulties.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">知识点（逗号分隔）</label>
                  <input type="text" value={form.knowledgePoints} onChange={e => setForm(f => ({ ...f, knowledgePoints: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="如：传输层/TCP协议" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">题干</label>
                <textarea value={form.stem} onChange={e => setForm(f => ({ ...f, stem: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y" />
              </div>

              {isChoice && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted-foreground">选项</label>
                    <button onClick={addOption} className="text-xs text-primary hover:underline">+ 添加选项</button>
                  </div>
                  <div className="space-y-2">
                    {form.options.map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={o.label} onChange={e => updateOption(i, { label: e.target.value })}
                          className="w-14 px-2 py-1.5 border border-border rounded-md text-sm text-center" placeholder="A" />
                        <input value={o.text} onChange={e => updateOption(i, { text: e.target.value })}
                          className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm" placeholder="选项内容" />
                        <button onClick={() => removeOption(i)} className="text-[#DD7373] hover:bg-[#E88383]/20 rounded p-1"><X size={14} /></button>
                      </div>
                    ))}
                    {form.options.length === 0 && <p className="text-xs text-muted-foreground">暂无选项，点击「添加选项」新增</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground mb-1">答案</label>
                <input type="text" value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm" placeholder={isChoice ? "如：A 或 A,C" : "参考答案"} />
              </div>

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
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50">
                {saving ? "保存中…" : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">手动录入题目</h3><button onClick={() => setShowManualQuestionModal(false)}><X size={16} /></button></div>
            {courses.length === 0 ? <p className="text-sm text-[#DD7373]">暂无可用课程，请先在班级管理中创建课程。</p> : <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={manualQuestion.courseId} onChange={e => setManualQuestion(p => ({ ...p, courseId: e.target.value }))} className="px-3 py-2 border border-border rounded-md text-sm"><option value="">选择课程</option>{courses.map(c => <option key={c.id} value={c.id}>{c.courseName || c.className}</option>)}</select>
                <select value={manualQuestion.questionType} onChange={e => setManualQuestion(p => ({ ...p, questionType: e.target.value }))} className="px-3 py-2 border border-border rounded-md text-sm">{questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                <select value={manualQuestion.difficulty} onChange={e => setManualQuestion(p => ({ ...p, difficulty: e.target.value }))} className="px-3 py-2 border border-border rounded-md text-sm">{difficulties.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
              </div>
              <textarea value={manualQuestion.stem} onChange={e => setManualQuestion(p => ({ ...p, stem: e.target.value }))} rows={3} placeholder="题干" className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none" />
              {["SINGLE", "MULTI"].includes(manualQuestion.questionType) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{(["A", "B", "C", "D"] as const).map(label => <input key={label} value={manualQuestion[`option${label}`]} onChange={e => setManualQuestion(p => ({ ...p, [`option${label}`]: e.target.value }))} placeholder={`选项 ${label}`} className="px-3 py-2 border border-border rounded-md text-sm" />)}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input value={manualQuestion.answer} onChange={e => setManualQuestion(p => ({ ...p, answer: e.target.value }))} placeholder={manualQuestion.questionType === "MULTI" ? "答案，如 A,B" : "参考答案"} className="px-3 py-2 border border-border rounded-md text-sm" /><input value={manualQuestion.knowledgePoints} onChange={e => setManualQuestion(p => ({ ...p, knowledgePoints: e.target.value }))} placeholder="知识点，如 网络层/路由协议" className="px-3 py-2 border border-border rounded-md text-sm" /></div>
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
              <div className="flex justify-end gap-3"><button onClick={() => setShowManualQuestionModal(false)} className="px-4 py-2 border border-border rounded-md text-sm">取消</button><button onClick={saveManualQuestion} className="px-4 py-2 bg-primary text-white rounded-md text-sm">保存题目</button></div>
            </>}
          </div>
        </div>
      )}

      {editingLabels && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">编辑题目标签</h3><button onClick={() => setEditingLabels(null)}><X size={16} /></button></div>
            <p className="text-sm text-muted-foreground line-clamp-2">{stemOf(editingLabels)}</p>
            <label className="block text-sm">知识点（支持一级/二级，如：网络层/路由协议）<input value={labelDraft.knowledgePoints} onChange={e => setLabelDraft(p => ({ ...p, knowledgePoints: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border rounded-md" /></label>
            <label className="block text-sm">难度<select value={labelDraft.difficulty} onChange={e => setLabelDraft(p => ({ ...p, difficulty: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border rounded-md">{difficulties.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
            <div className="flex justify-end gap-3"><button onClick={() => setEditingLabels(null)} className="px-4 py-2 border border-border rounded-md text-sm">取消</button><button onClick={saveLabels} className="px-4 py-2 bg-primary text-white rounded-md text-sm">保存标签</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherQuestionBank;
