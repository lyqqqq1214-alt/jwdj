import { useState } from "react";
import { X } from "lucide-react";
import { Tag, diffLabel, statusLabel } from "../../utils";
import { quizItems } from "../../constants";

function TeacherQuizReview() {
  const [selected, setSelected] = useState<typeof quizItems[0] | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["课程", "题目预览", "知识点", "难度", "状态", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quizItems.map(q => (
              <tr key={q.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                <td className="px-4 py-3"><Tag color="blue">{q.course}</Tag></td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{q.preview}</td>
                <td className="px-4 py-3"><Tag color="gray">{q.topic}</Tag></td>
                <td className="px-4 py-3">{diffLabel(q.difficulty)}</td>
                <td className="px-4 py-3">{statusLabel(q.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(q)} className="text-primary hover:underline text-xs">审核</button>
                    {q.status === "pending" && (
                      <>
                        <button className="text-[#57AE8F] hover:underline text-xs">通过</button>
                        <button className="text-[#DD7373] hover:underline text-xs">驳回</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">题目审核</h3>
              <button onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Tag color="blue">{selected.course}</Tag>
                <Tag color="gray">{selected.topic}</Tag>
                {diffLabel(selected.difficulty)}
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="font-medium text-sm">{selected.preview}</p>
              </div>
              <div className="space-y-1.5">
                {["A. 选项一（参考答案）", "B. 选项二", "C. 选项三", "D. 选项四"].map((o, i) => (
                  <div key={i} className={`px-3 py-2 rounded text-sm ${i === 0 ? "bg-[#74C2A0]/20 text-[#57AE8F] border border-[#74C2A0]/40" : "bg-muted text-muted-foreground"}`}>
                    {o}
                  </div>
                ))}
              </div>
              <div className="bg-[#969BE7]/20 rounded p-3 text-xs text-[#969BE7]">
                <strong>解析：</strong>根据微分方程求解原理，正确答案为A。
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-border rounded-md text-sm text-[#DD7373] hover:bg-[#E88383]/20">驳回</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">编辑</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]">通过</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherQuizReview;
