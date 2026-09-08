import { useState } from "react";
import {
  Wifi, Database, Server, Activity, GraduationCap, Users, BookOpen,
  Layers, Upload, BookMarked, FileText, AlertTriangle, CheckCircle,
  XCircle, AlertCircle, ArrowUpRight, ArrowDownRight, WifiOff
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function AdminDashboard() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCardClick = (label: string) => {
    showToast(`已查看「${label}」详情`);
  };

  const healthData = [
    { label: "大模型服务", status: "online", value: "正常运行", icon: Wifi, color: "bg-[#74C2A0]" },
    { label: "数据库连接", status: "online", value: "已连接", icon: Database, color: "bg-[#74C2A0]" },
    { label: "系统运行天数", status: "online", value: "156天", icon: Server, color: "bg-[#969BE7]" },
    { label: "缓存服务", status: "degraded", value: "性能降级", icon: Activity, color: "bg-[#F5C069]" },
  ];

  const platformStats = [
    { label: "教师总数", value: "45", change: "+3", icon: GraduationCap },
    { label: "学生总数", value: "1,238", change: "+24", icon: Users },
    { label: "课程总数", value: "86", change: "+5", icon: BookOpen },
    { label: "活跃班级数", value: "32", change: "+2", icon: Layers },
    { label: "今日活跃用户", value: "356", change: "+12%", icon: Activity },
  ];

  const teachingStats = [
    { label: "今日新增导入", value: "284", icon: Upload },
    { label: "题库题目数", value: "5,620", icon: BookMarked },
    { label: "已发布考试", value: "128", icon: FileText },
    { label: "预警学生数", value: "45", icon: AlertTriangle },
  ];

  const activityTrend = [
    { day: "周一", teachers: 28, students: 756 },
    { day: "周二", teachers: 32, students: 812 },
    { day: "周三", teachers: 29, students: 789 },
    { day: "周四", teachers: 35, students: 856 },
    { day: "周五", teachers: 31, students: 798 },
    { day: "周六", teachers: 12, students: 234 },
    { day: "周日", teachers: 8, students: 167 },
  ];

  const recentEvents = [
    { time: "10:32", type: "ai-failure", message: "AI调用失败：大模型响应超时", severity: "error" },
    { time: "09:15", type: "import-failure", message: "数据导入解析失败：第12行格式错误", severity: "warning" },
    { time: "08:45", type: "login-abnormal", message: "登录异常：用户2024003连续失败5次", severity: "warning" },
    { time: "08:22", type: "ai-success", message: "AI出题成功：王建国老师生成20道选择题", severity: "info" },
    { time: "07:55", type: "import-success", message: "数据导入成功：张伟老师导入45条成绩", severity: "info" },
    { time: "07:30", type: "system", message: "系统定时任务执行完成：每日统计报表生成", severity: "info" },
  ];

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} />
            {toast}
          </div>
        </div>
      )}
      <div className="bg-gradient-to-r from-[#969BE7] to-[#C8A2E8] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">系统总览</h2>
            <p className="text-white/90 text-sm mt-1">实时监控平台运行状态与业务数据</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#93D4BC] animate-pulse" />
            <span className="text-sm">系统正常运行中</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.map(item => (
          <button key={item.label} onClick={() => handleCardClick(item.label)}
            className="bg-card rounded-lg border border-border p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "online" ? "bg-[#74C2A0]/20" : item.status === "degraded" ? "bg-[#EEC1DD]/30" : "bg-[#E88383]/20"}`}>
                {item.status === "online" ? <Wifi size={18} className="text-[#57AE8F]" /> : item.status === "degraded" ? <Wifi size={18} className="text-[#C972A8]" /> : <WifiOff size={18} className="text-[#DD7373]" />}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.status === "online" ? "bg-[#74C2A0]/25 text-[#57AE8F]" : item.status === "degraded" ? "bg-[#EEC1DD]/40 text-[#C972A8]" : "bg-[#E88383]/25 text-[#DD7373]"}`}>
                {item.status === "online" ? "正常" : item.status === "degraded" ? "降级" : "离线"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-semibold text-sm mt-0.5">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {platformStats.map(item => (
          <button key={item.label} onClick={() => handleCardClick(item.label)}
            className="bg-card rounded-lg border border-border p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon size={16} className="text-primary" />
              </div>
              <span className="text-xs text-[#57AE8F]">
                {item.change.startsWith("+") ? <ArrowUpRight size={12} className="inline mr-0.5" /> : <ArrowDownRight size={12} className="inline mr-0.5" />}
                {item.change}
              </span>
            </div>
            <p className="font-mono text-xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {teachingStats.map(item => (
          <button key={item.label} onClick={() => handleCardClick(item.label)}
            className="bg-card rounded-lg border border-border p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <item.icon size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={() => handleCardClick("近7天活跃度趋势")} className="w-full bg-card rounded-lg border border-border p-5 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">近7天活跃度趋势</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary rounded" />
              <span className="text-muted-foreground">活跃教师</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#74C2A0] rounded" />
              <span className="text-muted-foreground">活跃学生</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={activityTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="teachers" stroke="#969BE7" strokeWidth={2} dot={{ r: 4 }} name="活跃教师" />
            <Line type="monotone" dataKey="students" stroke="#8FD0B8" strokeWidth={2} dot={{ r: 4 }} name="活跃学生" />
          </LineChart>
        </ResponsiveContainer>
      </button>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">最新异常事件</h3>
          <button onClick={() => showToast("已查看全部异常事件")} className="text-xs text-primary hover:underline">查看全部</button>
        </div>
        <div className="space-y-3">
          {recentEvents.map((event, i) => (
            <button key={i} onClick={() => showToast(`已查看异常事件：${event.message}`)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors text-left">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.severity === "error" ? "bg-[#E88383]/20" : event.severity === "warning" ? "bg-[#EEC1DD]/30" : "bg-[#969BE7]/20"}`}>
                {event.severity === "error" ? <XCircle size={14} className="text-[#DD7373]" /> : event.severity === "warning" ? <AlertCircle size={14} className="text-[#E9B45C]" /> : <CheckCircle size={14} className="text-[#969BE7]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{event.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.time} · {event.type === "ai-failure" ? "AI调用失败" : event.type === "import-failure" ? "数据导入失败" : event.type === "login-abnormal" ? "登录异常" : event.type === "ai-success" ? "AI操作成功" : event.type === "import-success" ? "数据导入成功" : "系统任务"}
                </p>
              </div>
              <span className="text-xs text-primary">查看详情</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
