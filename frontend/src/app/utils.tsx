import React from "react";

// ─── 考勤状态归一化（英文→中文，中文原样返回） ─────────────────────────────────
export const normalizeAttendanceStatus = (status: string): string => {
  if (!status) return "";
  const s = status.trim();
  const map: Record<string, string> = {
    PRESENT: "出勤", LATE: "迟到", LEAVE: "请假", ABSENT: "缺勤",
    出勤: "出勤", 迟到: "迟到", 请假: "请假", 缺勤: "缺勤",
  };
  return map[s] || map[s.toUpperCase()] || s;
};

// 考勤状态 → Tag 颜色
export const getAttendanceTagColor = (status: string): string => {
  const s = normalizeAttendanceStatus(status);
  switch (s) {
    case "出勤": return "green";
    case "迟到": return "orange";
    case "请假": return "blue";
    case "缺勤": return "red";
    default: return "gray";
  }
};

// ─── 通用 UI 组件 ─────────────────────────────────────────────────────────────
export const Tag = ({ color, children }: { color: string; children: React.ReactNode }) => {
  const map: Record<string, string> = {
    blue: "bg-[#969BE7]/20 text-[#969BE7] border border-[#969BE7]/40",
    green: "bg-[#74C2A0]/20 text-[#57AE8F] border border-[#74C2A0]/40",
    orange: "bg-[#F2A56B]/20 text-[#E8945C] border border-[#F2A56B]/40",
    red: "bg-[#E88383]/20 text-[#DD7373] border border-[#E88383]/40",
    gray: "bg-[#EEECF9] text-[#9A9AB4] border border-[#E6E2F5]",
    yellow: "bg-[#EEC1DD]/30 text-[#C972A8] border border-[#EEC1DD]/60",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

export const StatCard = ({ count, label, icon: Icon, color }: { count: string | number; label: string; icon: any; color: string }) => {
  const colors: Record<string, string> = {
    blue: "text-[#969BE7] bg-[#969BE7]/20", green: "text-[#57AE8F] bg-[#74C2A0]/20",
    orange: "text-[#E8945C] bg-[#F2A56B]/20", purple: "text-[#969BE7] bg-[#969BE7]/20",
  };
  return (
    <div className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="font-mono text-2xl font-semibold text-foreground">{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
};

export const roleLabel = (role: string) => {
  if (role === "admin") return <Tag color="blue">管理员</Tag>;
  if (role === "teacher") return <Tag color="green">教师</Tag>;
  if (role === "teaching-assistant") return <Tag color="purple">助教</Tag>;
  return <Tag color="orange">学生</Tag>;
};

export const diffLabel = (d: string) => {
  if (d === "简单") return <Tag color="green">简单</Tag>;
  if (d === "困难") return <Tag color="red">困难</Tag>;
  return <Tag color="yellow">中等</Tag>;
};

export const statusLabel = (s: string) => {
  if (s === "pending") return <Tag color="yellow">待审核</Tag>;
  if (s === "approved") return <Tag color="green">已通过</Tag>;
  return <Tag color="red">已驳回</Tag>;
};
