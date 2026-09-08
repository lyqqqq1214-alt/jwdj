import React, { useState } from "react";
import { CheckCircle, FileText, Upload, Zap, GripVertical, Brain, Send, Database, X } from "lucide-react";
import { generateQuestions } from "../../../services/aiQuizService";
import { Page } from "../../types";
import { Tag } from "../../utils";
import { questionCategories, aiGeneratedQuestions } from "../../constants";

function TeacherAIQuiz({ onNav }: { onNav: (p: Page) => void }) {
  const [params, setParams] = useState({
    topics: [] as string[],
    types: [] as string[],
    count: 5,
    difficulty: "中等",
    socrates: false,
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>(aiGeneratedQuestions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [uploadedReference, setUploadedReference] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    classes: [] as string[],
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedQuestionsForExam, setSelectedQuestionsForExam] = useState<number[]>([]);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const handleGenerate = async () => {
    if (params.topics.length === 0 || params.types.length === 0) {
      showToastMsg("请至少选择一个知识点和一种题型");
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await generateQuestions({
        knowledgePoints: params.topics,
        questionType: params.types.join("、"),
        count: params.count,
        difficulty: params.difficulty,
        socraticMode: params.socrates,
      });
      const questions = (generated || []).map((q: any, index: number) => {
        const optionEntries = Object.entries(q.options || {});
        const questionType = q.questionType || params.types[0] || "简答";
        const isChoice = questionType.includes("选");
        const isMultiple = questionType.includes("多选");
        const answerKeys = String(q.answer || "").toUpperCase().match(/[A-Z]/g) || [];
        const answerIndexes = [...new Set(answerKeys
          .map(key => optionEntries.findIndex(([optionKey]) => optionKey.toUpperCase() === key))
          .filter(optionIndex => optionIndex >= 0))];
        const answerIndex = optionEntries.findIndex(([key, value]) => key === q.answer || value === q.answer);
        return {
          id: Date.now() + index,
          type: isMultiple ? "multiple" : isChoice ? "choice" : questionType === "填空" ? "fill" : "text",
          questionType,
          topic: (q.knowledgeTags || params.topics).join("、"),
          difficulty: params.difficulty,
          professionalScore: 100,
          status: "pending" as const,
          question: q.stem,
          options: isChoice ? optionEntries.map(([, value]) => String(value)) : [],
          answer: isMultiple ? answerIndexes : isChoice ? (answerIndex >= 0 ? answerIndex : 0) : q.answer,
          explain: q.explanation,
          socraticQuestions: q.socraticQuestions || [],
        };
      });
      setGeneratedQuestions(questions);
      setSelectedQuestionsForExam([]);
      showToastMsg(`成功生成 ${questions.length} 道题目`);
    } catch (error) {
      showToastMsg(error instanceof Error ? error.message : "无法连接本地大模型服务");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (id: number) => {
    setGeneratedQuestions(prev => prev.map(q => q.id === id ? { ...q, status: "approved" as const } : q));
    setAddedCount(prev => prev + 1);
    showToastMsg("题目已审核通过并入库");
  };

  const handleBatchApprove = () => {
    const pendingCount = generatedQuestions.filter(q => q.status !== "approved").length;
    setGeneratedQuestions(prev => prev.map(q => ({ ...q, status: "approved" as const })));
    setAddedCount(pendingCount);
    setShowAddedModal(true);
    showToastMsg(`已批量通过 ${pendingCount} 道题目`);
  };

  const handleReject = (id: number) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
    showToastMsg("题目已驳回丢弃");
  };

  const handleUploadReference = () => {
    setUploadedReference("期中考试真题.pdf");
    showToastMsg("已上传参考试卷");
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newList = [...generatedQuestions];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);
    setGeneratedQuestions(newList);
    setDraggedIndex(null);
  };

  const handleQuestionSelect = (id: number) => {
    setSelectedQuestionsForExam(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePublishExam = () => {
    if (!examForm.name || !examForm.startTime || !examForm.endTime || examForm.classes.length === 0) {
      showToastMsg("请填写完整考试信息");
      return;
    }
    setShowPublishModal(false);
    showToastMsg(`考试「${examForm.name}」已发布，共 ${selectedQuestionsForExam.length} 道题目`);
  };

  const pendingQuestions = generatedQuestions.filter(q => q.status !== "approved");
  const approvedQuestions = generatedQuestions.filter(q => q.status === "approved");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="lg:col-span-1 bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium text-sm">题目生成参数</h3>
        
        <div>
          <label className="text-xs font-medium text-muted-foreground">知识点范围</label>
          <select multiple value={params.topics} onChange={e => setParams({ ...params, topics: Array.from(e.currentTarget.selectedOptions, option => option.value) })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm h-24">
            {questionCategories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">题型</label>
          <div className="mt-2 space-y-1">
            {["单选", "多选", "填空", "简答", "综合"].map(t => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={params.types.includes(t)} onChange={e => setParams({
                  ...params,
                  types: e.target.checked ? [...params.types, t] : params.types.filter(type => type !== t),
                })} className="rounded" />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">题目数量</label>
          <input type="number" value={params.count} onChange={e => setParams({ ...params, count: parseInt(e.target.value) })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" min={1} max={20} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">难度等级</label>
          <select value={params.difficulty} onChange={e => setParams({ ...params, difficulty: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm">
            <option value="简单">简单</option>
            <option value="中等">中等</option>
            <option value="困难">困难</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={params.socrates} onChange={e => setParams({ ...params, socrates: e.target.checked })} className="rounded" />
            苏格拉底模式
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">参考来源（可选）</label>
          <div className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center ${uploadedReference ? "border-primary bg-primary/5" : "border-border hover:border-primary"} cursor-pointer transition-colors`} onClick={handleUploadReference}>
            {uploadedReference ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <FileText size={14} />{uploadedReference}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                <Upload size={16} className="mx-auto mb-1" />上传参考试卷或练习题
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">上传后AI会模仿该试卷的命题风格，提取的题目仍需审核后入库</p>
        </div>

        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6] disabled:opacity-50 flex items-center justify-center gap-2">
          {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
          {isGenerating ? "生成中..." : "生成题目"}
        </button>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-sm">生成的题目列表</h3>
            <div className="flex bg-card border border-border rounded-lg p-0.5">
              <button onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "preview" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                预览模式
              </button>
              <button onClick={() => setViewMode("edit")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "edit" ? "bg-primary text-white" : "text-muted-foreground hover:text-[#7F84D6]"}`}>
                编辑模式
              </button>
            </div>
            <span className="text-xs text-muted-foreground">待审核 {pendingQuestions.length} 道 · 已入库 {approvedQuestions.length} 道 · 已选择 {selectedQuestionsForExam.length} 道</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingQuestions.length > 0 && (
              <button onClick={handleBatchApprove} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#74C2A0] text-white rounded-md hover:bg-[#5FAF8E]">
                <CheckCircle size={12} />全部通过 ({pendingQuestions.length})
              </button>
            )}
            {selectedQuestionsForExam.length > 0 && (
              <button onClick={() => setShowPublishModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#F2A56B] text-white rounded-md hover:bg-[#E8945C]">
                <Send size={12} />发布考试 ({selectedQuestionsForExam.length})
              </button>
            )}
            {approvedQuestions.length > 0 && (
              <button onClick={() => onNav("teacher-bank")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-[#7F84D6]">
                <Database size={12} />前往题库查看
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {generatedQuestions.map((q, index) => (
            <div key={q.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)}
              className={`bg-card rounded-lg border border-border p-4 ${q.professionalScore < 80 ? "border-[#EEC1DD]/60" : ""} ${q.status === "approved" ? "opacity-60" : ""} ${draggedIndex === index ? "opacity-50 border-primary shadow-lg" : ""} cursor-move hover:border-primary/50 transition-all`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedQuestionsForExam.includes(q.id)} onChange={() => handleQuestionSelect(q.id)} 
                    className="rounded text-primary focus:ring-primary" disabled={q.status !== "approved"} />
                  <GripVertical size={14} className="text-muted-foreground" />
                  <Tag color="blue">{q.questionType || (q.type === "multiple" ? "多选题" : q.type === "choice" ? "选择题" : q.type === "fill" ? "填空题" : "问答题")}</Tag>
                  <Tag color="gray">{q.topic}</Tag>
                  <Tag color={q.difficulty === "简单" ? "green" : q.difficulty === "中等" ? "blue" : "red"}>{q.difficulty}</Tag>
                  {q.professionalScore < 80 && <Tag color="yellow">专业度 {q.professionalScore}</Tag>}
                  <Tag color="cyan">AI生成</Tag>
                </div>
                <div className="flex items-center gap-2">
                  {q.status === "approved" ? <Tag color="green">已入库</Tag> : <Tag color="gray">待审核</Tag>}
                </div>
              </div>
              {viewMode === "edit" ? (
                <textarea defaultValue={q.question} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24 mb-3" />
              ) : (
                <p className="text-sm mb-3">{q.question}</p>
              )}
              {q.options?.length > 0 && (
                <div className="space-y-1 mb-3">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`text-xs px-3 py-1.5 rounded ${(Array.isArray(q.answer) ? q.answer.includes(i) : i === q.answer) ? "bg-[#74C2A0]/20 text-[#57AE8F]" : "bg-muted"}`}>
                      {String.fromCharCode(65 + i)}. {viewMode === "edit" ? <input type="text" defaultValue={opt} className="w-full bg-transparent text-xs" /> : opt}
                    </div>
                  ))}
                </div>
              )}
              {q.type !== "choice" && q.type !== "multiple" && (
                <div className="bg-[#74C2A0]/20 rounded p-2 mb-3">
                  <p className="text-xs font-medium text-[#57AE8F]">参考答案：{q.answer}</p>
                </div>
              )}
              <div className="bg-[#969BE7]/20 rounded p-2 mb-3">
                <p className="text-xs text-[#969BE7]">{q.explain}</p>
              </div>
              {q.socraticQuestions?.length > 0 && (
                <div className="bg-[#969BE7]/20 rounded p-2 mb-3">
                  <p className="text-xs font-medium text-[#969BE7] mb-1">苏格拉底追问</p>
                  {q.socraticQuestions.map((question: string, i: number) => (
                    <p key={i} className="text-xs text-[#969BE7]">{i + 1}. {question}</p>
                  ))}
                </div>
              )}
              {q.status !== "approved" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(q.id)} className="px-3 py-1.5 text-xs bg-[#74C2A0] text-white rounded hover:bg-[#5FAF8E]">审核通过（入库）</button>
                  <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent">修改内容</button>
                  <button onClick={() => handleReject(q.id)} className="px-3 py-1.5 text-xs text-[#DD7373] hover:bg-[#E88383]/20 rounded">驳回丢弃</button>
                  <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent">重新生成</button>
                </div>
              )}
              {q.status === "approved" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={12} className="text-[#57AE8F]" />题目已入库，来源标记为"AI生成题目"
                  <button onClick={() => onNav("teacher-bank")} className="text-primary hover:underline">查看题库</button>
                </div>
              )}
            </div>
          ))}
          {generatedQuestions.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              <Brain size={32} className="mx-auto mb-3 opacity-50" />
              <p>暂无生成的题目</p>
              <p className="mt-1">设置参数后点击"生成题目"按钮开始生成</p>
            </div>
          )}
        </div>
      </div>

      {showAddedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-[#74C2A0]/25 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-[#57AE8F]" />
            </div>
            <div>
              <h3 className="font-semibold">题目入库成功</h3>
              <p className="text-sm text-muted-foreground mt-1">已将 {addedCount} 道题目审核通过并写入题库</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddedModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">继续生成</button>
              <button onClick={() => { setShowAddedModal(false); onNav("teacher-bank"); }} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">前往题库查看</button>
            </div>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">发布考试</h3>
              <button onClick={() => setShowPublishModal(false)}><X size={16} /></button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">考试名称</label>
              <input type="text" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="如：期中考试" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">开始时间</label>
                <input type="datetime-local" value={examForm.startTime} onChange={e => setExamForm({ ...examForm, startTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">结束时间</label>
                <input type="datetime-local" value={examForm.endTime} onChange={e => setExamForm({ ...examForm, endTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">参与班级（多选）</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["2024级1班", "2024级2班", "2024级3班", "2024级4班"].map(cls => (
                  <label key={cls} className={`px-3 py-1.5 rounded-md text-xs cursor-pointer border transition-colors ${examForm.classes.includes(cls) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                    <input type="checkbox" checked={examForm.classes.includes(cls)} onChange={e => {
                      const newClasses = e.target.checked ? [...examForm.classes, cls] : examForm.classes.filter(c => c !== cls);
                      setExamForm({ ...examForm, classes: newClasses });
                    }} className="hidden" />
                    {cls}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">已选择题目数量</span>
                <span className="font-medium text-primary">{selectedQuestionsForExam.length} 道</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPublishModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm">取消</button>
              <button onClick={handlePublishExam} className="flex-1 py-2 bg-primary text-white rounded-md text-sm">确认发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAIQuiz;
