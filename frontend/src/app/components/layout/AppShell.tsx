import React, { useState } from "react";
import type { Role, Page } from "../../types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ role, page, onNav, onLogout, dark, onToggleDark, breadcrumb, children, onToggleAiAssistant, userData }: {
  role: Role; page: Page; onNav: (p: Page) => void; onLogout: () => void;
  dark: boolean; onToggleDark: () => void; breadcrumb: string[]; children: React.ReactNode;
  onToggleAiAssistant?: () => void;
  userData?: any;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar role={role} page={page} onNav={onNav} onLogout={onLogout} dark={dark} onToggleDark={onToggleDark} collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} onToggleAiAssistant={onToggleAiAssistant} userData={userData} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={breadcrumb[breadcrumb.length - 1]} breadcrumb={breadcrumb} role={role} onNav={onNav} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
