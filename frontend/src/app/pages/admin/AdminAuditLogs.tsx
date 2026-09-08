import { useState, useEffect } from "react";
import {
  History, AlertCircle, AlertTriangle, FileSearch, Search, Shield,
} from "lucide-react";
import { Tag } from "../../utils";
import { getOperationLogs, OperationLog } from "../../../services/logService";

function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [apiLogs, setApiLogs] = useState<OperationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    getOperationLogs(1, 100).then(data => {
      setApiLogs(data.records || []);
    }).catch(() => {}).finally(() => setLoadingLogs(false));
  }, []);

  const auditLogs = apiLogs.length > 0 ? apiLogs.map(log => ({
    id: log.id,
    time: log.createTime || "",
    user: log.username || "",
    role: "teacher",
    type: log.logType || "view",
    action: log.action || log.detail || "",
    ip: log.ip || "",
    status: "success",
    privacy: false,
  })) : [
    { id: 1, time: "2024-01-15 10:32:15", user: "王建国", role: "teacher", type: "import", action: "导入成绩数据", ip: "192.168.1.105", status: "success", privacy: false },
    { id: 2, time: "2024-01-15 10:28:42", user: "张伟", role: "student", type: "view", action: "查看个人画像", ip: "192.168.1.108", status: "success", privacy: true },
    { id: 3, time: "2024-01-15 10:15:33", user: "陈系统", role: "admin", type: "config", action: "修改系统配置", ip: "192.168.1.1", status: "success", privacy: false },
  ];

  const abnormalEvents = [
    { id: 1, time: "2024-01-15 10:32", type: "ai-error", message: "AI调用超时", count: 5, severity: "error" },
    { id: 2, time: "2024-01-15 09:45", type: "login-failure", message: "连续登录失败5次", count: 3, severity: "warning" },
    { id: 3, time: "2024-01-15 08:30", type: "import-error", message: "数据导入解析失败", count: 2, severity: "warning" },
    { id: 4, time: "2024-01-15 08:15", type: "system", message: "定时任务执行延迟", count: 1, severity: "info" },
    { id: 5, time: "2024-01-14 16:20", type: "privacy", message: "批量导出学生数据", count: 1, severity: "warning" },
  ];

  const filteredLogs = auditLogs.filter(log => {
    if (search && !log.user.includes(search) && !log.action.includes(search)) return false;
    if (filterType !== "all" && log.type !== filterType) return false;
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">系统审计日志</h2>
            <p className="text-white/90 text-sm mt-1">追踪系统操作记录与异常事件</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <History size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-mono text-xl font-bold">{auditLogs.length}</p>
              <p className="text-xs text-muted-foreground">今日操作记录</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E88383]/20 flex items-center justify-center">
              <AlertCircle size={18} className="text-[#DD7373]" />
            </div>
            <div>
              <p className="font-mono text-xl font-bold">{abnormalEvents.filter(e => e.severity === "error").length}</p>
              <p className="text-xs text-muted-foreground">严重异常</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEC1DD]/30 flex items-center justify-center">
              <AlertTriangle size={18} className="text-[#E9B45C]" />
            </div>
            <div>
              <p className="font-mono text-xl font-bold">{abnormalEvents.filter(e => e.severity === "warning").length}</p>
              <p className="text-xs text-muted-foreground">警告事件</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileSearch size={14} className="text-primary" />
              <h3 className="font-medium text-sm">操作日志</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="搜索用户或操作"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">全部类型</option>
                <option value="import">数据导入</option>
                <option value="export">数据导出</option>
                <option value="view">查看</option>
                <option value="ai">AI操作</option>
                <option value="login">登录</option>
                <option value="config">系统配置</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">全部状态</option>
                <option value="success">成功</option>
                <option value="failure">失败</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作描述</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">来源IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.time}</td>
                    <td className="px-4 py-3 font-medium">{log.user}</td>
                    <td className="px-4 py-3">
                      <Tag color={log.role === "admin" ? "purple" : log.role === "teacher" ? "blue" : "green"}>
                        {log.role === "admin" ? "管理员" : log.role === "teacher" ? "教师" : "学生"}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.type === "import" ? "数据导入" : log.type === "export" ? "数据导出" : log.type === "view" ? "查看" : log.type === "ai" ? "AI操作" : log.type === "login" ? "登录" : "系统配置"}
                    </td>
                    <td className="px-4 py-3">
                      {log.privacy && <span className="inline-flex items-center gap-1 mr-1"><Shield size={10} className="text-[#E8945C]" /></span>}
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
                    <td className="px-4 py-3">
                      {log.status === "success" ? <span className="text-[#57AE8F] text-xs font-medium">成功</span> : <span className="text-[#DD7373] text-xs font-medium">失败</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>共 {filteredLogs.length} 条记录</span>
            <button className="text-primary hover:underline">导出CSV</button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-primary" />
              <h3 className="font-medium text-sm">异常事件监控</h3>
            </div>
            <button className="text-xs text-primary hover:underline">查看全部</button>
          </div>
          <div className="space-y-3">
            {abnormalEvents.map(event => (
              <div key={event.id} className={`p-3 rounded-lg ${event.severity === "error" ? "bg-[#E88383]/20 border border-[#E88383]/30" : event.severity === "warning" ? "bg-[#EEC1DD]/30 border border-[#EEC1DD]/50" : "bg-[#969BE7]/20 border border-[#969BE7]/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${event.severity === "error" ? "text-[#DD7373]" : event.severity === "warning" ? "text-[#C972A8]" : "text-[#969BE7]"}`}>
                    {event.severity === "error" ? "严重" : event.severity === "warning" ? "警告" : "提示"}
                  </span>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                <p className="text-sm">{event.message}</p>
                {event.count > 1 && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-white/50 text-xs rounded">聚合 {event.count} 次</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAuditLogs;
