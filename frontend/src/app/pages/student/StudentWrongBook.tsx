import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Plus, Brain, X } from "lucide-react";
import { getStudentCourses, getStudentWrongQuestions, createStudentWrongQuestion, analyzeWrongQuestion, generateSimilarQuestions, StudentCourse, StudentWrongQuestion } from "../../../services/studentService";
import { Tag } from "../../utils";

function StudentWrongBook() {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceQuestionsList, setPracticeQuestionsList] = useState<any[]>([]);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [showAddWrongModal, setShowAddWrongModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [apiWrongQuestions, setApiWrongQuestions] = useState<any[]>([]);
  const [loadingWrong, setLoadingWrong] = useState(true);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [savingManualWrong, setSavingManualWrong] = useState(false);
  const [manualWrong, setManualWrong] = useState({
    question: "函数 f(x)=x² 在 x=2 处的导数是多少？",
    options: "A. 2\nB. 4\nC. 6\nD. 8",
    correctAnswer: "B",
    studentAnswer: "A",
    knowledgePoints: "高等数学,导数",
    remark: "误把 x² 的导数记成了 x。",
  });

  const formatMathText = (value: unknown) => String(value ?? "")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\cdot|\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\^\{([^{}]+)\}/g, "^$1")
    .replace(/_\{([^{}]+)\}/g, "_$1")
    .replace(/\\([a-zA-Z]+)/g, "$1");

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      } else setSelectedCourseId(null);
    }).catch(() => {
      setStudentCourses([]);
      setSelectedCourseId(null);
    });
  }, []);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    setLoadingWrong(true);
    getStudentWrongQuestions(selectedCourseId).then(data => {
      if (data && data.length > 0) {
        setApiWrongQuestions(data.map(mapWrongQuestion));
      } else {
        setApiWrongQuestions([]);
      }
    }).catch(() => setApiWrongQuestions([])).finally(() => setLoadingWrong(false));
  }, [selectedCourseId]);

  const mapWrongQuestion = (q: StudentWrongQuestion) => ({
    id: q.id,
    course: q.courseName || selectedCourse?.courseName || "个人错题本（测试）",
    chapter: q.knowledgePoints || "未知",
    section: q.knowledgePoints || "",
    question: formatMathText((() => { try { return JSON.parse(q.questionContent).stem || q.questionContent; } catch { return q.questionContent; } })()),
    type: "choice",
    options: (() => { try { const options = JSON.parse(q.questionContent).options || {}; return (Array.isArray(options) ? options.map((o: any) => o.text || o) : Object.values(options)).map(formatMathText); } catch { return []; } })(),
    myAnswer: formatMathText(q.studentAnswer || "未作答"),
    correctAnswer: formatMathText(q.correctAnswer || "未记录"),
    explain: formatMathText(q.analysis || "暂无解析，可点击“AI错因分析”生成。"),
  });

  const saveManualWrongQuestion = async () => {
    if (!manualWrong.question.trim() || !manualWrong.knowledgePoints.trim()) {
      alert("请填写题目内容和知识点");
      return;
    }
    setSavingManualWrong(true);
    try {
      const saved = await createStudentWrongQuestion({ courseId: selectedCourseId, ...manualWrong });
      setApiWrongQuestions(items => [mapWrongQuestion(saved), ...items]);
      setShowAddWrongModal(false);
      alert("错题已添加，可立即测试 AI 错因分析和相似题生成");
    } catch {
      alert("错题保存失败，请确认后端已重启并已登录学生账号");
    } finally {
      setSavingManualWrong(false);
    }
  };

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
    setSelectedChapter(null);
    setSelectedSection(null);
  };

  const toggleCourse = (name: string) => {
    setExpandedCourses(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allQuestions = apiWrongQuestions;
  const wrongBookCourseName = selectedCourse?.courseName || "个人错题本（测试）";
  const wrongBookCategories = useMemo(() => {
    const chapterMap = new Map<string, Set<string>>();
    allQuestions
      .filter(q => !wrongBookCourseName || q.course === wrongBookCourseName)
      .forEach(q => {
        const chapter = q.chapter || "未知";
        const section = q.section || chapter;
        if (!chapterMap.has(chapter)) {
          chapterMap.set(chapter, new Set<string>());
        }
        chapterMap.get(chapter)!.add(section);
      });

    return [{
      name: wrongBookCourseName || "当前课程",
      chapters: Array.from(chapterMap.entries()).map(([name, sections]) => ({
        name,
        sections: Array.from(sections),
      })),
    }];
  }, [allQuestions, wrongBookCourseName]);

  const filteredQuestions = allQuestions.filter(q => {
    if (wrongBookCourseName && q.course !== wrongBookCourseName) return false;
    if (!selectedChapter && !selectedSection) return true;
    if (selectedChapter && q.chapter !== selectedChapter) return false;
    if (selectedSection && q.section !== selectedSection) return false;
    return true;
  });

  const startPractice = (question: any) => {
    setPracticeQuestionsList([
      { ...question, isOriginal: true },
      {
        id: 999, type: "choice", topic: question.chapter,
        question: `与 "${question.section}" 相关的练习题：求微分方程 y' - 2y = 4 的通解？`,
        options: ["y = Ce^{2x} - 2", "y = Ce^{-2x} + 2", "y = Ce^{2x} + 2", "y = Ce^{-2x} - 2"],
        answer: 0, explain: "一阶线性微分方程，积分因子 e^{-2x}，求解得 y = Ce^{2x} - 2。",
      },
    ]);
    setPracticeMode(true);
    setPracticeIdx(0);
    setPracticeAnswers({});
  };

  const handlePracticeAnswer = async (qIdx: number, answer: number) => {
    setPracticeAnswers(prev => ({ ...prev, [qIdx]: answer }));
    const question = practiceQuestionsList[qIdx];
    if (!question || question.isOriginal || answer === question.answer) return;
    try {
      const options = (question.options || []).map((option: unknown, index: number) =>
        `${String.fromCharCode(65 + index)}. ${option}`).join("\n");
      const saved = await createStudentWrongQuestion({
        courseId: selectedCourseId,
        question: question.question,
        options,
        correctAnswer: String.fromCharCode(65 + question.answer),
        studentAnswer: String.fromCharCode(65 + answer),
        knowledgePoints: question.knowledgePoints || selectedQuestion?.chapter || "AI 相似题",
        remark: "AI 相似题练习答错，已自动加入错题本。",
        source: "AI_GENERATE",
      });
      setApiWrongQuestions(items => [mapWrongQuestion(saved), ...items]);
    } catch {
      alert("答题结果已记录，但自动加入错题本失败，请稍后重试");
    }
  };

  const requestSimilarQuestions = async (question: any) => {
    if (!question) {
      alert("请先选择一道错题");
      return;
    }
    setAiGenerating(true);
    setAiGeneratedQuestions([]);
    try {
      const questions = await generateSimilarQuestions(question.id);
      setAiGeneratedQuestions(questions.map((q: any, index: number) => ({
        id: index,
        question: formatMathText(q.stem),
        options: Object.values(q.options || {}).map(formatMathText),
        answer: typeof q.answer === "string" && /^[A-D]$/i.test(q.answer.trim()) ? q.answer.trim().toUpperCase().charCodeAt(0) - 65 : 0,
        explain: formatMathText(q.explanation),
        knowledgePoints: (q.knowledgeTags || []).join(",") || selectedQuestion?.chapter || "AI 相似题",
      })));
    } catch {
      alert("相似题生成失败，请稍后重试");
    } finally {
      setAiGenerating(false);
    }
  };

  const requestAnalysis = async () => {
    if (!selectedQuestion) return;
    setAnalysisLoading(true);
    try {
      const analysis = await analyzeWrongQuestion(selectedQuestion.id);
      setSelectedQuestion((current: any) => current ? { ...current, explain: analysis } : null);
      setApiWrongQuestions(items => items.map(item => item.id === selectedQuestion.id ? { ...item, explain: analysis } : item));
    } catch {
      alert("错因分析生成失败，请稍后重试");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">错题本</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">选择课程</span>
            <div className="relative">
              <select value={selectedCourseId || ""} onChange={e => e.target.value && handleCourseChange(parseInt(e.target.value))}
                className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                {studentCourses.length === 0 && <option value="">个人错题本（测试模式）</option>}
                {studentCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.courseName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">共 {filteredQuestions.length} 道错题</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddWrongModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-sm rounded-md hover:bg-accent">
              <Plus size={14} />手动添加
            </button>
            <button onClick={() => { setShowAIGenerateModal(true); setAiGeneratedQuestions([]); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-[#7F84D6]">
              <Brain size={14} />AI生成相似题
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">知识点筛选</h3>
            <div className="space-y-2">
            {wrongBookCategories.map(course => (
              <div key={course.name}>
                <button onClick={() => toggleCourse(course.name)} className="w-full flex items-center justify-between text-left text-sm hover:bg-accent rounded px-2 py-1">
                  <span>{course.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${expandedCourses[course.name] ? "rotate-180" : ""}`} />
                </button>
                {expandedCourses[course.name] && (
                  <div className="ml-2 mt-1 space-y-1">
                    {course.chapters.map(chapter => (
                      <div key={chapter.name}>
                        <button onClick={() => {
                          toggleChapter(`${course.name}-${chapter.name}`);
                          setSelectedChapter(chapter.name);
                          setSelectedSection(null);
                        }} className={`w-full flex items-center justify-between text-left text-xs hover:bg-accent rounded px-2 py-1 ${selectedChapter === chapter.name ? "bg-primary/10 text-primary" : ""}`}>
                          <span>{chapter.name}</span>
                          <ChevronDown size={12} className={`transition-transform ${expandedChapters[`${course.name}-${chapter.name}`] ? "rotate-180" : ""}`} />
                        </button>
                        {expandedChapters[`${course.name}-${chapter.name}`] && (
                          <div className="ml-2 mt-1 space-y-1">
                            {chapter.sections.map(section => (
                              <button key={section} onClick={() => setSelectedSection(selectedSection === section ? null : section)}
                                className={`w-full text-left text-xs hover:bg-accent rounded px-2 py-1 ${selectedSection === section ? "bg-primary/10 text-primary" : ""}`}>
                                {section}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {wrongBookCategories[0].chapters.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">暂无可筛选知识点</p>
            )}
          </div>
          {(selectedChapter || selectedSection) && (
            <button onClick={() => { setSelectedChapter(null); setSelectedSection(null); }} className="mt-4 w-full py-2 text-xs border border-border rounded hover:bg-accent">
              清除筛选
            </button>
          )}
        </div>

        <div className="lg:col-span-3 bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-medium text-sm">错题列表</h3>
          </div>
          <div className="divide-y divide-border">
            {loadingWrong ? (
              <p className="text-center text-sm text-muted-foreground py-8">错题加载中...</p>
            ) : filteredQuestions.map(q => (
              <div key={q.id} className="p-4 hover:bg-accent/30 cursor-pointer" onClick={() => setSelectedQuestion(q)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color="blue">{q.course}</Tag>
                      <Tag color="gray">{q.chapter}</Tag>
                      <Tag color="green">{q.type === "choice" ? "选择题" : "判断题"}</Tag>
                    </div>
                    <p className="text-sm line-clamp-2">{q.question}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span className="text-[#DD7373]">我的答案：{q.myAnswer}</span>
                      <span className="text-[#57AE8F]">正确答案：{q.correctAnswer}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedQuestion(q); setShowAIGenerateModal(true); requestSimilarQuestions(q); }} className="flex-shrink-0 px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-[#7F84D6]">
                    练习相似题
                  </button>
                </div>
              </div>
            ))}
            {!loadingWrong && filteredQuestions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">暂无错题</p>
            )}
          </div>
        </div>
      </div>

      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag color="blue">{selectedQuestion.course}</Tag>
                <Tag color="gray">{selectedQuestion.chapter}</Tag>
                <Tag color="green">{selectedQuestion.type === "choice" ? "选择题" : "判断题"}</Tag>
              </div>
              <button onClick={() => setSelectedQuestion(null)}><X size={16} /></button>
            </div>
            <p className="font-medium text-sm">{formatMathText(selectedQuestion.question)}</p>
            {selectedQuestion.options.length > 0 && <div className="space-y-2">
              {selectedQuestion.options.map((opt, i) => <div key={i} className="px-4 py-3 rounded-md text-sm bg-muted">{String.fromCharCode(65 + i)}. {formatMathText(opt)}</div>)}
            </div>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="rounded-md bg-[#E88383]/20 p-3 text-[#DD7373]">我的答案：{formatMathText(selectedQuestion.myAnswer)}</p>
              <p className="rounded-md bg-[#74C2A0]/20 p-3 text-[#57AE8F]">正确答案：{formatMathText(selectedQuestion.correctAnswer)}</p>
            </div>
            <div className="bg-[#969BE7]/20 rounded-lg p-4">
              <p className="text-xs font-medium text-[#969BE7] mb-1">解析</p>
              <p className="text-sm text-[#969BE7]">{formatMathText(selectedQuestion.explain)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={analysisLoading} onClick={requestAnalysis} className="py-2 border border-primary text-primary rounded-md text-sm hover:bg-primary/10 disabled:opacity-50">{analysisLoading ? "分析中..." : "AI错因分析"}</button>
              <button onClick={() => { setShowAIGenerateModal(true); requestSimilarQuestions(selectedQuestion); }} className="py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">练习相似题</button>
            </div>
          </div>
        </div>
      )}

      {practiceMode && practiceQuestionsList.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">相似题练习</h3>
              <button onClick={() => setPracticeMode(false)} className="text-sm text-muted-foreground hover:text-foreground">退出练习</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">第 {practiceIdx + 1} / {practiceQuestionsList.length} 题</span>
              <div className="flex-1 bg-muted rounded-full h-1">
                <div className="bg-primary h-1 rounded-full" style={{ width: `${((practiceIdx + 1) / practiceQuestionsList.length) * 100}%` }} />
              </div>
            </div>

            <div>
              <p className="font-medium text-sm mb-3">{formatMathText(practiceQuestionsList[practiceIdx].question)}</p>
              <div className="space-y-2">
                {practiceQuestionsList[practiceIdx].options.map((opt, i) => {
                  const answered = practiceAnswers[practiceIdx] !== undefined;
                  let cls = "border border-border hover:border-primary text-sm";
                  if (answered) {
                    if (i === practiceQuestionsList[practiceIdx].answer) cls = "border border-[#93D4BC] bg-[#74C2A0]/20 text-[#57AE8F] text-sm";
                    else if (i === practiceAnswers[practiceIdx] && practiceAnswers[practiceIdx] !== practiceQuestionsList[practiceIdx].answer) cls = "border border-[#E8909A] bg-[#E88383]/20 text-[#DD7373] text-sm";
                    else cls = "border border-border text-muted-foreground text-sm";
                  }
                  return (
                    <button key={i} onClick={() => !answered && handlePracticeAnswer(practiceIdx, i)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${cls} ${!answered ? "cursor-pointer" : "cursor-default"}`}>
                      {String.fromCharCode(65 + i)}. {formatMathText(opt)}
                    </button>
                  );
                })}
              </div>
              {practiceAnswers[practiceIdx] !== undefined && (
                <div className="mt-3 bg-[#969BE7]/20 rounded-lg p-4">
                  <p className="text-xs font-medium text-[#969BE7] mb-1">解析</p>
                  <p className="text-sm text-[#969BE7]">{formatMathText(practiceQuestionsList[practiceIdx].explain)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPracticeMode(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              {practiceAnswers[practiceIdx] !== undefined && practiceIdx < practiceQuestionsList.length - 1 && (
                <button onClick={() => setPracticeIdx(i => i + 1)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">下一题</button>
              )}
              {practiceAnswers[practiceIdx] !== undefined && practiceIdx === practiceQuestionsList.length - 1 && (
                <button onClick={() => setPracticeMode(false)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">完成练习</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddWrongModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">手动添加错题</h3>
              <button onClick={() => setShowAddWrongModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">题目内容</label>
                <textarea value={manualWrong.question} onChange={e => setManualWrong(value => ({ ...value, question: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm h-24 resize-none" placeholder="请输入题目内容..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">选项（每行一个）</label>
                <textarea value={manualWrong.options} onChange={e => setManualWrong(value => ({ ...value, options: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none" placeholder="A. 选项一&#10;B. 选项二&#10;C. 选项三&#10;D. 选项四" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">正确答案</label>
                <select value={manualWrong.correctAnswer} onChange={e => setManualWrong(value => ({ ...value, correctAnswer: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">我的错误答案</label>
                <select value={manualWrong.studentAnswer} onChange={e => setManualWrong(value => ({ ...value, studentAnswer: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">知识点/章节</label>
                <input type="text" value={manualWrong.knowledgePoints} onChange={e => setManualWrong(value => ({ ...value, knowledgePoints: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="例如：微积分 - 导数" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">备注/理解难点</label>
                <textarea value={manualWrong.remark} onChange={e => setManualWrong(value => ({ ...value, remark: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm h-16 resize-none" placeholder="记录自己做错的原因或理解难点..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddWrongModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button disabled={savingManualWrong} onClick={saveManualWrongQuestion} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50">{savingManualWrong ? "保存中..." : "保存错题"}</button>
            </div>
          </div>
        </div>
      )}

      {showAIGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">AI生成相似题</h3>
              <button onClick={() => { setShowAIGenerateModal(false); setAiGenerating(false); }}><X size={16} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {aiGenerating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary animate-spin" />
                  <p className="text-sm">AI正在分析错题并生成相似题目...</p>
                </div>
              ) : aiGeneratedQuestions.length > 0 ? (
                <div className="space-y-4">
                  <button onClick={() => {
                    setPracticeQuestionsList(aiGeneratedQuestions);
                    setPracticeIdx(0);
                    setPracticeAnswers({});
                    setShowAIGenerateModal(false);
                    setPracticeMode(true);
                  }} className="w-full py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">开始相似题练习</button>
                  {aiGeneratedQuestions.map((q, i) => (
                    <div key={i} className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag color="cyan">AI生成</Tag>
                        <span className="text-xs text-muted-foreground">第{i + 1}题</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{formatMathText(q.question)}</p>
                      <div className="space-y-1">
                        {q.options.map((opt: string, j: number) => (
                          <div key={j} className="px-3 py-2 bg-muted rounded text-xs">
                            {String.fromCharCode(65 + j)}. {formatMathText(opt)}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 bg-[#969BE7]/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-[#969BE7]">答案：{String.fromCharCode(65 + q.answer)}</p>
                        <p className="text-xs text-[#969BE7] mt-1">{formatMathText(q.explain)}</p>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">在练习中答错后，会自动加入错题本。</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">选择一个错题，AI将根据该题的知识点生成相似题目，帮助您巩固薄弱环节。</p>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-sm font-medium mb-3">选择生成依据</h4>
                    <div className="space-y-2">
                      <button disabled={!selectedQuestion && allQuestions.length === 0} onClick={() => requestSimilarQuestions(selectedQuestion || allQuestions[0])} className="w-full text-left px-3 py-2 border border-border rounded-md text-sm hover:bg-accent disabled:opacity-50">
                        根据{selectedQuestion ? "当前错题" : "第一道错题"}的知识点生成相似题
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentWrongBook;
