import { Brain, Menu, ChevronRight, Sun, Moon, LogOut } from "lucide-react";
import type { Role, Page } from "../../types";
import { navItems } from "../../constants";
import type { TAPermissions } from "../../../services/taService";

export default function Sidebar({ role, page, onNav, onLogout, dark, onToggleDark, collapsed, onToggleCollapse, onToggleAiAssistant, userData, taPermissions }: {
  role: Role; page: Page; onNav: (p: Page) => void; onLogout: () => void;
  dark: boolean; onToggleDark: () => void; collapsed: boolean; onToggleCollapse: () => void;
  onToggleAiAssistant?: () => void;
  userData?: any;
  taPermissions?: TAPermissions | null;
}) {
  // 助教端按权限过滤导航项
  const items = role === "teaching-assistant" && taPermissions
    ? navItems[role].filter(item => {
        if (item.page === "ta-import") return taPermissions.canImport;
        if (item.page === "ta-grading") return taPermissions.canGrade;
        if (item.page === "ta-profile") return taPermissions.canViewProfile;
        return true; // 教学驾驶舱、班级管理、通知中心始终可见
      })
    : navItems[role];
  return (
    <aside className={`flex flex-col h-full bg-sidebar transition-all duration-200 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <Brain size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-[#4A4A6A] leading-tight">AI教学评价<br />系统</span>
        )}
        <button onClick={onToggleCollapse} className="ml-auto text-sidebar-foreground hover:text-primary">
          <Menu size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {items.map((item, index) => {
          const { icon: Icon, label, page: p, children } = item;
          const active = page === p || (children && children.some(c => c.page === page));
          if (children) {
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => onNav(p || children[0].page)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                    ${active
                      ? "bg-sidebar-accent text-white font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                    }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                  {!collapsed && <ChevronRight size={14} className="ml-auto" />}
                </button>
                <div className="bg-sidebar-secondary">
                  {children.map((child, childIndex) => {
                    const childActive = page === child.page;
                    return (
                      <button
                        key={childIndex}
                        onClick={() => onNav(child.page)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors pl-12
                          ${childActive
                            ? "bg-sidebar-accent text-white font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                          }`}
                      >
                        {childActive && <ChevronRight size={12} className="flex-shrink-0" />}
                        {!childActive && <span className="w-3" />}
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          return (
            <button
              key={p}
              onClick={() => onNav(p)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${active
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && !children && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {/* AI助教按钮 - 带脉动动画 */}
        {(role === "teacher" || role === "teaching-assistant") && (
          <button
            onClick={onToggleAiAssistant}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white rounded-lg transition-all relative overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
          >
            <div className="relative z-10 flex items-center gap-3 w-full">
              <div className="relative">
                <Brain size={16} className="text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              {!collapsed && <span className="font-medium">AI助教</span>}
              {!collapsed && <span className="ml-auto text-[10px] opacity-70">在线</span>}
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <button onClick={onToggleDark} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-sidebar-foreground hover:text-white rounded transition-colors">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && <span>{dark ? "浅色模式" : "深色模式"}</span>}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-sidebar-foreground hover:text-[#DD7373] rounded transition-colors">
          <LogOut size={14} />
          {!collapsed && <span>退出登录</span>}
        </button>
        {!collapsed && userData && (
          <div className="px-3 pt-2 border-t border-sidebar-border mt-1">
            <p className="text-xs font-medium text-[#4A4A6A]">{userData.displayName || userData.username}</p>
            <p className="text-xs text-sidebar-foreground font-mono">{userData.username}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
