import { useState, useCallback, useEffect } from "react";
import { CheckCircle, Plus, X } from "lucide-react";
import { getMyCourses, ClassVO } from "../../../services/dashboardService";
import {
  sendNotification,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  getCourseStudents,
  Notification as NotifItem,
  RecipientStudentVO,
} from "../../../services/notificationService";
import { Tag } from "../../utils";

const rosterClassKey = (r: RecipientStudentVO) =>
  r.className && r.className.trim() ? r.className.trim() : "";

function NotificationCenter({ mode }: { mode: "teacher" | "admin" | "student" }) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationType, setNotificationType] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifCourseId, setNotifCourseId] = useState<number | "ALL">("ALL");
  const [notifScope, setNotifScope] = useState<string>("ALL");

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [myCourses, setMyCourses] = useState<ClassVO[]>([]);
  const [roster, setRoster] = useState<RecipientStudentVO[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const canSend = mode !== "student";

  const loadNotifications = useCallback(() => {
    setLoadingNotifs(true);
    getMyNotifications(1, 100)
      .then((data) => {
        setNotifications(data.records || []);
      })
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (mode === "teacher") {
      getMyCourses()
        .then((courses) => setMyCourses(courses || []))
        .catch(() => {});
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "teacher" || notifCourseId === "ALL") {
      setRoster([]);
      setSelectedClasses([]);
      setSelectedStudents([]);
      return;
    }
    getCourseStudents(notifCourseId as number)
      .then((list) => {
        const rs = list || [];
        setRoster(rs);
        setSelectedClasses(Array.from(new Set(rs.map(rosterClassKey))));
        setSelectedStudents(rs.map((r) => r.studentId));
      })
      .catch(() => {
        setRoster([]);
        setSelectedClasses([]);
        setSelectedStudents([]);
      });
  }, [notifCourseId, mode]);

  const showToastMsg = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSendNotification = async () => {
    const title = notifTitle.trim() || "";
    const content = notifContent.trim() || "";
    if (!title) {
      showToastMsg("请输入通知标题");
      return;
    }
    if (!content.trim()) {
      showToastMsg("请输入通知内容");
      return;
    }
    if (
      mode !== "admin" &&
      notifCourseId !== "ALL" &&
      (selectedClasses.length === 0 || selectedStudents.length === 0)
    ) {
      showToastMsg("请至少选择一个班级和一名学生");
      return;
    }
    try {
      if (mode === "admin") {
        await sendNotification({ title, content, recipientScope: notifScope });
      } else {
        await sendNotification({
          title,
          content,
          recipientScope: "COURSE",
          courseId: notifCourseId === "ALL" ? undefined : (notifCourseId as number),
          classNames: notifCourseId === "ALL" ? undefined : selectedClasses,
          studentIds: notifCourseId === "ALL" ? undefined : selectedStudents,
        });
      }
      showToastMsg("通知已发送");
      loadNotifications();
    } catch {
      showToastMsg("发送失败，请重试");
    }
    setShowSendModal(false);
    setNotifTitle("");
    setNotifContent("");
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      loadNotifications();
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      showToastMsg("已全部标记为已读");
      loadNotifications();
    } catch {
      /* ignore */
    }
  };

  const fmtNotifTime = (t?: string) =>
    t ? t.replace("T", " ").substring(0, 16) : "";
  const unreadCount = notifications.filter((n) => n.isRead === 0).length;

  const filteredNotifications = notifications.filter((n) =>
    notificationType
      ? notificationType === "system"
        ? n.senderName === "系统"
        : n.senderName !== "系统"
      : true
  );

  const classOptions = (() => {
    const map = new Map<string, { label: string; count: number }>();
    roster.forEach((r) => {
      const key = rosterClassKey(r);
      const label = key || "未分班";
      const cur = map.get(key) || { label, count: 0 };
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([key, v]) => ({
      key,
      label: v.label,
      count: v.count,
    }));
  })();

  const filteredRoster = roster.filter((r) => {
    if (!selectedClasses.includes(rosterClassKey(r))) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.studentNo || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allClassesSelected =
    classOptions.length > 0 && selectedClasses.length === classOptions.length;
  const allStudentsSelected =
    filteredRoster.length > 0 &&
    filteredRoster.every((r) => selectedStudents.includes(r.studentId));

  const toggleClass = (key: string) => {
    setSelectedClasses((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const toggleAllClasses = () => {
    setSelectedClasses(allClassesSelected ? [] : classOptions.map((c) => c.key));
  };
  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleAllStudents = () => {
    setSelectedStudents(
      allStudentsSelected ? [] : filteredRoster.map((r) => r.studentId)
    );
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} />
            {toast}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">通知中心</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "student"
              ? "接收教师与管理员发布的通知"
              : mode === "admin"
              ? "向全体师生发布通知公告"
              : "向授课学生发布通知"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent"
            >
              <CheckCircle size={14} />全部已读 ({unreadCount})
            </button>
          )}
          {canSend && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]"
            >
              <Plus size={14} />
              {mode === "admin" ? "发布通知" : "发送通知"}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setNotificationType(null)}
          className={`px-4 py-2 rounded-md text-sm ${
            !notificationType ? "bg-primary text-white" : "bg-muted hover:bg-accent"
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setNotificationType("system")}
          className={`px-4 py-2 rounded-md text-sm ${
            notificationType === "system"
              ? "bg-primary text-white"
              : "bg-muted hover:bg-accent"
          }`}
        >
          系统预警
        </button>
        {canSend && (
          <button
            onClick={() => setNotificationType("manual")}
            className={`px-4 py-2 rounded-md text-sm ${
              notificationType === "manual"
                ? "bg-primary text-white"
                : "bg-muted hover:bg-accent"
            }`}
          >
            我发送的
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loadingNotifs ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            加载中...
          </p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            暂无通知
          </p>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.isRead === 0) handleMarkRead(n.id);
              }}
              className={`bg-card rounded-lg border border-border p-4 transition-colors ${
                n.isRead === 0
                  ? "border-l-4 border-l-primary cursor-pointer hover:bg-accent/30"
                  : "opacity-80"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {n.isRead === 0 && (
                      <span
                        className="w-2 h-2 bg-[#E88383] rounded-full flex-shrink-0"
                        title="未读"
                      />
                    )}
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmtNotifTime(n.createTime)} · 发送人：
                    {n.senderName || "系统"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>
                <Tag color={n.senderName === "系统" ? "red" : "blue"}>
                  {n.senderName === "系统" ? "系统预警" : canSend ? "手动发送" : "通知"}
                </Tag>
              </div>
            </div>
          ))
        )}
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {mode === "admin" ? "发布通知" : "发送通知"}
              </h3>
              <button onClick={() => setShowSendModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                收件人
              </label>
              {mode === "admin" ? (
                <select
                  value={notifScope}
                  onChange={(e) => setNotifScope(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                >
                  <option value="ALL">全体师生（所有教师、助教、学生）</option>
                  <option value="TEACHERS">全体教师（含助教）</option>
                </select>
              ) : (
                <div className="mt-1 space-y-3">
                  <select
                    value={String(notifCourseId)}
                    onChange={(e) =>
                      setNotifCourseId(
                        e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                  >
                    <option value="ALL">全部课程学生（名下所有课程）</option>
                    {myCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseName || `课程${c.id}`}
                        {c.semester ? ` · ${c.semester}` : ""}
                      </option>
                    ))}
                  </select>

                  {notifCourseId !== "ALL" && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            班级
                          </span>
                          <label className="flex items-center gap-1 text-xs text-primary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allClassesSelected}
                              onChange={toggleAllClasses}
                            />{" "}
                            全选
                          </label>
                        </div>
                        {classOptions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            该课程暂无学生
                          </p>
                        ) : (
                          <div className="max-h-28 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                            {classOptions.map((c) => (
                              <label
                                key={c.key}
                                className="flex items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.includes(c.key)}
                                  onChange={() => toggleClass(c.key)}
                                />
                                <span>
                                  {c.label}（{c.count}人）
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            人员
                          </span>
                          <label className="flex items-center gap-1 text-xs text-primary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allStudentsSelected}
                              onChange={toggleAllStudents}
                            />{" "}
                            全选
                          </label>
                        </div>
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="搜索姓名/学号"
                          className="w-full px-3 py-2 border border-border rounded-md text-sm mb-1"
                        />
                        <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                          {filteredRoster.map((r) => (
                            <label
                              key={r.studentId}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(r.studentId)}
                                onChange={() => toggleStudent(r.studentId)}
                              />
                              <span>
                                {r.name}（{r.studentNo}）
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                标题
              </label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="请输入通知标题"
                className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                正文
              </label>
              <textarea
                value={notifContent}
                onChange={(e) => setNotifContent(e.target.value)}
                placeholder="请输入通知内容"
                className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm h-32 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent"
              >
                取消
              </button>
              <button
                onClick={handleSendNotification}
                className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-[#7F84D6]"
              >
                立即发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
