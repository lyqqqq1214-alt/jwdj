import { useState } from "react";
import {
  Search, FileText, Edit2, Bell, Brain, Upload, Eye, Target,
  CheckCircle, RotateCcw, AlertCircle
} from "lucide-react";
import { Tag } from "../../utils";
import { teacherOperationLogs } from "../../constants";

function TeacherOperationLogs() {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [revokedIds, setRevokedIds] = useState<Set<number>>(new Set());
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokingLog, setRevokingLog] = useState<typeof teacherOperationLogs[0] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const classOptions = ["2024级1班", "2024级2班"];
  const typeOptions = [
    { value: "exam", label: "考试管理", icon: FileText },
    { value: "grading", label: "批改作业", icon: Edit2 },
    { value: "notification", label: "发送通知", icon: Bell },
    { value: "ai", label: "AI操作", icon: Brain },
    { value: "import", label: "数据导入", icon: Upload },
    { value: "view", label: "查看操作", icon: Eye },
    { value: "suggestion", label: "学习建议", icon: Target },
  ];

  const filteredLogs = teacherOperationLogs.filter(log => {
    if (search && !log.user.includes(search) && !log.action.includes(search) && !log.detail.includes(search)) return false;
    if (filterClass && log.class !== filterClass) return false;
    if (filterType && log.type !== filterType) return false;
    return true;
  });

  const roleColor = (role: string) => role === "teacher" ? "blue" : "purple";
  const roleText = (role: string) => role === "teacher" ? "教师" : "助教";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">操作日志</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-border rounded-md text-sm w-64" placeholder="搜索操作日志..." />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">班级筛选:</span>
          <select value={filterClass || ""} onChange={e => setFilterClass(e.target.value || null)}
            className="px-3 py-2 border border-border rounded-md text-sm">
            <option value="">全部班级</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">操作类型:</span>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-md text-xs ${!filterType ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>全部</button>
            {typeOptions.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => setFilterType(filterType === t.value ? null : t.value)}
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filterType === t.value ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["时间", "操作用户", "角色", "班级", "操作类型", "操作内容", "详情", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const isRevoked = revokedIds.has(log.id);
              const isAssistant = log.role === "teaching-assistant";
              return (
                <tr key={log.id} className={`border-b border-border last:border-0 ${isRevoked ? "opacity-50" : "hover:bg-accent/30"}`}>
                  <td className={`px-4 py-3 font-mono text-xs text-muted-foreground ${isRevoked ? "line-through" : ""}`}>{log.time}</td>
                  <td className={`px-4 py-3 font-medium ${isRevoked ? "line-through text-muted-foreground" : ""}`}>{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Tag color={roleColor(log.role)}>{roleText(log.role)}</Tag>
                      {isRevoked && <Tag color="gray">已撤回</Tag>}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs text-muted-foreground ${isRevoked ? "line-through" : ""}`}>{log.class}</td>
                  <td className={`px-4 py-3 ${isRevoked ? "line-through text-muted-foreground" : ""}`}>
                    {typeOptions.find(t => t.value === log.type) && (
                      <span className={isRevoked ? "text-xs" : "text-xs text-primary"}>{typeOptions.find(t => t.value === log.type)?.label}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${isRevoked ? "line-through text-muted-foreground" : ""}`}>{log.action}</td>
                  <td className={`px-4 py-3 text-xs text-muted-foreground ${isRevoked ? "line-through" : ""}`}>{log.detail}</td>
                  <td className="px-4 py-3">
                    {isAssistant && !isRevoked && (
                      <button onClick={() => { setRevokingLog(log); setShowRevokeModal(true); }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#DD7373] hover:text-[#DD7373] hover:bg-[#E88383]/20 rounded transition-colors">
                        <RotateCcw size={12} />撤回
                      </button>
                    )}
                    {isRevoked && (
                      <span className="text-xs text-muted-foreground">已撤回</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      {showRevokeModal && revokingLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E88383]/25 text-[#DD7373] flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-semibold">确认撤回操作</h3>
                <p className="text-xs text-muted-foreground">撤回后将恢复操作前的状态</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作用户</span>
                <span className="text-sm font-medium">{revokingLog.user}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作时间</span>
                <span className="text-sm font-medium">{revokingLog.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作类型</span>
                <span className="text-sm font-medium">{typeOptions.find(t => t.value === revokingLog.type)?.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作内容</span>
                <span className="text-sm font-medium">{revokingLog.action}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">详情</span>
                <span className="text-sm text-muted-foreground">{revokingLog.detail}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRevokeModal(false); setRevokingLog(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => {
                setRevokedIds(prev => new Set([...prev, revokingLog!.id]));
                setShowRevokeModal(false);
                setRevokingLog(null);
                showToastMsg("已撤回助教操作");
              }} className="flex-1 py-2 bg-[#E88383] text-white rounded-md text-sm hover:bg-[#E07070]">确认撤回</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center text-xs text-muted-foreground">
        显示 {filteredLogs.length} 条记录，共 {teacherOperationLogs.length} 条
      </div>
    </div>
  );
}

export default TeacherOperationLogs;
