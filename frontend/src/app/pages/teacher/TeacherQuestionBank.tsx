import { useState, useEffect } from "react";
import { CheckCircle, Plus, Upload, Brain, Target, FileText, Database, Search, BookMarked, X } from "lucide-react";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import { getQuestionList, deleteQuestion, QuestionBank } from "../../../services/questionBankService";
import { Page } from "../../types";
import { Tag } from "../../utils";

function TeacherQuestionBank({ onNav, setSelectedQuizQuestions, filterSourceType, setFilterSourceType }: {
  onNav: (p: Page) => void;
  setSelectedQuizQuestions: (ids: number[]) => void;
  filterSourceType: string | null;
  setFilterSourceType: (type: string | null) => void;
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

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
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
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {filteredQuestions.map(q => (
                <div key={q.id} className="px-4 py-4 hover:bg-accent/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                        {q.knowledgePoints && <Tag color="gray">{q.knowledgePoints}</Tag>}
                        <Tag color={q.difficulty === "EASY" ? "green" : q.difficulty === "MEDIUM" ? "blue" : "red"}>{difficultyLabel(q.difficulty)}</Tag>
                        {q.aiGenerated === 1 && <Tag color="cyan"><Brain size={10} className="inline mr-1" />AI生成</Tag>}
                      </div>
                      <p className="text-sm leading-relaxed">{stemOf(q)}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {q.createTime && <span>创建时间：{q.createTime.slice(0, 10)}</span>}
                        <span>使用次数：{q.usageCount || 0}</span>
                        {q.status && <span>状态：{q.status}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedQuestions.includes(q.id)} onChange={() => toggleQuestionSelection(q.id)} className="rounded" />
                      <button onClick={() => { toggleQuestionSelection(q.id); setTimeout(() => handleAddToQuiz(), 100); }} className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20">
                        加入组卷
                      </button>
                      <button className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent">编辑</button>
                      <button onClick={() => handleDelete(q.id)} className="px-3 py-1.5 text-xs text-[#DD7373] hover:bg-[#E88383]/20 rounded-md">删除</button>
                    </div>
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
    </div>
  );
}

export default TeacherQuestionBank;
