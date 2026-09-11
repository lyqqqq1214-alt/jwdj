import React, { useState } from "react";
import type { Role, Page } from "../../types";
import type { TAPermissions } from "../../../services/taService";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ role, page, onNav, onLogout, breadcrumb, children, onToggleAiAssistant, userData, taPermissions }: {
  role: Role; page: Page; onNav: (p: Page) => void; onLogout: () => void;
  breadcrumb: string[]; children: React.ReactNode;
  onToggleAiAssistant?: () => void;
  userData?: any;
  taPermissions?: TAPermissions | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar role={role} page={page} onNav={onNav} onLogout={onLogout} collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} onToggleAiAssistant={onToggleAiAssistant} userData={userData} taPermissions={taPermissions} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={breadcrumb[breadcrumb.length - 1]} breadcrumb={breadcrumb} role={role} onNav={onNav} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
