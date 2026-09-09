import { useState, useEffect } from "react";
import { CheckCircle, FileText } from "lucide-react";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import { getGradingList, submitGrade, getAiGradeSuggestion, GradingItemVO } from "../../../services/examService";
import { Tag } from "../../utils";

function TA_Grading() {
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [items, setItems] = useState<GradingItemVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [aiGrading, setAiGrading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    getMyCourses().then(data => setCourses(data || [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!selectedCourseId) { setItems([]); setSelectedAnswerId(null); return; }
    setLoading(true);
    getGradingList(selectedCourseId)
      .then(data => { setItems(data || []); setSelectedAnswerId(null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const currentItem = items.find(i => i.answerId === selectedAnswerId) || null;

  const typeLabel = (t?: string) => {
    if (t === "SHORT") return "简答题";
    if (t === "COMPREHENSIVE") return "综合题";
    if (t === "FILL") return "填空题";
    return "主观题";
  };

  const handleSubmitGrade = async () => {
    if (!currentItem) return;
    if (score.trim() === "") { showToastMsg("请输入分数"); return; }
    const numScore = parseFloat(score);
    if (isNaN(numScore)) { showToastMsg("请输入有效分数"); return; }
    if (numScore < 0 || (currentItem.maxScore != null && numScore > currentItem.maxScore)) {
      showToastMsg(`分数需在 0 ~ ${currentItem.maxScore ?? "满分"} 之间`);
      return;
    }
    try {
      await submitGrade(currentItem.answerId, numScore, comment.trim() || undefined);
      showToastMsg("批阅完成");
      setItems(prev => prev.filter(i => i.answerId !== currentItem.answerId));
      setSelectedAnswerId(null);
      setScore("");
      setComment("");
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "批阅失败");
    }
  };

  const handleAiSuggestion = async () => {
    if (!currentItem) return;
    setAiGrading(true);
    try {
      const suggestion = await getAiGradeSuggestion(currentItem.answerId);
      setScore(String(suggestion.suggestedScore));
      setComment(suggestion.comment || "");
      showToastMsg("AI 预评分已填入，请确认或修改后提交");
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "AI 预评分失败");
    } finally {
      setAiGrading(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground">选择课程</label>
        <select
          value={selectedCourseId ?? ""}
          onChange={e => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-background"
        >
          <option value="">请选择课程</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.courseName || c.className || `课程 ${c.id}`}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">待批阅主观题：<span className="font-semibold text-foreground">{items.length}</span> 道</span>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center">
          <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{selectedCourseId ? "该课程暂无待批阅的主观题" : "请先选择课程"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-2">
            {items.map(i => (
              <div
                key={i.answerId}
                onClick={() => { setSelectedAnswerId(i.answerId); setScore(""); setComment(""); }}
                className={`bg-card rounded-lg border p-3 cursor-pointer transition-colors ${selectedAnswerId === i.answerId ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{i.studentName || `学生${i.studentId}`}</span>
                  <Tag color="gray">第{i.questionNo}题</Tag>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{i.paperName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{i.questionStem}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
            {!currentItem ? (
              <div className="text-center py-16 text-sm text-muted-foreground">请选择左侧一道待批阅题目</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">批阅 · {currentItem.studentName || `学生${currentItem.studentId}`} · 第{currentItem.questionNo}题</h3>
                  <Tag color="blue">{typeLabel(currentItem.questionType)}</Tag>
                </div>
                <div className="space-y-3">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">题目</p>
                    <p className="text-sm whitespace-pre-wrap">{currentItem.questionStem || "（无题干）"}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">学生答案</p>
                    <p className="text-sm whitespace-pre-wrap">{currentItem.studentAnswer || "（未作答）"}</p>
                  </div>
                  {currentItem.correctAnswer && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">参考答案</p>
                      <p className="text-sm whitespace-pre-wrap">{currentItem.correctAnswer}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <label className="text-sm font-medium">得分</label>
                  <input
                    type="number"
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    placeholder={`满分 ${currentItem.maxScore ?? "—"}`}
                    className="w-28 px-3 py-2 border border-border rounded-md text-sm"
                  />
                  <button onClick={handleAiSuggestion} disabled={aiGrading} className="px-3 py-2 text-xs border border-primary text-primary rounded-md hover:bg-primary/10 disabled:opacity-50">
                    {aiGrading ? "AI 评分中…" : "AI 预评分"}
                  </button>
                  <span className="text-xs text-muted-foreground">/ {currentItem.maxScore ?? "—"} 分</span>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">评语（可选）</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="给学生的批注…"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                  />
                </div>
                <button
                  onClick={handleSubmitGrade}
                  className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90"
                >
                  提交批阅
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TA_Grading;
