// ─── 共享类型定义 ─────────────────────────────────────────────────────────────

export type Role = "admin" | "teacher" | "teaching-assistant" | "student";

export type Page =
  | "login"
  | "admin-dashboard" | "admin-teachers" | "admin-ai-ops" | "admin-audit" | "admin-config" | "admin-notification"
  | "teacher-ai-analysis" | "teacher-dashboard" | "teacher-class" | "teacher-import" | "teacher-profile" | "teacher-ai-quiz" | "teacher-bank" | "teacher-exam" | "teacher-notification" | "teacher-logs"
  | "ta-dashboard" | "ta-import" | "ta-profile" | "ta-grading"
  | "student-dashboard" | "student-profile" | "student-score-trend" | "student-wrong-book" | "student-exam" | "student-notification";
