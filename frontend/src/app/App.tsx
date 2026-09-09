import { useState, useCallback, useEffect } from "react";
import { getCurrentUser, clearUser, mapRole, logout } from "../services/authService";
import type { Role, Page } from "./types";
import { pageMeta } from "./constants";
import { getTAPermissions, seedTAsIfEmpty, type TAPermissions } from "../services/taService";

// Layout & shared components
import AppShell from "./components/layout/AppShell";
import AIAssistant from "./components/AIAssistant";

// Pages
import LoginPage from "./pages/LoginPage";
import NotificationCenter from "./pages/shared/NotificationCenter";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTeacherManagement from "./pages/admin/AdminTeacherManagement";
import AdminAIOpsCenter from "./pages/admin/AdminAIOpsCenter";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminConfig from "./pages/admin/AdminConfig";

// Teacher pages
import TeacherAiAnalysis from "./pages/teacher/TeacherAiAnalysis";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClassManagement from "./pages/teacher/TeacherClassManagement";
import TeacherDataImport from "./pages/teacher/TeacherDataImport";
import TeacherStudentProfile from "./pages/teacher/TeacherStudentProfile";
import TeacherAIQuiz from "./pages/teacher/TeacherAIQuiz";
import TeacherQuestionBank from "./pages/teacher/TeacherQuestionBank";
import TeacherExamManagement from "./pages/teacher/TeacherExamManagement";
import TeacherOperationLogs from "./pages/teacher/TeacherOperationLogs";

// TA pages
import TA_Grading from "./pages/ta/TA_Grading";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import StudentScoreTrend from "./pages/student/StudentScoreTrend";
import StudentWrongBook from "./pages/student/StudentWrongBook";
import StudentExam from "./pages/student/StudentExam";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [role, setRole] = useState<Role>("student");
  const [dark, setDark] = useState(false);
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState<number[]>([]);
  const [filterSourceType, setFilterSourceType] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [focusQuestion, setFocusQuestion] = useState<{ id: number; courseId?: number | null } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [taPermissions, setTaPermissions] = useState<TAPermissions | null>(null);

  // 检查是否已登录
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      const frontendRole = mapRole(savedUser.role);
      setRole(frontendRole);
      setUser(savedUser);
      if (frontendRole === "teaching-assistant") {
        setTaPermissions(getTAPermissions(savedUser.username));
      }
      setPage(frontendRole === "admin" ? "admin-dashboard" : frontendRole === "teacher" ? "teacher-dashboard" : frontendRole === "teaching-assistant" ? "ta-dashboard" : "student-dashboard");
    }
  }, []);

  const handleLogin = useCallback((r: Role, userData: any) => {
    setRole(r);
    setUser(userData);
    if (r === "teaching-assistant") {
      setTaPermissions(getTAPermissions(userData.username));
      setPage("ta-dashboard");
    } else if (r === "teacher") {
      seedTAsIfEmpty(userData.userId);
      setTaPermissions(null);
      setPage("teacher-dashboard");
    } else if (r === "admin") {
      setTaPermissions(null);
      setPage("admin-dashboard");
    } else {
      setTaPermissions(null);
      setPage("student-dashboard");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error("登出失败:", err);
    } finally {
      clearUser();
      setUser(null);
      setPage("login");
    }
  }, []);
  const toggleDark = useCallback(() => {
    setDark(d => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  }, []);

  if (page === "login") return <LoginPage onLogin={handleLogin} />;

  const { breadcrumb } = pageMeta[page];

  return (
    <>
      <AppShell role={role} page={page} onNav={setPage} onLogout={handleLogout}
        dark={dark} onToggleDark={toggleDark} breadcrumb={breadcrumb}
        onToggleAiAssistant={() => {}}
        userData={user} taPermissions={taPermissions}>
        {/* Admin pages */}
        {page === "admin-dashboard" && <AdminDashboard />}
        {page === "admin-teachers" && <AdminTeacherManagement />}
        {page === "admin-ai-ops" && <AdminAIOpsCenter />}
        {page === "admin-audit" && <AdminAuditLogs />}
        {page === "admin-config" && <AdminConfig />}
        {/* Teacher pages */}
        {page === "teacher-ai-analysis" && <TeacherAiAnalysis onOpenQuestion={(id, courseId) => { setFocusQuestion({ id, courseId }); setPage("teacher-bank"); }} />}
        {page === "teacher-dashboard" && <TeacherDashboard onNav={setPage} setSelectedStudentId={setSelectedStudentId} setSelectedCourseId={setSelectedCourseId} />}
        {page === "teacher-class" && <TeacherClassManagement onNav={setPage} setSelectedStudentId={setSelectedStudentId} setSelectedCourseId={setSelectedCourseId} />}
        {page === "teacher-import" && <TeacherDataImport />}
        {page === "teacher-profile" && <TeacherStudentProfile onNav={setPage} initialStudentId={selectedStudentId} initialCourseId={selectedCourseId} />}
        {page === "teacher-ai-quiz" && <TeacherAIQuiz onNav={setPage} />}
        {page === "teacher-bank" && <TeacherQuestionBank onNav={setPage} setSelectedQuizQuestions={setSelectedQuizQuestions} filterSourceType={filterSourceType} setFilterSourceType={setFilterSourceType} focusQuestion={focusQuestion} onClearFocusQuestion={() => setFocusQuestion(null)} />}
        {page === "teacher-exam" && <TeacherExamManagement selectedQuizQuestions={selectedQuizQuestions} setSelectedQuizQuestions={setSelectedQuizQuestions} />}
        {page === "teacher-notification" && <NotificationCenter mode="teacher" />}
        {page === "admin-notification" && <NotificationCenter mode="admin" />}
        {page === "student-notification" && <NotificationCenter mode="student" />}
        {page === "teacher-logs" && <TeacherOperationLogs />}
        {/* Teaching Assistant pages (复用教师端组件，按权限过滤) */}
        {page === "ta-dashboard" && <TeacherDashboard onNav={setPage} setSelectedStudentId={setSelectedStudentId} setSelectedCourseId={setSelectedCourseId} taPermissions={taPermissions} />}
        {page === "ta-import" && <TeacherDataImport />}
        {page === "ta-profile" && <TeacherStudentProfile onNav={setPage} initialStudentId={selectedStudentId} initialCourseId={selectedCourseId} />}
        {page === "ta-grading" && <TA_Grading />}
        {/* Student pages */}
        {page === "student-dashboard" && <StudentDashboard onNav={setPage} setSelectedCourseId={setSelectedCourseId} />}
        {page === "student-profile" && <StudentProfile />}
        {page === "student-score-trend" && <StudentScoreTrend />}
        {page === "student-wrong-book" && <StudentWrongBook />}
        {page === "student-exam" && <StudentExam />}
      </AppShell>
      {/* 悬浮 AI 问答助手：仅教师端使用本机 Ollama 问答 */}
      {role === "teacher" && <AIAssistant />}
    </>
  );
}
