import { useState, useEffect, useCallback } from "react";
import { Bell, ChevronRight, X } from "lucide-react";
import type { Role, Page } from "../../types";
import { getMyNotifications, getUnreadCount, markNotificationRead, Notification as NotifItem } from "../../../services/notificationService";

export default function Topbar({ title, breadcrumb, role, onNav }: { title: string; breadcrumb: string[]; role: Role; onNav: (p: Page) => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellNotifs, setBellNotifs] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);

  const loadBell = useCallback(() => {
    getUnreadCount().then(setUnread).catch(() => {});
    getMyNotifications(1, 6).then(data => setBellNotifs(data.records || [])).catch(() => {});
  }, []);

  useEffect(() => { loadBell(); }, [loadBell]);

  const notificationPage: Page =
    role === "admin" ? "admin-notification"
      : role === "student" ? "student-notification"
      : "teacher-notification";

  const fmtBellTime = (t?: string) => t ? t.replace("T", " ").substring(0, 16) : "";

  const handleClickItem = async (n: NotifItem) => {
    if (n.isRead === 0) {
      try { await markNotificationRead(n.id); loadBell(); } catch { /* ignore */ }
    }
  };

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} />}
            <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3 relative">
        <button onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) loadBell(); }} className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#E88383] rounded-full text-white text-[10px] flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute top-full right-0 mt-2 w-80 bg-card rounded-lg border border-border shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h4 className="font-medium text-sm">通知中心{unread > 0 && <span className="ml-2 text-xs text-[#DD7373]">{unread} 条未读</span>}</h4>
                <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              {bellNotifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">暂无通知</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {bellNotifs.map(n => (
                    <div key={n.id} onClick={() => handleClickItem(n)}
                      className={`px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer transition-colors ${n.isRead === 0 ? "bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#969BE7]/25">
                          <Bell size={12} className="text-[#969BE7]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 flex items-center gap-1.5">
                            {n.isRead === 0 && <span className="w-1.5 h-1.5 bg-[#E88383] rounded-full flex-shrink-0" />}
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.content}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.senderName || "系统"} · {fmtBellTime(n.createTime)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 border-t border-border">
                <button onClick={() => { setShowNotifications(false); onNav(notificationPage); }} className="w-full text-xs text-primary hover:underline">查看全部通知</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
