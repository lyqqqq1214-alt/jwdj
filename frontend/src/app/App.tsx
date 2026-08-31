import { useState, useCallback, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, BookOpen, Settings, LogOut, ChevronRight,
  TrendingUp, GraduationCap, Bell, Search, Moon, Sun, Upload,
  FileText, CheckCircle, XCircle, Clock, Eye, Edit2, Trash2,
  Plus, Download, Filter, BarChart2, Brain, Target, Star, Heart,
  AlertCircle, BookMarked, Play, RotateCcw, ChevronDown, ChevronUp, ChevronLeft,
  Activity, Award, Layers, Zap, Menu, X, User, Calendar, Save,
  FileSearch, Wifi, WifiOff, Server, BarChart3, PieChart as PieChartIcon, History,
  Shield, Database, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Building2, GitCompare, Send, Code, GripVertical,
  Minimize2, Maximize2, Paperclip, RefreshCw, Sparkles
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { login, saveUser, getCurrentUser, clearUser, mapRole, logout } from "../services/authService";
import { getDashboardFull, getMyCourses, DashboardOverview, DashboardCharts, WarningStudent, ClassVO } from "../services/dashboardService";
import { getTeacherList, createTeacher, updateTeacher, deleteTeacher, updateTeacherStatus, resetTeacherPassword, TeacherVO } from "../services/teacherService";
import { getStudentOverview, getStudentTrends, getStudentWrongQuestions, getStudentCourses, StudentOverview, StudentCourse } from "../services/studentService";
import { getStudentProfile, toggleFocusStudent, generateAiEvaluation, generateAiSuggestions, getMyPortrait, generateMyAiSuggestions, StudentProfile as StudentProfileData, LearningSuggestion } from "../services/portraitService";
import { getMyClasses, getClassStudents, createClass, addStudentToClass, removeStudentFromClass, ClassVO as ClsVO, StudentVO } from "../services/classService";
import { getPendingExams, getExamPapers, createExamPaper, deleteExamPaper, publishExamPaper, closeExamPaper, getExamResults, submitExam, getStudentExam, getMyExamRecords, getMyExamResult, getGradingList, submitGrade, ExamPaper, ExamResultDTO, StudentExamVO, SubmitExamResultDTO, StudentExamRecordVO, StudentExamResultVO, GradingItemVO } from "../services/examService";
import { sendNotification, getMyNotifications, Notification as NotifItem } from "../services/notificationService";
import { getOperationLogs, OperationLog } from "../services/logService";
import { getAllConfigs, batchUpdateConfigs, SystemConfig } from "../services/configService";
import { uploadFile, getImportHistory, downloadTemplate as fetchTemplateBlob, ImportLog } from "../services/importService";
import { generateQuestions } from "../services/aiQuizService";
import { getQuestionList, getKnowledgeTree, QuestionBank, KnowledgePoint } from "../services/questionBankService";

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = "admin" | "teacher" | "teaching-assistant" | "student";
type Page =
  | "login"
  | "admin-dashboard" | "admin-teachers" | "admin-ai-ops" | "admin-audit" | "admin-config"
  | "teacher-dashboard" | "teacher-class" | "teacher-import" | "teacher-profile" | "teacher-ai-quiz" | "teacher-bank" | "teacher-exam" | "teacher-notification"
  | "ta-dashboard" | "ta-import" | "ta-profile" | "ta-grading"
  | "student-dashboard" | "student-profile" | "student-score-trend" | "student-wrong-book" | "student-exam";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const loginTrend = [
  { day: "周一", count: 342 }, { day: "周二", count: 418 }, { day: "周三", count: 389 },
  { day: "周四", count: 512 }, { day: "周五", count: 476 }, { day: "周六", count: 198 },
  { day: "周日", count: 156 },
];
const collegePie = [
  { name: "计算机学院", value: 38 }, { name: "数学学院", value: 22 },
  { name: "物理学院", value: 18 }, { name: "经管学院", value: 14 }, { name: "其他", value: 8 },
];
const PIE_COLORS = ["#1A56DB", "#0EA5E9", "#10B981", "#F59E0B", "#94A3B8"];

// 考勤状态归一化（英文→中文，中文原样返回）
const normalizeAttendanceStatus = (status: string): string => {
  if (!status) return "";
  const s = status.trim();
  const map: Record<string, string> = {
    PRESENT: "出勤", LATE: "迟到", LEAVE: "请假", ABSENT: "缺勤",
    出勤: "出勤", 迟到: "迟到", 请假: "请假", 缺勤: "缺勤",
  };
  return map[s] || map[s.toUpperCase()] || s;
};

// 考勤状态 → Tag 颜色
const getAttendanceTagColor = (status: string): string => {
  const s = normalizeAttendanceStatus(status);
  switch (s) {
    case "出勤": return "green";
    case "迟到": return "orange";
    case "请假": return "blue";
    case "缺勤": return "red";
    default: return "gray";
  }
};

const mockUsers = [
  { id: 1, uid: "2024001", name: "张伟", role: "student", college: "计算机学院", class: "2024级1班", status: "active", created: "2024-09-01 08:00" },
  { id: 2, uid: "2024002", name: "李娜", role: "student", college: "数学学院", class: "2024级2班", status: "active", created: "2024-09-01 08:05" },
  { id: 3, uid: "T2021001", name: "王建国", role: "teacher", college: "计算机学院", class: "—", status: "active", created: "2021-07-15 09:00" },
  { id: 4, uid: "T2019002", name: "刘晓红", role: "teacher", college: "数学学院", class: "—", status: "active", created: "2019-09-01 09:00" },
  { id: 5, uid: "A0001", name: "陈系统", role: "admin", college: "信息中心", class: "—", status: "active", created: "2018-01-01 00:00" },
  { id: 6, uid: "2024003", name: "赵磊", role: "student", college: "物理学院", class: "2024级3班", status: "inactive", created: "2024-09-01 08:10" },
];

const mockTeachers = [
  { id: 1, staffId: "T2021001", name: "王建国", account: "T2021001", status: "active", createdAt: "2021-07-15", lastLogin: "2025-03-12 14:30" },
  { id: 2, staffId: "T2019002", name: "刘晓红", account: "T2019002", status: "active", createdAt: "2019-09-01", lastLogin: "2025-03-12 16:45" },
  { id: 3, staffId: "T2020003", name: "张明远", account: "T2020003", status: "active", createdAt: "2020-03-15", lastLogin: "2025-03-11 09:20" },
  { id: 4, staffId: "T2022004", name: "陈志强", account: "T2022004", status: "inactive", createdAt: "2022-08-20", lastLogin: "2024-12-20 10:15" },
  { id: 5, staffId: "T2018005", name: "王丽华", account: "T2018005", status: "active", createdAt: "2018-06-10", lastLogin: "2025-03-12 08:00" },
  { id: 6, staffId: "T2023006", name: "刘鹏飞", account: "T2023006", status: "active", createdAt: "2023-09-01", lastLogin: "2025-03-10 15:30" },
];

const mockCourses = [
  { id: 1, code: "CS101", name: "高等数学A", teacher: "刘晓红", college: "数学学院", semester: "2024-2025第二学期", students: 48, status: "active" },
  { id: 2, code: "CS201", name: "线性代数", teacher: "刘晓红", college: "数学学院", semester: "2024-2025第二学期", students: 52, status: "active" },
  { id: 3, code: "CS301", name: "数据结构", teacher: "王建国", college: "计算机学院", semester: "2024-2025第二学期", students: 45, status: "active" },
  { id: 4, code: "CS401", name: "操作系统", teacher: "王建国", college: "计算机学院", semester: "2024-2025第一学期", students: 40, status: "ended" },
];

const classDashboardData: Record<number, {
  avgScore: string;
  attendanceRate: string;
  homeworkRate: string;
  scoreDist: { range: string; count: number }[];
  scoreTrend: { exam: string; score: number; type: string }[];
  attendanceStats: { status: string; count: number }[];
  homeworkSubmitStats: { homework: string; onTime: number; late: number; notSubmit: number }[];
  attendanceTrend: { week: string; rate: number }[];
  knowledgeData: { subject: string; value: number }[];
}> = {
  1: {
    avgScore: "78.5",
    attendanceRate: "93.8%",
    homeworkRate: "90%",
    scoreDist: [
      { range: "0-59", count: 3 }, { range: "60-69", count: 6 },
      { range: "70-79", count: 14 }, { range: "80-89", count: 16 }, { range: "90-100", count: 5 },
    ],
    scoreTrend: [
      { exam: "第1次作业", score: 82, type: "homework" }, { exam: "第2次作业", score: 76, type: "homework" },
      { exam: "第3次作业", score: 80, type: "homework" }, { exam: "第4次作业", score: 85, type: "homework" },
      { exam: "第5次作业", score: 78, type: "homework" },
      { exam: "第1次测验", score: 75, type: "test" }, { exam: "第2次测验", score: 72, type: "test" },
      { exam: "期中考试", score: 78, type: "test" }, { exam: "第3次测验", score: 82, type: "test" },
      { exam: "第4次测验", score: 80, type: "test" }, { exam: "期末考试", score: 85, type: "test" },
      { exam: "第1次实验", score: 88, type: "experiment" }, { exam: "第2次实验", score: 84, type: "experiment" },
      { exam: "第3次实验", score: 86, type: "experiment" },
    ],
    attendanceStats: [
      { status: "出勤", count: 145 },
      { status: "迟到", count: 10 },
      { status: "请假", count: 6 },
      { status: "缺勤", count: 4 },
    ],
    homeworkSubmitStats: [
      { homework: "第1次", onTime: 45, late: 2, notSubmit: 1 },
      { homework: "第2次", onTime: 42, late: 3, notSubmit: 3 },
      { homework: "第3次", onTime: 44, late: 1, notSubmit: 3 },
      { homework: "第4次", onTime: 43, late: 4, notSubmit: 1 },
      { homework: "第5次", onTime: 40, late: 5, notSubmit: 3 },
    ],
    attendanceTrend: [
      { week: "第1周", rate: 98 }, { week: "第2周", rate: 96 }, { week: "第3周", rate: 95 },
      { week: "第4周", rate: 92 }, { week: "第5周", rate: 94 }, { week: "第6周", rate: 91 },
      { week: "第7周", rate: 89 }, { week: "第8周", rate: 93 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 82 }, { subject: "路由与交换", value: 76 },
      { subject: "HTTP协议", value: 85 }, { subject: "网络安全", value: 70 },
      { subject: "网络编程", value: 68 },
    ],
  },
  2: {
    avgScore: "72.3",
    attendanceRate: "88.5%",
    homeworkRate: "82%",
    scoreDist: [
      { range: "0-59", count: 8 }, { range: "60-69", count: 12 },
      { range: "70-79", count: 10 }, { range: "80-89", count: 8 }, { range: "90-100", count: 2 },
    ],
    scoreTrend: [
      { exam: "第1次作业", score: 75, type: "homework" }, { exam: "第2次作业", score: 70, type: "homework" },
      { exam: "第3次作业", score: 72, type: "homework" }, { exam: "第4次作业", score: 78, type: "homework" },
      { exam: "第5次作业", score: 68, type: "homework" },
      { exam: "第1次测验", score: 68, type: "test" }, { exam: "第2次测验", score: 65, type: "test" },
      { exam: "期中考试", score: 72, type: "test" }, { exam: "第3次测验", score: 75, type: "test" },
      { exam: "第4次测验", score: 70, type: "test" }, { exam: "期末考试", score: 76, type: "test" },
      { exam: "第1次实验", score: 82, type: "experiment" }, { exam: "第2次实验", score: 78, type: "experiment" },
      { exam: "第3次实验", score: 80, type: "experiment" },
    ],
    attendanceStats: [
      { status: "出勤", count: 135 },
      { status: "迟到", count: 15 },
      { status: "请假", count: 10 },
      { status: "缺勤", count: 10 },
    ],
    homeworkSubmitStats: [
      { homework: "第1次", onTime: 38, late: 4, notSubmit: 6 },
      { homework: "第2次", onTime: 35, late: 5, notSubmit: 8 },
      { homework: "第3次", onTime: 36, late: 6, notSubmit: 6 },
      { homework: "第4次", onTime: 40, late: 3, notSubmit: 5 },
      { homework: "第5次", onTime: 34, late: 7, notSubmit: 7 },
    ],
    attendanceTrend: [
      { week: "第1周", rate: 95 }, { week: "第2周", rate: 92 }, { week: "第3周", rate: 88 },
      { week: "第4周", rate: 85 }, { week: "第5周", rate: 87 }, { week: "第6周", rate: 84 },
      { week: "第7周", rate: 82 }, { week: "第8周", rate: 86 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 72 }, { subject: "路由与交换", value: 65 },
      { subject: "HTTP协议", value: 75 }, { subject: "网络安全", value: 58 },
      { subject: "网络编程", value: 55 },
    ],
  },
  3: {
    avgScore: "85.2",
    attendanceRate: "98.2%",
    homeworkRate: "98%",
    scoreDist: [
      { range: "0-59", count: 1 }, { range: "60-69", count: 2 },
      { range: "70-79", count: 6 }, { range: "80-89", count: 18 }, { range: "90-100", count: 13 },
    ],
    scoreTrend: [
      { exam: "第1次作业", score: 90, type: "homework" }, { exam: "第2次作业", score: 88, type: "homework" },
      { exam: "第3次作业", score: 92, type: "homework" }, { exam: "第4次作业", score: 95, type: "homework" },
      { exam: "第5次作业", score: 91, type: "homework" },
      { exam: "第1次测验", score: 82, type: "test" }, { exam: "第2次测验", score: 85, type: "test" },
      { exam: "期中考试", score: 88, type: "test" }, { exam: "第3次测验", score: 90, type: "test" },
      { exam: "第4次测验", score: 87, type: "test" }, { exam: "期末考试", score: 92, type: "test" },
      { exam: "第1次实验", score: 95, type: "experiment" }, { exam: "第2次实验", score: 92, type: "experiment" },
      { exam: "第3次实验", score: 94, type: "experiment" },
    ],
    attendanceStats: [
      { status: "出勤", count: 155 },
      { status: "迟到", count: 3 },
      { status: "请假", count: 2 },
      { status: "缺勤", count: 0 },
    ],
    homeworkSubmitStats: [
      { homework: "第1次", onTime: 50, late: 0, notSubmit: 0 },
      { homework: "第2次", onTime: 49, late: 1, notSubmit: 0 },
      { homework: "第3次", onTime: 50, late: 0, notSubmit: 0 },
      { homework: "第4次", onTime: 49, late: 1, notSubmit: 0 },
      { homework: "第5次", onTime: 48, late: 2, notSubmit: 0 },
    ],
    attendanceTrend: [
      { week: "第1周", rate: 100 }, { week: "第2周", rate: 99 }, { week: "第3周", rate: 98 },
      { week: "第4周", rate: 97 }, { week: "第5周", rate: 99 }, { week: "第6周", rate: 98 },
      { week: "第7周", rate: 98 }, { week: "第8周", rate: 99 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 90 }, { subject: "路由与交换", value: 88 },
      { subject: "HTTP协议", value: 92 }, { subject: "网络安全", value: 85 },
      { subject: "网络编程", value: 82 },
    ],
  },
};

const attendanceTrend = [
  { week: "第1周", rate: 98 }, { week: "第2周", rate: 96 }, { week: "第3周", rate: 94 },
  { week: "第4周", rate: 91 }, { week: "第5周", rate: 95 }, { week: "第6周", rate: 93 },
  { week: "第7周", rate: 88 }, { week: "第8周", rate: 90 },
];

const knowledgeData = [
  { subject: "微积分", value: 82 }, { subject: "线性代数", value: 74 },
  { subject: "概率统计", value: 65 }, { subject: "微分方程", value: 38 },
  { subject: "级数理论", value: 55 },
];

const quizItems = [
  { id: 1, course: "高等数学A", preview: "设函数f(x)在x=a处可导，则lim...", topic: "微分方程", difficulty: "中等", status: "pending", answer: "B" },
  { id: 2, course: "线性代数", preview: "设A为n阶方阵，若A的行列式不为零...", topic: "行列式", difficulty: "困难", status: "approved", answer: "A" },
  { id: 3, course: "高等数学A", preview: "求不定积分∫x²e^x dx = ?", topic: "积分学", difficulty: "简单", status: "rejected", answer: "C" },
  { id: 4, course: "数据结构", preview: "以下哪种排序算法的最坏时间复杂度为O(n²)?", topic: "排序算法", difficulty: "中等", status: "pending", answer: "D" },
];

const teacherStudents = [
  { uid: "2024001", name: "张伟", attendance: 14, regular: 85, final: 78, total: 82, weak: "微分方程", analyzed: true },
  { uid: "2024002", name: "李娜", attendance: 16, regular: 92, final: 88, total: 90, weak: "—", analyzed: true },
  { uid: "2024003", name: "赵磊", attendance: 10, regular: 60, final: 55, total: 57, weak: "微积分,微分方程", analyzed: true },
  { uid: "2024004", name: "陈小明", attendance: 15, regular: 76, final: 70, total: 73, weak: "级数理论", analyzed: false },
  { uid: "2024005", name: "周婷", attendance: 16, regular: 88, final: 84, total: 86, weak: "—", analyzed: true },
];

const studentCourses = [
  { id: 1, code: "CS301", name: "数据结构", teacher: "王建国", total: 82, rank: "15/48", weak: 2, analyzed: true, progress: 65, attendance: 93.8, submissionRate: 95 },
  { id: 2, code: "CS401", name: "计算机网络", teacher: "李明辉", total: 74, rank: "28/52", weak: 1, analyzed: true, progress: 80, attendance: 96.2, submissionRate: 92 },
  { id: 3, code: "CS402", name: "操作系统", teacher: "张教授", total: null, rank: "—", weak: 0, analyzed: false, progress: 45, attendance: 87.5, submissionRate: 88 },
  { id: 4, code: "CS403", name: "计算机系统", teacher: "王老师", total: 88, rank: "8/46", weak: 0, analyzed: true, progress: 70, attendance: 98.0, submissionRate: 100 },
  { id: 5, code: "CS404", name: "数据库系统", teacher: "刘教授", total: null, rank: "—", weak: 1, analyzed: false, progress: 55, attendance: 91.5, submissionRate: 90 },
];

const teacherClasses = [
  { id: 1, name: "2024级1班", course: "计算机网络", semester: "2024-2025第二学期", studentCount: 48 },
  { id: 2, name: "2024级2班", course: "计算机网络", semester: "2024-2025第二学期", studentCount: 52 },
  { id: 3, name: "2024级1班", course: "操作系统", semester: "2024-2025第二学期", studentCount: 45 },
];

const teachingAssistants = [
  { id: 1, staffId: "TA2024001", name: "陈晓峰", account: "TA2024001", status: "active", createdAt: "2024-09-01", lastLogin: "2025-03-12 15:00" },
  { id: 2, staffId: "TA2024002", name: "林雨萱", account: "TA2024002", status: "active", createdAt: "2024-09-01", lastLogin: "2025-03-12 16:00" },
];

const taPermissions: Record<string, {
  allowedClasses: number[];
  canImport: boolean;
  canGrade: boolean;
  canViewProfile: boolean;
}> = {
  "TA2024001": {
    allowedClasses: [1, 3],
    canImport: true,
    canGrade: true,
    canViewProfile: true,
  },
  "TA2024002": {
    allowedClasses: [2],
    canImport: false,
    canGrade: true,
    canViewProfile: false,
  },
};

const gradingTasks = [
  { id: 1, examId: 1, examName: "计算机网络 - 期中考试", classId: 1, className: "2024级1班", totalQuestions: 6, gradedCount: 4, status: "in-progress" },
  { id: 2, examId: 1, examName: "计算机网络 - 期中考试", classId: 2, className: "2024级2班", totalQuestions: 6, gradedCount: 0, status: "pending" },
  { id: 3, examId: 2, examName: "操作系统 - 单元测验", classId: 3, className: "2024级1班", totalQuestions: 5, gradedCount: 3, status: "in-progress" },
];

const subjectiveQuestions = [
  { id: 1, examId: 1, examName: "计算机网络 - 期中考试", studentId: "2024001", studentName: "张伟", question: "简述TCP三次握手的过程。",
    myAnswer: "第一次客户端发送SYN请求，第二次服务器回应SYN+ACK，第三次客户端发送ACK确认。",
    aiSuggestion: "回答准确，涵盖了三次握手的基本过程，但可以进一步说明各阶段的状态转换和SYN、ACK标志位的具体含义。建议给分：14/15",
    score: null, comment: "", graded: false },
  { id: 2, examId: 1, examName: "计算机网络 - 期中考试", studentId: "2024002", studentName: "李娜", question: "简述TCP三次握手的过程。",
    myAnswer: "TCP三次握手过程如下：第一次握手（SYN）：客户端向服务器发送SYN报文，请求建立连接；第二次握手（SYN+ACK）：服务器收到SYN后，回复SYN+ACK报文，确认收到并同意建立连接；第三次握手（ACK）：客户端收到SYN+ACK后，发送ACK报文确认，连接建立完成。",
    aiSuggestion: "回答完整准确，详细说明了三次握手的每个阶段及其作用，逻辑清晰。建议给分：15/15",
    score: 15, comment: "回答完整准确", graded: true },
  { id: 3, examId: 1, examName: "计算机网络 - 期中考试", studentId: "2024003", studentName: "赵磊", question: "简述TCP三次握手的过程。",
    myAnswer: "客户端发SYN，服务器回应，然后就建立连接了。",
    aiSuggestion: "回答过于简略，只提到了基本流程，没有说明SYN+ACK的作用和第三次握手的必要性。建议给分：6/15",
    score: null, comment: "", graded: false },
  { id: 4, examId: 2, examName: "操作系统 - 单元测验", studentId: "2024013", studentName: "马丽", question: "简述死锁产生的四个必要条件。",
    myAnswer: "互斥条件、请求与保持条件、不剥夺条件、循环等待条件。",
    aiSuggestion: "回答准确列出了四个必要条件，但没有给出每个条件的具体解释。建议给分：12/15",
    score: 12, comment: "列出了四个条件，但缺少解释", graded: true },
  { id: 5, examId: 2, examName: "操作系统 - 单元测验", studentId: "2024014", studentName: "朱伟", question: "简述死锁产生的四个必要条件。",
    myAnswer: "死锁产生需要四个条件：1.互斥条件，资源不能被共享；2.请求与保持条件，进程保持已有的资源并请求新的资源；3.不剥夺条件，资源不能被强制剥夺；4.循环等待条件，多个进程形成循环等待链。",
    aiSuggestion: "回答完整准确，不仅列出了四个条件，还对每个条件进行了清晰的解释。建议给分：15/15",
    score: null, comment: "", graded: false },
  { id: 6, examId: 2, examName: "操作系统 - 单元测验", studentId: "2024015", studentName: "胡杰", question: "简述死锁产生的四个必要条件。",
    myAnswer: "不知道",
    aiSuggestion: "未作答，建议给分：0/15",
    score: null, comment: "", graded: false },
];

const classStudents = {
  1: [
    { uid: "2024001", name: "张伟", gender: "男", dataTypes: ["考勤", "成绩", "作业"] },
    { uid: "2024002", name: "李娜", gender: "女", dataTypes: ["考勤", "成绩", "作业"] },
    { uid: "2024003", name: "赵磊", gender: "男", dataTypes: ["考勤"] },
    { uid: "2024004", name: "陈小明", gender: "男", dataTypes: ["考勤", "成绩"] },
    { uid: "2024005", name: "周婷", gender: "女", dataTypes: ["考勤", "成绩", "作业"] },
    { uid: "2024006", name: "吴涛", gender: "男", dataTypes: ["考勤", "作业"] },
    { uid: "2024007", name: "郑芳", gender: "女", dataTypes: ["考勤", "成绩", "作业"] },
    { uid: "2024008", name: "孙强", gender: "男", dataTypes: ["考勤"] },
  ],
  2: [
    { uid: "2024009", name: "钱敏", gender: "女", dataTypes: ["考勤", "成绩", "作业"] },
    { uid: "2024010", name: "林涛", gender: "男", dataTypes: ["考勤", "成绩"] },
    { uid: "2024011", name: "黄丽", gender: "女", dataTypes: ["考勤", "作业"] },
    { uid: "2024012", name: "徐军", gender: "男", dataTypes: ["考勤", "成绩", "作业"] },
  ],
  3: [
    { uid: "2024013", name: "马丽", gender: "女", dataTypes: ["考勤", "成绩", "作业"] },
    { uid: "2024014", name: "朱伟", gender: "男", dataTypes: ["考勤", "成绩"] },
    { uid: "2024015", name: "胡杰", gender: "男", dataTypes: ["考勤", "作业"] },
  ],
};

const warningStudents = [
  { uid: "2024003", name: "赵磊", type: "成绩下滑", time: "2025-03-12", severity: "高" },
  { uid: "2024008", name: "孙强", type: "缺勤过多", time: "2025-03-11", severity: "高" },
  { uid: "2024004", name: "陈小明", type: "作业连续未交", time: "2025-03-10", severity: "中" },
  { uid: "2024015", name: "胡杰", type: "成绩下滑", time: "2025-03-09", severity: "中" },
  { uid: "2024006", name: "吴涛", type: "缺勤过多", time: "2025-03-08", severity: "低" },
];

const attendanceStats = [
  { status: "出勤", count: 145 },
  { status: "迟到", count: 12 },
  { status: "请假", count: 8 },
  { status: "缺勤", count: 5 },
];

const homeworkSubmitStats = [
  { homework: "第1次", onTime: 45, late: 3, notSubmit: 0 },
  { homework: "第2次", onTime: 42, late: 4, notSubmit: 2 },
  { homework: "第3次", onTime: 40, late: 5, notSubmit: 3 },
  { homework: "第4次", onTime: 44, late: 2, notSubmit: 2 },
  { homework: "第5次", onTime: 38, late: 6, notSubmit: 4 },
];

const classKnowledgeData = [
  { subject: "TCP/IP协议", value: 85 },
  { subject: "路由与交换", value: 78 },
  { subject: "网络安全", value: 72 },
  { subject: "HTTP协议", value: 88 },
  { subject: "网络编程", value: 65 },
];

const teacherQuestions = [
  { id: 1, type: "choice", preview: "TCP三次握手过程中，第二次握手时服务器发送的报文段中，SYN和ACK标志位的值分别是：", topic: "TCP连接管理", difficulty: "中等", createdAt: "2025-03-01", usedCount: 3, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 2, type: "choice", preview: "HTTP/1.1协议中，使用持久连接的默认方式是：", topic: "HTTP协议", difficulty: "简单", createdAt: "2025-02-28", usedCount: 5, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 3, type: "judge", preview: "UDP协议是面向连接的可靠传输协议。", topic: "UDP协议", difficulty: "简单", createdAt: "2025-02-25", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 4, type: "choice", preview: "以下哪种路由协议属于链路状态协议？A.RIP B.OSPF C.BGP D.EIGRP", topic: "路由协议", difficulty: "中等", createdAt: "2025-02-20", usedCount: 1, sourceType: "postgraduate", sourceLabel: "2020年408统考真题", isPostgraduate: true },
  { id: 5, type: "text", preview: "简述TCP四次挥手的过程及各阶段的状态转换，说明TIME_WAIT状态存在的原因。", topic: "TCP连接管理", difficulty: "困难", createdAt: "2025-02-18", usedCount: 0, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 6, type: "choice", preview: "HTTPS使用的默认端口号是：", topic: "HTTPS", difficulty: "简单", createdAt: "2025-02-15", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 7, type: "choice", preview: "在TCP/IP体系结构中，ICMP协议位于哪一层？", topic: "ICMP协议", difficulty: "中等", createdAt: "2025-02-10", usedCount: 4, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 8, type: "choice", preview: "IP地址192.168.1.1/24的子网掩码是：", topic: "IP地址", difficulty: "简单", createdAt: "2025-02-05", usedCount: 6, sourceType: "postgraduate", sourceLabel: "2020年408统考真题", isPostgraduate: true },
  { id: 9, type: "text", preview: "某单位分配到一个地址块136.23.12.64/26。现在需要进一步划分为4个一样大的子网，计算每个子网的网络地址、子网掩码和可用主机数。", topic: "IP地址", difficulty: "困难", createdAt: "2025-01-28", usedCount: 1, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 10, type: "choice", preview: "以下关于TCP滑动窗口的描述，正确的是：", topic: "TCP流量控制", difficulty: "中等", createdAt: "2025-01-20", usedCount: 3, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 11, type: "choice", preview: "DNS解析过程中，递归查询和迭代查询的区别是：", topic: "DNS协议", difficulty: "中等", createdAt: "2025-01-15", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 12, type: "judge", preview: "TCP协议的拥塞控制采用慢开始、拥塞避免、快重传和快恢复策略。", topic: "TCP拥塞控制", difficulty: "简单", createdAt: "2025-01-10", usedCount: 4, sourceType: "postgraduate", sourceLabel: "2020年408统考真题", isPostgraduate: true },
  { id: 13, type: "text", preview: "对比TCP和UDP协议的特点，说明在什么情况下应该使用TCP，什么情况下应该使用UDP。", topic: "TCP与UDP", difficulty: "困难", createdAt: "2025-01-05", usedCount: 0, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 14, type: "choice", preview: "HTTP状态码304表示：", topic: "HTTP状态码", difficulty: "中等", createdAt: "2024-12-28", usedCount: 3, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 15, type: "choice", preview: "在OSPF协议中，用于描述区域内路由器链路状态的LSA类型是：", topic: "OSPF协议", difficulty: "困难", createdAt: "2024-12-20", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 16, type: "text", preview: "简述HTTPS协议的工作原理，说明SSL/TLS握手过程中各阶段的作用。", topic: "HTTPS", difficulty: "困难", createdAt: "2024-12-15", usedCount: 1, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 17, type: "choice", preview: "以下哪种攻击属于网络层攻击？A.DDoS B.SQL注入 C.ARP欺骗 D.XSS", topic: "网络安全", difficulty: "中等", createdAt: "2024-12-10", usedCount: 4, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 18, type: "judge", preview: "TCP协议的序号和确认号是基于字节流的。", topic: "TCP可靠传输", difficulty: "简单", createdAt: "2024-12-05", usedCount: 5, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 19, type: "choice", preview: "IPv6地址的长度是：", topic: "IPv6", difficulty: "简单", createdAt: "2024-11-28", usedCount: 6, sourceType: "postgraduate", sourceLabel: "2020年408统考真题", isPostgraduate: true },
  { id: 20, type: "text", preview: "设TCP的拥塞窗口cwnd的初始值为1（单位为报文段），慢开始门限ssthresh=16。当cwnd增长到16时，改用拥塞避免算法。试画出拥塞窗口随传输轮次变化的曲线，假设在第16轮次出现超时。", topic: "TCP拥塞控制", difficulty: "困难", createdAt: "2024-11-20", usedCount: 0, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 21, type: "choice", preview: "FTP协议使用的默认端口号是：", topic: "FTP协议", difficulty: "简单", createdAt: "2024-11-15", usedCount: 3, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 22, type: "choice", preview: "在TCP连接中，FIN_WAIT_1状态的含义是：", topic: "TCP状态转换", difficulty: "中等", createdAt: "2024-11-10", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 23, type: "judge", preview: "IP协议是面向连接的可靠传输协议。", topic: "IP协议", difficulty: "简单", createdAt: "2024-11-05", usedCount: 4, sourceType: "postgraduate", sourceLabel: "2020年408统考真题", isPostgraduate: true },
  { id: 24, type: "text", preview: "某主机的IP地址为192.168.1.100，子网掩码为255.255.255.192。试确定该主机所在子网的网络地址、广播地址和可用主机范围。", topic: "IP地址", difficulty: "困难", createdAt: "2024-10-28", usedCount: 1, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 25, type: "choice", preview: "以下关于HTTP/2协议的描述，错误的是：", topic: "HTTP协议", difficulty: "中等", createdAt: "2024-10-20", usedCount: 3, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 26, type: "choice", preview: "在BGP协议中，用于在AS之间交换路由信息的协议是：", topic: "BGP协议", difficulty: "困难", createdAt: "2024-10-15", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 27, type: "text", preview: "简述TCP三次握手过程中，客户端和服务器端的状态变化过程。", topic: "TCP连接管理", difficulty: "中等", createdAt: "2024-10-10", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 28, type: "choice", preview: "SMTP协议使用的默认端口号是：", topic: "SMTP协议", difficulty: "简单", createdAt: "2024-10-05", usedCount: 4, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 29, type: "judge", preview: "UDP协议的首部长度是固定的8字节。", topic: "UDP协议", difficulty: "简单", createdAt: "2024-09-28", usedCount: 5, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 30, type: "choice", preview: "以下关于TCP计时器的描述，正确的是：", topic: "TCP计时器", difficulty: "中等", createdAt: "2024-09-20", usedCount: 3, sourceType: "postgraduate", sourceLabel: "2020年408统考真题", isPostgraduate: true },
  { id: 31, type: "text", preview: "对比HTTP/1.1和HTTP/2协议的主要区别，说明HTTP/2的优势。", topic: "HTTP协议", difficulty: "困难", createdAt: "2024-09-15", usedCount: 0, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 32, type: "choice", preview: "在TCP连接中，CLOSE_WAIT状态的含义是：", topic: "TCP状态转换", difficulty: "中等", createdAt: "2024-09-10", usedCount: 2, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 33, type: "choice", preview: "以下哪种协议属于应用层协议？A.IP B.TCP C.DNS D.ARP", topic: "应用层协议", difficulty: "简单", createdAt: "2024-09-05", usedCount: 6, sourceType: "postgraduate", sourceLabel: "2021年408统考真题", isPostgraduate: true },
  { id: 34, type: "text", preview: "简述TCP流量控制的原理，说明滑动窗口的作用。", topic: "TCP流量控制", difficulty: "中等", createdAt: "2024-08-28", usedCount: 1, sourceType: "postgraduate", sourceLabel: "2023年408统考真题", isPostgraduate: true },
  { id: 35, type: "choice", preview: "HTTP请求方法中，用于获取资源的方法是：", topic: "HTTP方法", difficulty: "简单", createdAt: "2024-08-20", usedCount: 4, sourceType: "postgraduate", sourceLabel: "2022年408统考真题", isPostgraduate: true },
  { id: 36, type: "choice", preview: "TCP协议使用三次握手建立连接的目的是什么？", topic: "TCP连接管理", difficulty: "中等", createdAt: "2025-03-05", usedCount: 2, sourceType: "ai-generated", sourceLabel: "AI生成题目", isPostgraduate: false },
  { id: 37, type: "text", preview: "简述IP地址分类方法，并举例说明各类地址的范围。", topic: "IP地址", difficulty: "中等", createdAt: "2025-03-04", usedCount: 1, sourceType: "ai-generated", sourceLabel: "AI生成题目", isPostgraduate: false },
  { id: 38, type: "choice", preview: "以下哪个不是TCP协议的计时器？A.重传计时器 B.坚持计时器 C.超时计时器 D.流量计时器", topic: "TCP计时器", difficulty: "困难", createdAt: "2025-03-03", usedCount: 0, sourceType: "ai-generated", sourceLabel: "AI生成题目", isPostgraduate: false },
  { id: 39, type: "judge", preview: "TCP协议的确认号表示期望收到的下一个字节的序号。", topic: "TCP可靠传输", difficulty: "简单", createdAt: "2025-03-02", usedCount: 3, sourceType: "ai-generated", sourceLabel: "AI生成题目", isPostgraduate: false },
  { id: 40, type: "choice", preview: "DNS域名解析过程中，递归查询发生在：", topic: "DNS协议", difficulty: "中等", createdAt: "2025-03-01", usedCount: 1, sourceType: "teacher-upload", sourceLabel: "教师上传", isPostgraduate: false },
  { id: 41, type: "text", preview: "某网络的IP地址范围为192.168.5.0/24，需要划分6个子网，每个子网至少30台主机。请计算子网掩码和每个子网的地址范围。", topic: "IP地址", difficulty: "困难", createdAt: "2025-02-28", usedCount: 0, sourceType: "teacher-upload", sourceLabel: "教师上传", isPostgraduate: false },
  { id: 42, type: "choice", preview: "TCP拥塞控制中，快重传的触发条件是：", topic: "TCP拥塞控制", difficulty: "中等", createdAt: "2025-02-25", usedCount: 2, sourceType: "wrong-derived", sourceLabel: "错题衍生（期中考试）", isPostgraduate: false, relatedExamId: 1 },
  { id: 43, type: "text", preview: "结合TCP状态转换图，说明客户端和服务器端在连接建立和释放过程中的状态变化。", topic: "TCP状态转换", difficulty: "困难", createdAt: "2025-02-20", usedCount: 0, sourceType: "wrong-derived", sourceLabel: "错题衍生（期中考试）", isPostgraduate: false, relatedExamId: 1 },
];

const questionCategories = [
  { name: "TCP连接管理", sections: ["三次握手", "四次挥手", "状态转换", "TIME_WAIT"] },
  { name: "TCP可靠传输", sections: ["序号与确认", "重传机制", "滑动窗口", "流量控制"] },
  { name: "TCP拥塞控制", sections: ["慢开始", "拥塞避免", "快重传", "快恢复"] },
  { name: "UDP协议", sections: ["特点", "首部格式", "应用场景"] },
  { name: "IP协议", sections: ["IP地址", "子网划分", "路由选择", "ICMP协议"] },
  { name: "路由协议", sections: ["RIP", "OSPF", "BGP", "链路状态"] },
  { name: "HTTP协议", sections: ["HTTP/1.1", "HTTP/2", "状态码", "请求方法"] },
  { name: "网络安全", sections: ["HTTPS", "SSL/TLS", "攻击类型", "防火墙"] },
  { name: "应用层协议", sections: ["DNS", "FTP", "SMTP", "POP3"] },
  { name: "IPv6", sections: ["地址格式", "地址类型", "过渡技术"] },
];

const teacherExams = [
  { id: 1, name: "计算机网络 - 期中考试", classes: ["2024级1班", "2024级2班"], publishTime: "2025-03-01", deadline: "2025-03-20 18:00", participants: 95, avgScore: 78.5, status: "ended" },
  { id: 2, name: "计算机网络 - 第1次测验", classes: ["2024级1班"], publishTime: "2025-02-10", deadline: "2025-02-15 23:59", participants: 48, avgScore: 75.2, status: "ended" },
  { id: 3, name: "操作系统 - 单元测验", classes: ["2024级1班"], publishTime: "2025-03-10", deadline: "2025-03-25 20:00", participants: 45, avgScore: null, status: "in-progress" },
];

const examDetails = {
  1: {
    avgScore: 78.5, maxScore: 98, minScore: 55, passRate: 91.5,
    scoreDist: [{ range: "0-59", count: 4 }, { range: "60-69", count: 10 }, { range: "70-79", count: 32 }, { range: "80-89", count: 35 }, { range: "90-100", count: 14 }],
    questionAccuracy: [
      { qid: 1, accuracy: 0.88 }, { qid: 2, accuracy: 0.75 }, { qid: 3, accuracy: 0.92 },
      { qid: 4, accuracy: 0.68 }, { qid: 5, accuracy: 0.62 }, { qid: 6, accuracy: 0.80 },
    ],
    studentScores: [
      { uid: "2024001", name: "张伟", score: 85, submitTime: "2025-03-20 14:30", graded: true },
      { uid: "2024002", name: "李娜", score: 96, submitTime: "2025-03-20 15:00", graded: true },
      { uid: "2024003", name: "赵磊", score: 58, submitTime: "2025-03-20 16:30", graded: true },
      { uid: "2024004", name: "陈小明", score: 75, submitTime: "2025-03-20 13:45", graded: true },
      { uid: "2024005", name: "周婷", score: 88, submitTime: "2025-03-20 15:30", graded: true },
    ],
    studentAnswers: {
      "2024001": [
        { qid: 1, answer: 0, score: 20, comment: "正确" },
        { qid: 2, answer: 0, score: 20, comment: "正确" },
        { qid: 3, answer: 2, score: 0, comment: "错误，IPv6地址长度为128位" },
        { qid: 4, answer: 0, score: 10, comment: "正确" },
        { qid: 5, answer: 0, score: 20, comment: "正确" },
        { qid: 6, answer: "客户端发送SYN，服务器回应SYN+ACK，客户端发送ACK", score: 15, comment: "回答完整准确" },
      ],
      "2024002": [
        { qid: 1, answer: 0, score: 20, comment: "正确" },
        { qid: 2, answer: 0, score: 20, comment: "正确" },
        { qid: 3, answer: 0, score: 20, comment: "正确" },
        { qid: 4, answer: 0, score: 10, comment: "正确" },
        { qid: 5, answer: 0, score: 20, comment: "正确" },
        { qid: 6, answer: "三次握手：1.客户端发SYN；2.服务器发SYN+ACK；3.客户端发ACK", score: 20, comment: "回答完整，逻辑清晰" },
      ],
      "2024003": [
        { qid: 1, answer: 2, score: 0, comment: "错误，第一次握手只发送SYN" },
        { qid: 2, answer: 1, score: 0, comment: "错误，TCP是面向连接的" },
        { qid: 3, answer: 1, score: 0, comment: "错误，IPv4地址长度为32位" },
        { qid: 4, answer: 1, score: 0, comment: "错误，HTTP默认使用80端口" },
        { qid: 5, answer: 1, score: 0, comment: "错误，TCP连接释放需要4次握手" },
        { qid: 6, answer: "客户端和服务器互相发送确认", score: 8, comment: "回答过于简略，缺少关键步骤" },
      ],
      "2024004": [
        { qid: 1, answer: 0, score: 20, comment: "正确" },
        { qid: 2, answer: 0, score: 20, comment: "正确" },
        { qid: 3, answer: 0, score: 20, comment: "正确" },
        { qid: 4, answer: 0, score: 10, comment: "正确" },
        { qid: 5, answer: 1, score: 0, comment: "错误，TCP连接释放需要4次握手" },
        { qid: 6, answer: "TCP三次握手：首先客户端发送SYN请求，服务器收到后回复SYN+ACK，最后客户端发送ACK确认", score: 18, comment: "回答准确，表述清晰" },
      ],
      "2024005": [
        { qid: 1, answer: 0, score: 20, comment: "正确" },
        { qid: 2, answer: 0, score: 20, comment: "正确" },
        { qid: 3, answer: 0, score: 20, comment: "正确" },
        { qid: 4, answer: 0, score: 10, comment: "正确" },
        { qid: 5, answer: 0, score: 20, comment: "正确" },
        { qid: 6, answer: "TCP三次握手过程：客户端先发送SYN建立连接请求，服务器收到后返回SYN+ACK确认，客户端再发送ACK完成三次握手", score: 18, comment: "回答完整，表述清晰" },
      ],
    },
    highFrequencyWrong: [
      { qid: 5, preview: "TCP四次挥手过程中为什么需要TIME_WAIT状态？", accuracy: 0.62, analysis: "该题考查TCP连接释放机制，多数学生对TIME_WAIT状态的作用及2MSL时间理解不深。" },
      { qid: 4, preview: "OSPF协议的区域划分及LSA类型", accuracy: 0.68, analysis: "该题考查OSPF路由协议，部分学生对区域概念和链路状态通告类型掌握不牢。" },
    ],
  },
  2: {
    avgScore: 75.2, maxScore: 95, minScore: 48, passRate: 87.5,
    scoreDist: [{ range: "0-59", count: 6 }, { range: "60-69", count: 12 }, { range: "70-79", count: 18 }, { range: "80-89", count: 8 }, { range: "90-100", count: 4 }],
    questionAccuracy: [
      { qid: 1, accuracy: 0.82 }, { qid: 2, accuracy: 0.70 }, { qid: 3, accuracy: 0.85 },
      { qid: 4, accuracy: 0.65 }, { qid: 5, accuracy: 0.58 },
    ],
    studentScores: [
      { uid: "2024001", name: "张伟", score: 82, submitTime: "2025-02-15 10:30", graded: true },
      { uid: "2024002", name: "李娜", score: 92, submitTime: "2025-02-15 11:00", graded: true },
      { uid: "2024003", name: "赵磊", score: 52, submitTime: "2025-02-15 14:30", graded: true },
      { uid: "2024004", name: "陈小明", score: 72, submitTime: "2025-02-15 09:45", graded: true },
      { uid: "2024005", name: "周婷", score: 85, submitTime: "2025-02-15 12:30", graded: true },
    ],
    highFrequencyWrong: [
      { qid: 5, preview: "HTTP协议中GET和POST的区别", accuracy: 0.58, analysis: "该题考查HTTP协议基础，学生对两种请求方法的区别理解不够深入。" },
      { qid: 4, preview: "DNS解析过程", accuracy: 0.65, analysis: "该题考查DNS域名解析机制，部分学生对递归查询和迭代查询概念混淆。" },
    ],
  },
  3: {
    avgScore: 0, maxScore: 0, minScore: 0, passRate: 0,
    scoreDist: [{ range: "0-59", count: 0 }, { range: "60-69", count: 0 }, { range: "70-79", count: 0 }, { range: "80-89", count: 0 }, { range: "90-100", count: 0 }],
    questionAccuracy: [
      { qid: 1, accuracy: 0 }, { qid: 2, accuracy: 0 }, { qid: 3, accuracy: 0 },
    ],
    studentScores: [
      { uid: "2024001", name: "张伟", score: 0, submitTime: "", graded: false },
      { uid: "2024002", name: "李娜", score: 0, submitTime: "", graded: false },
      { uid: "2024003", name: "赵磊", score: 0, submitTime: "", graded: false },
      { uid: "2024004", name: "陈小明", score: 0, submitTime: "", graded: false },
      { uid: "2024005", name: "周婷", score: 0, submitTime: "", graded: false },
    ],
    highFrequencyWrong: [],
  },
};

const teacherNotifications = [
  { id: 1, title: "[预警] 赵磊同学连续3次作业未交", time: "2025-03-12 10:00", recipients: "计算机网络 · 2024级1班", type: "system" },
  { id: 2, title: "[预警] 孙强同学已缺勤4次", time: "2025-03-11 09:30", recipients: "计算机网络 · 2024级1班", type: "system" },
  { id: 3, title: "[系统] AI分析完成：您的班级本次测验薄弱知识点为TCP连接管理", time: "2025-03-12 15:00", recipients: "计算机网络 · 2024级1班", type: "ai" },
  { id: 4, title: "[预警] 陈小明同学成绩明显下滑", time: "2025-03-10 16:00", recipients: "计算机网络 · 2024级1班", type: "system" },
  { id: 5, title: "[管理员] 系统将于今晚22:00进行维护升级", time: "2025-03-11 09:00", recipients: "全体教师", type: "admin" },
];

const studentNotifications = [
  { id: 1, title: "[作业] 第5次作业已发布，请于本周日23:59前提交", time: "2025-03-12 10:00", sender: "刘晓红老师", type: "homework" },
  { id: 2, title: "[考试] 期中考试安排通知：下周三上午9:00-11:00", time: "2025-03-11 14:00", sender: "教务处", type: "exam" },
  { id: 3, title: "[AI建议] 您在TCP连接管理知识点上存在薄弱，建议复习相关章节", time: "2025-03-12 16:00", sender: "AI助教", type: "ai" },
  { id: 4, title: "[成绩] 第1次测验成绩已公布，您的得分：85分", time: "2025-03-10 15:30", sender: "刘晓红老师", type: "grade" },
  { id: 5, title: "[预警] 您已缺勤2次，请及时补假", time: "2025-03-11 10:00", sender: "教务处", type: "warning" },
];

const adminNotifications = [
  { id: 1, title: "[系统] 教师刘晓红已提交期中考试成绩", time: "2025-03-12 14:30", target: "计算机网络课程", type: "system" },
  { id: 2, title: "[系统] 新用户注册：张伟（学号2024001）", time: "2025-03-12 10:00", target: "2024级1班", type: "system" },
  { id: 3, title: "[系统] 助教陈晓峰已完成作业批改", time: "2025-03-11 16:45", target: "计算机网络课程", type: "system" },
  { id: 4, title: "[AI] 系统AI模型已更新至v2.0版本", time: "2025-03-10 09:00", target: "全系统", type: "ai" },
  { id: 5, title: "[系统] 本周活跃用户：48人", time: "2025-03-09 18:00", target: "全系统", type: "system" },
];

const teacherOperationLogs = [
  { id: 1, time: "2025-03-12 14:30", user: "刘晓红", role: "teacher", class: "2024级1班", type: "exam", action: "发布期中考试", detail: "计算机网络 - 期中考试" },
  { id: 2, time: "2025-03-12 14:25", user: "刘晓红", role: "teacher", class: "2024级1班", type: "grading", action: "批改作业", detail: "第5次作业，批改48份" },
  { id: 3, time: "2025-03-12 10:15", user: "陈晓峰", role: "teaching-assistant", class: "2024级1班", type: "notification", action: "发送预警通知", detail: "赵磊同学连续3次作业未交" },
  { id: 4, time: "2025-03-11 16:45", user: "刘晓红", role: "teacher", class: "2024级2班", type: "ai", action: "AI出题组卷", detail: "生成10道选择题" },
  { id: 5, time: "2025-03-11 10:30", user: "陈晓峰", role: "teaching-assistant", class: "2024级1班", type: "grading", action: "复核成绩", detail: "修改3名学生成绩" },
  { id: 6, time: "2025-03-10 09:00", user: "刘晓红", role: "teacher", class: "2024级1班", type: "import", action: "导入数据", detail: "考勤数据，成功48条" },
  { id: 7, time: "2025-03-10 15:20", user: "陈晓峰", role: "teaching-assistant", class: "2024级1班", type: "view", action: "查看学生画像", detail: "查看张伟同学画像" },
  { id: 8, time: "2025-03-09 14:00", user: "刘晓红", role: "teacher", class: "2024级1班", type: "suggestion", action: "修改学习建议", detail: "修改赵磊同学学习建议" },
  { id: 9, time: "2025-03-08 16:30", user: "陈晓峰", role: "teaching-assistant", class: "2024级2班", type: "grading", action: "批改测验", detail: "第1次测验，批改52份" },
  { id: 10, time: "2025-03-08 10:15", user: "刘晓红", role: "teacher", class: "2024级1班", type: "exam", action: "创建测验", detail: "操作系统单元测验" },
];

const importHistory = [
  { id: 1, fileName: "计算机网络_考勤数据.xlsx", dataType: "考勤记录", uploadTime: "2025-03-12 14:30", success: 48, fail: 0, status: "success" },
  { id: 2, fileName: "计算机网络_作业成绩.xlsx", dataType: "作业成绩", uploadTime: "2025-03-10 09:00", success: 45, fail: 3, status: "partial" },
  { id: 3, fileName: "操作系统_测验成绩.xlsx", dataType: "测验成绩", uploadTime: "2025-03-08 16:45", success: 45, fail: 0, status: "success" },
  { id: 4, fileName: "计算机网络_期中考试成绩.xlsx", dataType: "期中/期末成绩", uploadTime: "2025-03-21 10:00", success: 95, fail: 0, status: "success" },
];

const studentDetails: Record<string, {
  name: string; uid: string; classId: number; className: string;
  attendanceRecords: { date: string; status: string }[];
  homeworkRecords: { name: string; score: number | null; status: string }[];
  experimentRecords: { name: string; score: number; submitTime: string }[];
  scoreTrend: { exam: string; score: number; classAvg: number }[];
  knowledgeData: { subject: string; value: number }[];
  aiEvaluation: string;
  stats: { totalScore: string; rank: string; maxScore: string; minScore: string; avgScore: string };
}> = {
  "2024001": {
    name: "张伟", uid: "2024001", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "迟到" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "缺勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 95, status: "按时" }, { name: "第2次作业：HTTP协议", score: 88, status: "按时" },
      { name: "第3次作业：路由算法", score: 72, status: "迟交" }, { name: "第4次作业：网络安全", score: 90, status: "按时" },
      { name: "第5次作业：网络编程", score: null, status: "未交" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 92, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 85, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 88, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 78, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 82, classAvg: 74 },
      { exam: "第3次测验：路由", score: 76, classAvg: 76 }, { exam: "期中考试", score: 85, classAvg: 78 },
      { exam: "第4次测验：安全", score: 88, classAvg: 77 }, { exam: "第5次测验：编程", score: 82, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 88 }, { subject: "HTTP协议", value: 85 },
      { subject: "路由与交换", value: 78 }, { subject: "网络安全", value: 72 },
      { subject: "网络编程", value: 65 },
    ],
    aiEvaluation: "该生整体表现稳定，期中考试成绩85分，处于班级中等偏上水平。但在网络编程章节的掌握度明显偏低（65%），建议加强Socket编程和HTTP请求处理的练习。出勤情况良好（80%），作业提交率高（80%），学习态度积极。",
    stats: { totalScore: "82", rank: "15/48", maxScore: "95", minScore: "72", avgScore: "80" },
  },
  "2024002": {
    name: "李娜", uid: "2024002", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 98, status: "按时" }, { name: "第2次作业：HTTP协议", score: 95, status: "按时" },
      { name: "第3次作业：路由算法", score: 92, status: "按时" }, { name: "第4次作业：网络安全", score: 96, status: "按时" },
      { name: "第5次作业：网络编程", score: 94, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 98, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 95, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 96, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 92, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 88, classAvg: 74 },
      { exam: "第3次测验：路由", score: 95, classAvg: 76 }, { exam: "期中考试", score: 96, classAvg: 78 },
      { exam: "第4次测验：安全", score: 94, classAvg: 77 }, { exam: "第5次测验：编程", score: 90, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 96 }, { subject: "HTTP协议", value: 94 },
      { subject: "路由与交换", value: 92 }, { subject: "网络安全", value: 88 },
      { subject: "网络编程", value: 90 },
    ],
    aiEvaluation: "该生表现优秀，是班级的尖子生。各章节掌握度均衡且优秀，网络编程章节掌握度达到90%。出勤和作业提交都是满分，学习态度非常端正。建议挑战更高难度的题目，如SDN网络和网络安全渗透测试。",
    stats: { totalScore: "93", rank: "2/48", maxScore: "98", minScore: "88", avgScore: "93" },
  },
  "2024003": {
    name: "赵磊", uid: "2024003", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "缺勤" }, { date: "2025-03-05", status: "迟到" },
      { date: "2025-03-07", status: "缺勤" }, { date: "2025-03-10", status: "迟到" },
      { date: "2025-03-12", status: "缺勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 65, status: "迟交" }, { name: "第2次作业：HTTP协议", score: null, status: "未交" },
      { name: "第3次作业：路由算法", score: null, status: "未交" }, { name: "第4次作业：网络安全", score: null, status: "未交" },
      { name: "第5次作业：网络编程", score: null, status: "未交" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 58, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: null, submitTime: "" },
      { name: "实验三：HTTP协议分析", score: null, submitTime: "" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 62, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 55, classAvg: 74 },
      { exam: "第3次测验：路由", score: 48, classAvg: 76 }, { exam: "期中考试", score: 52, classAvg: 78 },
      { exam: "第4次测验：安全", score: 45, classAvg: 77 }, { exam: "第5次测验：编程", score: 38, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 45 }, { subject: "HTTP协议", value: 38 },
      { subject: "路由与交换", value: 32 }, { subject: "网络安全", value: 25 },
      { subject: "网络编程", value: 28 },
    ],
    aiEvaluation: "该生学习状态严重下滑，连续多次作业未交，缺勤率很高。各章节掌握度普遍偏低，网络安全仅25%。建议立即进行家校沟通，了解学生近期状况，制定个性化辅导计划，重点加强TCP三次握手和HTTP协议的基础概念。",
    stats: { totalScore: "47", rank: "48/48", maxScore: "62", minScore: "38", avgScore: "47" },
  },
  "2024004": {
    name: "陈小明", uid: "2024004", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "迟到" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 85, status: "按时" }, { name: "第2次作业：HTTP协议", score: 78, status: "按时" },
      { name: "第3次作业：路由算法", score: null, status: "未交" }, { name: "第4次作业：网络安全", score: null, status: "未交" },
      { name: "第5次作业：网络编程", score: null, status: "未交" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 82, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 76, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: null, submitTime: "" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 82, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 78, classAvg: 74 },
      { exam: "第3次测验：路由", score: 72, classAvg: 76 }, { exam: "期中考试", score: 68, classAvg: 78 },
      { exam: "第4次测验：安全", score: 65, classAvg: 77 }, { exam: "第5次测验：编程", score: 62, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 75 }, { subject: "HTTP协议", value: 70 },
      { subject: "路由与交换", value: 62 }, { subject: "网络安全", value: 48 },
      { subject: "网络编程", value: 55 },
    ],
    aiEvaluation: "该生前期表现尚可，但近期出现明显下滑趋势，连续三次作业未交。网络安全章节掌握度仅48%，路由与交换也偏弱。建议关注学生近期学习状态，及时进行学业辅导，重点复习OSPF协议和HTTPS原理。",
    stats: { totalScore: "68", rank: "38/48", maxScore: "82", minScore: "62", avgScore: "71" },
  },
  "2024005": {
    name: "周婷", uid: "2024005", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 90, status: "按时" }, { name: "第2次作业：HTTP协议", score: 85, status: "按时" },
      { name: "第3次作业：路由算法", score: 82, status: "按时" }, { name: "第4次作业：网络安全", score: 88, status: "按时" },
      { name: "第5次作业：网络编程", score: 92, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 90, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 88, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 92, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 85, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 88, classAvg: 74 },
      { exam: "第3次测验：路由", score: 82, classAvg: 76 }, { exam: "期中考试", score: 86, classAvg: 78 },
      { exam: "第4次测验：安全", score: 89, classAvg: 77 }, { exam: "第5次测验：编程", score: 91, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 88 }, { subject: "HTTP协议", value: 90 },
      { subject: "路由与交换", value: 82 }, { subject: "网络安全", value: 86 },
      { subject: "网络编程", value: 85 },
    ],
    aiEvaluation: "该生学习成绩优秀，作业提交及时，出勤良好。各知识点掌握均衡，建议保持学习节奏，可尝试挑战更高难度的题目。",
    stats: { totalScore: "87", rank: "12/48", maxScore: "92", minScore: "82", avgScore: "87" },
  },
  "2024006": {
    name: "吴涛", uid: "2024006", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "缺勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "迟到" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "缺勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 78, status: "迟交" }, { name: "第2次作业：HTTP协议", score: 72, status: "按时" },
      { name: "第3次作业：路由算法", score: 68, status: "迟交" }, { name: "第4次作业：网络安全", score: 75, status: "按时" },
      { name: "第5次作业：网络编程", score: 80, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 75, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 72, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 78, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 72, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 76, classAvg: 74 },
      { exam: "第3次测验：路由", score: 68, classAvg: 76 }, { exam: "期中考试", score: 74, classAvg: 78 },
      { exam: "第4次测验：安全", score: 78, classAvg: 77 }, { exam: "第5次测验：编程", score: 82, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 74 }, { subject: "HTTP协议", value: 76 },
      { subject: "路由与交换", value: 65 }, { subject: "网络安全", value: 72 },
      { subject: "网络编程", value: 78 },
    ],
    aiEvaluation: "该生学习状态一般，存在缺勤情况。路由与交换知识点掌握较弱（65%），建议加强OSPF协议的学习。作业提交基本按时，整体处于班级中等水平。",
    stats: { totalScore: "75", rank: "28/48", maxScore: "82", minScore: "68", avgScore: "75" },
  },
  "2024007": {
    name: "郑芳", uid: "2024007", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 95, status: "按时" }, { name: "第2次作业：HTTP协议", score: 92, status: "按时" },
      { name: "第3次作业：路由算法", score: 88, status: "按时" }, { name: "第4次作业：网络安全", score: 96, status: "按时" },
      { name: "第5次作业：网络编程", score: 94, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 95, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 92, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 94, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 90, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 88, classAvg: 74 },
      { exam: "第3次测验：路由", score: 92, classAvg: 76 }, { exam: "期中考试", score: 94, classAvg: 78 },
      { exam: "第4次测验：安全", score: 93, classAvg: 77 }, { exam: "第5次测验：编程", score: 91, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 94 }, { subject: "HTTP协议", value: 92 },
      { subject: "路由与交换", value: 88 }, { subject: "网络安全", value: 95 },
      { subject: "网络编程", value: 90 },
    ],
    aiEvaluation: "该生表现优秀，各知识点掌握度均衡且高分，是班级前三名。出勤和作业都是满分，学习态度非常端正。建议挑战SDN网络和网络安全渗透测试等高阶内容。",
    stats: { totalScore: "91", rank: "3/48", maxScore: "96", minScore: "88", avgScore: "91" },
  },
  "2024008": {
    name: "孙强", uid: "2024008", classId: 1, className: "2024级1班",
    attendanceRecords: [
      { date: "2025-03-03", status: "缺勤" }, { date: "2025-03-05", status: "缺勤" },
      { date: "2025-03-07", status: "缺勤" }, { date: "2025-03-10", status: "迟到" },
      { date: "2025-03-12", status: "缺勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: null, status: "未交" }, { name: "第2次作业：HTTP协议", score: null, status: "未交" },
      { name: "第3次作业：路由算法", score: null, status: "未交" }, { name: "第4次作业：网络安全", score: null, status: "未交" },
      { name: "第5次作业：网络编程", score: null, status: "未交" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: null, submitTime: "" },
      { name: "实验二：TCP连接实验", score: null, submitTime: "" },
      { name: "实验三：HTTP协议分析", score: null, submitTime: "" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 35, classAvg: 75 }, { exam: "第2次测验：HTTP", score: 28, classAvg: 74 },
      { exam: "第3次测验：路由", score: 22, classAvg: 76 }, { exam: "期中考试", score: 25, classAvg: 78 },
      { exam: "第4次测验：安全", score: 30, classAvg: 77 }, { exam: "第5次测验：编程", score: 28, classAvg: 80 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 25 }, { subject: "HTTP协议", value: 22 },
      { subject: "路由与交换", value: 18 }, { subject: "网络安全", value: 20 },
      { subject: "网络编程", value: 15 },
    ],
    aiEvaluation: "该生学习状态极差，几乎全勤缺勤，作业全部未交，所有知识点掌握度都在25%以下。属于严重预警对象，建议立即联系家长和辅导员，进行学业干预。",
    stats: { totalScore: "28", rank: "48/48", maxScore: "35", minScore: "15", avgScore: "28" },
  },
  "2024009": {
    name: "钱敏", uid: "2024009", classId: 2, className: "2024级2班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 88, status: "按时" }, { name: "第2次作业：HTTP协议", score: 92, status: "按时" },
      { name: "第3次作业：路由算法", score: 85, status: "按时" }, { name: "第4次作业：网络安全", score: 90, status: "按时" },
      { name: "第5次作业：网络编程", score: 86, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 88, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 90, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 85, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 82, classAvg: 72 }, { exam: "第2次测验：HTTP", score: 86, classAvg: 76 },
      { exam: "第3次测验：路由", score: 80, classAvg: 78 }, { exam: "期中考试", score: 84, classAvg: 74 },
      { exam: "第4次测验：安全", score: 88, classAvg: 77 }, { exam: "第5次测验：编程", score: 85, classAvg: 75 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 84 }, { subject: "HTTP协议", value: 88 },
      { subject: "路由与交换", value: 78 }, { subject: "网络安全", value: 82 },
      { subject: "网络编程", value: 80 },
    ],
    aiEvaluation: "该生学习成绩良好，作业提交及时，出勤满分。HTTP协议掌握度较高（88%），路由与交换相对薄弱，建议加强路由协议的学习。",
    stats: { totalScore: "84", rank: "5/35", maxScore: "92", minScore: "80", avgScore: "84" },
  },
  "2024010": {
    name: "林涛", uid: "2024010", classId: 2, className: "2024级2班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "迟到" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 75, status: "按时" }, { name: "第2次作业：HTTP协议", score: 72, status: "迟交" },
      { name: "第3次作业：路由算法", score: 68, status: "按时" }, { name: "第4次作业：网络安全", score: 70, status: "按时" },
      { name: "第5次作业：网络编程", score: 74, status: "迟交" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 72, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 68, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 75, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 70, classAvg: 72 }, { exam: "第2次测验：HTTP", score: 68, classAvg: 76 },
      { exam: "第3次测验：路由", score: 65, classAvg: 78 }, { exam: "期中考试", score: 72, classAvg: 74 },
      { exam: "第4次测验：安全", score: 68, classAvg: 77 }, { exam: "第5次测验：编程", score: 75, classAvg: 75 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 70 }, { subject: "HTTP协议", value: 68 },
      { subject: "路由与交换", value: 62 }, { subject: "网络安全", value: 65 },
      { subject: "网络编程", value: 72 },
    ],
    aiEvaluation: "该生学习成绩中等，存在作业迟交情况。路由与交换知识点掌握较弱（62%），建议加强学习。整体处于班级中等偏下水平，有提升空间。",
    stats: { totalScore: "70", rank: "22/35", maxScore: "75", minScore: "65", avgScore: "70" },
  },
  "2024011": {
    name: "黄丽", uid: "2024011", classId: 2, className: "2024级2班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 82, status: "按时" }, { name: "第2次作业：HTTP协议", score: 85, status: "按时" },
      { name: "第3次作业：路由算法", score: 78, status: "按时" }, { name: "第4次作业：网络安全", score: 80, status: "按时" },
      { name: "第5次作业：网络编程", score: 86, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 82, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 85, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 80, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 78, classAvg: 72 }, { exam: "第2次测验：HTTP", score: 82, classAvg: 76 },
      { exam: "第3次测验：路由", score: 75, classAvg: 78 }, { exam: "期中考试", score: 80, classAvg: 74 },
      { exam: "第4次测验：安全", score: 82, classAvg: 77 }, { exam: "第5次测验：编程", score: 85, classAvg: 75 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 78 }, { subject: "HTTP协议", value: 82 },
      { subject: "路由与交换", value: 75 }, { subject: "网络安全", value: 80 },
      { subject: "网络编程", value: 85 },
    ],
    aiEvaluation: "该生学习成绩良好，作业提交及时，出勤满分。网络编程掌握度较高（85%），建议保持学习节奏，继续提升其他知识点的掌握度。",
    stats: { totalScore: "80", rank: "12/35", maxScore: "86", minScore: "75", avgScore: "80" },
  },
  "2024012": {
    name: "徐军", uid: "2024012", classId: 2, className: "2024级2班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "迟到" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "缺勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 90, status: "按时" }, { name: "第2次作业：HTTP协议", score: 88, status: "按时" },
      { name: "第3次作业：路由算法", score: 92, status: "按时" }, { name: "第4次作业：网络安全", score: 86, status: "按时" },
      { name: "第5次作业：网络编程", score: 88, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 88, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 90, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 86, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 85, classAvg: 72 }, { exam: "第2次测验：HTTP", score: 88, classAvg: 76 },
      { exam: "第3次测验：路由", score: 90, classAvg: 78 }, { exam: "期中考试", score: 86, classAvg: 74 },
      { exam: "第4次测验：安全", score: 84, classAvg: 77 }, { exam: "第5次测验：编程", score: 88, classAvg: 75 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 86 }, { subject: "HTTP协议", value: 88 },
      { subject: "路由与交换", value: 90 }, { subject: "网络安全", value: 84 },
      { subject: "网络编程", value: 86 },
    ],
    aiEvaluation: "该生学习成绩优秀，路由与交换掌握度达到90%。存在一次缺勤，建议注意出勤。整体处于班级上游水平，学习能力较强。",
    stats: { totalScore: "87", rank: "4/35", maxScore: "92", minScore: "84", avgScore: "87" },
  },
  "2024013": {
    name: "马丽", uid: "2024013", classId: 3, className: "2024级3班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 92, status: "按时" }, { name: "第2次作业：HTTP协议", score: 88, status: "按时" },
      { name: "第3次作业：路由算法", score: 90, status: "按时" }, { name: "第4次作业：网络安全", score: 94, status: "按时" },
      { name: "第5次作业：网络编程", score: 90, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 92, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 88, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 90, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 88, classAvg: 78 }, { exam: "第2次测验：HTTP", score: 86, classAvg: 75 },
      { exam: "第3次测验：路由", score: 90, classAvg: 77 }, { exam: "期中考试", score: 92, classAvg: 80 },
      { exam: "第4次测验：安全", score: 94, classAvg: 78 }, { exam: "第5次测验：编程", score: 88, classAvg: 82 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 90 }, { subject: "HTTP协议", value: 88 },
      { subject: "路由与交换", value: 92 }, { subject: "网络安全", value: 94 },
      { subject: "网络编程", value: 88 },
    ],
    aiEvaluation: "该生表现优秀，网络安全掌握度达到94%，是班级第一名。出勤和作业都是满分，学习态度非常端正。建议挑战更高难度的网络安全题目。",
    stats: { totalScore: "90", rank: "1/28", maxScore: "94", minScore: "86", avgScore: "90" },
  },
  "2024014": {
    name: "朱伟", uid: "2024014", classId: 3, className: "2024级3班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "出勤" },
      { date: "2025-03-07", status: "迟到" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "出勤" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 75, status: "按时" }, { name: "第2次作业：HTTP协议", score: 78, status: "按时" },
      { name: "第3次作业：路由算法", score: 72, status: "迟交" }, { name: "第4次作业：网络安全", score: 76, status: "按时" },
      { name: "第5次作业：网络编程", score: 70, status: "迟交" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 74, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: 76, submitTime: "2025-02-27" },
      { name: "实验三：HTTP协议分析", score: 72, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 72, classAvg: 78 }, { exam: "第2次测验：HTTP", score: 75, classAvg: 75 },
      { exam: "第3次测验：路由", score: 68, classAvg: 77 }, { exam: "期中考试", score: 74, classAvg: 80 },
      { exam: "第4次测验：安全", score: 76, classAvg: 78 }, { exam: "第5次测验：编程", score: 70, classAvg: 82 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 72 }, { subject: "HTTP协议", value: 75 },
      { subject: "路由与交换", value: 68 }, { subject: "网络安全", value: 74 },
      { subject: "网络编程", value: 68 },
    ],
    aiEvaluation: "该生学习成绩中等，存在作业迟交和一次迟到。路由与交换和网络编程掌握度较弱（68%），建议加强学习。整体处于班级中等水平。",
    stats: { totalScore: "73", rank: "18/28", maxScore: "78", minScore: "68", avgScore: "73" },
  },
  "2024015": {
    name: "胡杰", uid: "2024015", classId: 3, className: "2024级3班",
    attendanceRecords: [
      { date: "2025-03-03", status: "出勤" }, { date: "2025-03-05", status: "缺勤" },
      { date: "2025-03-07", status: "出勤" }, { date: "2025-03-10", status: "出勤" },
      { date: "2025-03-12", status: "迟到" },
    ],
    homeworkRecords: [
      { name: "第1次作业：TCP/IP基础", score: 80, status: "按时" }, { name: "第2次作业：HTTP协议", score: null, status: "未交" },
      { name: "第3次作业：路由算法", score: 75, status: "迟交" }, { name: "第4次作业：网络安全", score: null, status: "未交" },
      { name: "第5次作业：网络编程", score: 78, status: "按时" },
    ],
    experimentRecords: [
      { name: "实验一：Wireshark抓包分析", score: 78, submitTime: "2025-02-20" },
      { name: "实验二：TCP连接实验", score: null, submitTime: "" },
      { name: "实验三：HTTP协议分析", score: 75, submitTime: "2025-03-06" },
    ],
    scoreTrend: [
      { exam: "第1次测验：TCP/IP", score: 78, classAvg: 78 }, { exam: "第2次测验：HTTP", score: 65, classAvg: 75 },
      { exam: "第3次测验：路由", score: 72, classAvg: 77 }, { exam: "期中考试", score: 68, classAvg: 80 },
      { exam: "第4次测验：安全", score: 60, classAvg: 78 }, { exam: "第5次测验：编程", score: 75, classAvg: 82 },
    ],
    knowledgeData: [
      { subject: "TCP/IP协议", value: 76 }, { subject: "HTTP协议", value: 60 },
      { subject: "路由与交换", value: 70 }, { subject: "网络安全", value: 55 },
      { subject: "网络编程", value: 72 },
    ],
    aiEvaluation: "该生学习成绩下滑明显，期中考试后成绩从78分降到60分。网络安全掌握度仅55%，HTTP协议也偏弱（60%）。存在作业未交和缺勤情况，属于预警对象，建议及时进行学业辅导。",
    stats: { totalScore: "68", rank: "24/28", maxScore: "78", minScore: "60", avgScore: "70" },
  },
};

const aiGeneratedQuestions = [
  { id: 1, type: "choice", topic: "TCP/IP协议", difficulty: "中等", professionalScore: 92, status: "pending",
    question: "TCP三次握手过程中，第二次握手时服务器发送的报文段中SYN和ACK标志位的值分别是：",
    options: ["SYN=0, ACK=0", "SYN=1, ACK=0", "SYN=0, ACK=1", "SYN=1, ACK=1"],
    answer: 3, explain: "TCP三次握手中，第二次握手是服务器收到客户端的SYN后，回复SYN+ACK报文，其中SYN=1表示同意建立连接，ACK=1表示确认收到客户端的SYN。" },
  { id: 2, type: "choice", topic: "HTTP协议", difficulty: "简单", professionalScore: 88, status: "pending",
    question: "HTTP状态码404表示：",
    options: ["服务器内部错误", "请求成功", "请求的资源未找到", "重定向"],
    answer: 2, explain: "HTTP状态码404(Not Found)表示服务器找不到请求的资源。常见原因包括URL拼写错误、资源已删除或移动。" },
  { id: 3, type: "judge", topic: "网络安全", difficulty: "中等", professionalScore: 85, status: "pending",
    question: "HTTPS协议在传输层使用SSL/TLS对数据进行加密，从而保证了数据传输的安全性。",
    options: ["正确", "错误"],
    answer: 0, explain: "HTTPS = HTTP + SSL/TLS，SSL/TLS工作在传输层和应用层之间，对HTTP数据进行加密传输，防止数据被窃听和篡改。" },
];

const aiEvaluation = "该生整体表现稳定，期中考试成绩82分，处于班级中等偏上水平。但在网络编程章节的掌握度明显偏低（38%），建议加强Socket编程和HTTP请求处理的练习。出勤情况良好（93.8%），作业提交率高（95%），学习态度积极。";

const focusStudents = ["2024003", "2024008"];

const courseScoreTrends: Record<number, typeof scoreTrendWithClass> = {
  1: [
    { exam: "第1次测验", score: 72, classAvg: 75 },
    { exam: "第2次测验", score: 68, classAvg: 72 },
    { exam: "期中考试", score: 75, classAvg: 78 },
    { exam: "第3次测验", score: 80, classAvg: 76 },
    { exam: "第4次测验", score: 77, classAvg: 74 },
    { exam: "期末考试", score: 82, classAvg: 79 },
  ],
  2: [
    { exam: "第1次测验", score: 65, classAvg: 70 },
    { exam: "第2次测验", score: 72, classAvg: 73 },
    { exam: "期中考试", score: 70, classAvg: 75 },
    { exam: "第3次测验", score: 74, classAvg: 72 },
    { exam: "期末考试", score: 74, classAvg: 76 },
  ],
  3: [
    { exam: "第1次测验", score: 78, classAvg: 76 },
    { exam: "第2次测验", score: 82, classAvg: 79 },
    { exam: "期中考试", score: 75, classAvg: 77 },
  ],
  4: [
    { exam: "第1次测验", score: 85, classAvg: 80 },
    { exam: "第2次测验", score: 88, classAvg: 82 },
    { exam: "期中考试", score: 86, classAvg: 81 },
    { exam: "第3次测验", score: 90, classAvg: 84 },
    { exam: "期末考试", score: 88, classAvg: 83 },
  ],
  5: [
    { exam: "第1次测验", score: 68, classAvg: 72 },
    { exam: "第2次测验", score: 75, classAvg: 74 },
    { exam: "期中考试", score: 72, classAvg: 76 },
  ],
};

const courseKnowledgeData: Record<number, typeof knowledgeData> = {
  1: [
    { subject: "线性表", value: 85 },
    { subject: "树与二叉树", value: 88 },
    { subject: "图", value: 72 },
    { subject: "排序算法", value: 78 },
    { subject: "查找算法", value: 55 },
  ],
  2: [
    { subject: "TCP/IP协议", value: 85 },
    { subject: "HTTP协议", value: 78 },
    { subject: "路由与交换", value: 72 },
    { subject: "网络安全", value: 65 },
    { subject: "网络编程", value: 55 },
  ],
  3: [
    { subject: "进程管理", value: 75 },
    { subject: "内存管理", value: 68 },
    { subject: "文件系统", value: 82 },
    { subject: "设备管理", value: 70 },
    { subject: "死锁", value: 58 },
  ],
  4: [
    { subject: "计算机组成原理", value: 90 },
    { subject: "指令系统", value: 88 },
    { subject: "CPU结构", value: 85 },
    { subject: "存储系统", value: 82 },
    { subject: "总线系统", value: 92 },
  ],
  5: [
    { subject: "关系模型", value: 82 },
    { subject: "SQL语言", value: 75 },
    { subject: "数据库设计", value: 65 },
    { subject: "事务管理", value: 55 },
    { subject: "索引与优化", value: 78 },
  ],
};

const courseWarnings: Record<number, { type: "danger" | "warning" | "info"; title: string; message: string }[]> = {
  1: [
    { type: "danger", title: "成绩下降预警", message: "数据结构第二次测验成绩较第一次下降4分，请注意复习。" },
    { type: "info", title: "学习建议", message: "查找算法知识点掌握度较低，建议进行针对性练习。" },
  ],
  2: [
    { type: "warning", title: "成绩波动预警", message: "计算机网络成绩波动较大，建议巩固TCP/IP协议基础知识点。" },
    { type: "info", title: "学习建议", message: "网络编程掌握度较低，建议加强Socket编程练习。" },
  ],
  3: [
    { type: "warning", title: "缺勤预警", message: "操作系统课程已缺勤2次，请按时出勤。" },
    { type: "info", title: "学习建议", message: "死锁章节掌握不够，建议重点复习死锁的四个必要条件和预防策略。" },
  ],
  4: [
    { type: "info", title: "学习建议", message: "计算机系统成绩优秀，继续保持！建议挑战更高难度题目，如流水线CPU设计。" },
  ],
  5: [
    { type: "warning", title: "成绩下降预警", message: "数据库系统期中考试成绩较第二次测验下降3分，请注意复习。" },
    { type: "info", title: "学习建议", message: "事务管理掌握度较低，建议重点复习ACID特性和并发控制。" },
  ],
};

const aiSuggestions = [
  {
    id: 1, title: "加强TCP连接管理的理解", topic: "TCP连接建立与释放", mastery: 55,
    detail: "你在TCP三次握手和四次挥手的过程理解上失分较多，建议先复习课件第3.3节，重点理解SYN、ACK、FIN标志位的作用及各阶段的状态转换。",
  },
  {
    id: 2, title: "提升网络编程实践能力", topic: "网络编程", mastery: 38,
    detail: "在Socket编程和HTTP请求处理上有明显不足，建议多进行实践练习，重点掌握TCP客户端/服务器编程和HTTP协议的实现。",
  },
];

const practiceQuestions = [
  {
    id: 1, type: "choice", topic: "TCP连接建立与释放",
    question: "TCP三次握手过程中，客户端发送的第一个报文段包含哪个标志位？",
    options: ["SYN", "ACK", "SYN+ACK", "FIN"],
    answer: 0, explain: "TCP三次握手中，客户端首先发送SYN报文段，请求建立连接，此时SYN=1，ACK=0。",
  },
  {
    id: 2, type: "choice", topic: "TCP连接建立与释放",
    question: "TCP四次挥手过程中，TIME_WAIT状态的作用是什么？",
    options: ["等待对方确认", "确保最后一个ACK可靠到达", "准备建立新连接", "释放资源"],
    answer: 1, explain: "TIME_WAIT状态是为了确保最后一个ACK报文能够可靠到达，防止对方重传FIN报文时无法收到确认。",
  },
  {
    id: 3, type: "judge", topic: "TCP/UDP协议",
    question: "UDP协议提供可靠的、面向连接的传输服务。",
    options: ["正确", "错误"],
    answer: 1, explain: "UDP是无连接的传输协议，不提供可靠性保证，也不进行流量控制和拥塞控制。TCP才是面向连接的可靠传输协议。",
  },
];

const wrongQuestions = [
  {
    id: 1, course: "计算机网络", chapter: "TCP协议", section: "TCP连接建立",
    type: "choice", question: "TCP三次握手中，第二次握手时服务器发送的报文段包含哪些标志位？",
    options: ["SYN+ACK", "SYN", "ACK", "FIN+ACK"],
    myAnswer: 2, correctAnswer: 0,
    explain: "TCP三次握手过程：第一次客户端发送SYN，第二次服务器回应SYN+ACK（确认收到客户端的SYN，同时发送自己的SYN），第三次客户端发送ACK确认。",
  },
  {
    id: 2, course: "计算机网络", chapter: "IP协议", section: "IPV4/V6协议",
    type: "choice", question: "IPv4地址的长度是多少位？",
    options: ["32位", "64位", "128位", "48位"],
    myAnswer: 2, correctAnswer: 0,
    explain: "IPv4地址由32位二进制数组成，通常表示为点分十进制形式（如192.168.1.1）。IPv6地址则由128位组成。",
  },
  {
    id: 3, course: "计算机网络", chapter: "传输层", section: "TCP/UDP协议",
    type: "judge", question: "UDP协议是面向连接的可靠传输协议。",
    options: ["正确", "错误"],
    myAnswer: 0, correctAnswer: 1,
    explain: "UDP是无连接的传输协议，不提供可靠性保证，不进行流量控制和拥塞控制。TCP才是面向连接的可靠传输协议。",
  },
  {
    id: 4, course: "计算机网络", chapter: "TCP协议", section: "TCP连接释放",
    type: "choice", question: "TCP四次挥手过程中，TIME_WAIT状态的等待时间通常是：",
    options: ["2MSL", "MSL", "3MSL", "0.5MSL"],
    myAnswer: 1, correctAnswer: 0,
    explain: "TIME_WAIT状态需要等待2倍的最大报文段生存时间(2MSL)，确保最后一个ACK可靠到达，避免旧连接的报文干扰新连接。",
  },
  {
    id: 5, course: "计算机网络", chapter: "应用层", section: "HTTP协议",
    type: "choice", question: "HTTP状态码301表示：",
    options: ["永久重定向", "临时重定向", "请求成功", "未找到资源"],
    myAnswer: 1, correctAnswer: 0,
    explain: "HTTP状态码301表示永久重定向(Moved Permanently)，请求的资源已被永久移动到新位置，后续请求应使用新URL。",
  },
  {
    id: 6, course: "计算机网络", chapter: "网络安全", section: "HTTPS",
    type: "judge", question: "HTTPS协议只对HTTP请求的内容进行加密，URL和域名仍然是明文传输。",
    options: ["正确", "错误"],
    myAnswer: 0, correctAnswer: 1,
    explain: "HTTPS使用SSL/TLS对整个HTTP通信过程进行加密，包括URL、域名、请求头和请求体，确保数据传输的完整性和安全性。",
  },
  {
    id: 7, course: "操作系统", chapter: "进程管理", section: "进程调度",
    type: "choice", question: "以下哪种进程调度算法可能导致饥饿现象？",
    options: ["优先级调度", "时间片轮转", "先来先服务", "多级反馈队列"],
    myAnswer: 2, correctAnswer: 0,
    explain: "优先级调度算法中，如果系统中存在多个高优先级进程持续就绪，低优先级进程可能永远得不到执行机会，产生饥饿现象。",
  },
  {
    id: 8, course: "操作系统", chapter: "内存管理", section: "虚拟内存",
    type: "choice", question: "页表的作用是：",
    options: ["实现逻辑地址到物理地址的转换", "存储进程的页框号", "管理磁盘空间", "分配内存块"],
    myAnswer: 1, correctAnswer: 0,
    explain: "页表记录了逻辑页号到物理页框号的映射关系，通过页表可以将程序的逻辑地址转换为物理内存地址，实现虚拟内存管理。",
  },
];

const wrongQuestionCategories = [
  { name: "计算机网络", expanded: true, chapters: [
    { name: "TCP协议", sections: ["TCP连接建立", "TCP连接释放", "TCP拥塞控制"] },
    { name: "IP协议", sections: ["IPV4/V6协议", "IP地址与MAC地址", "NAT协议"] },
    { name: "传输层", sections: ["TCP/UDP协议", "可靠传输技术", "传输吞吐量计算"] },
    { name: "应用层", sections: ["HTTP协议", "DNS协议", "ICMP协议"] },
    { name: "网络安全", sections: ["HTTPS", "SSL/TLS", "防火墙"] },
  ]},
  { name: "操作系统", expanded: false, chapters: [
    { name: "进程管理", sections: ["进程调度", "进程同步", "死锁"] },
    { name: "内存管理", sections: ["虚拟内存", "分页管理", "分段管理"] },
    { name: "文件系统", sections: ["文件结构", "目录管理", "磁盘调度"] },
  ]},
];

const mockExams = [
  {
    id: 1, name: "计算机网络 - 期中考试", course: "计算机网络", teacher: "李明辉",
    deadline: "2025-04-05 18:00", duration: 90, status: "pending",
    questions: [
      { id: 1, type: "choice", question: "TCP三次握手中，客户端发送的第一个报文段包含哪个标志位？", options: ["SYN", "ACK", "SYN+ACK", "FIN"], answer: 0 },
      { id: 2, type: "choice", question: "以下哪个协议是无连接的传输协议？", options: ["UDP", "TCP", "HTTP", "FTP"], answer: 0 },
      { id: 3, type: "choice", question: "IPv6地址的长度是多少位？", options: ["128位", "32位", "64位", "48位"], answer: 0 },
      { id: 4, type: "judge", question: "HTTP协议默认使用80端口。", options: ["正确", "错误"], answer: 0 },
      { id: 5, type: "choice", question: "TCP连接释放需要几次握手？", options: ["4次", "3次", "2次", "1次"], answer: 0 },
      { id: 6, type: "text", question: "简述TCP三次握手的过程。", answer: "第一次：客户端发送SYN；第二次：服务器回应SYN+ACK；第三次：客户端发送ACK确认" },
    ]
  },
  {
    id: 2, name: "操作系统 - 单元测验", course: "操作系统", teacher: "张教授",
    deadline: "2025-03-25 20:00", duration: 60, status: "pending",
    questions: [
      { id: 1, type: "choice", question: "以下哪种进程调度算法可能导致饥饿现象？", options: ["优先级调度", "时间片轮转", "先来先服务", "多级反馈队列"], answer: 0 },
      { id: 2, type: "choice", question: "页表的作用是：", options: ["实现逻辑地址到物理地址的转换", "存储进程的页框号", "管理磁盘空间", "分配内存块"], answer: 0 },
      { id: 3, type: "judge", question: "虚拟内存技术可以使程序的运行空间超过物理内存的大小。", options: ["正确", "错误"], answer: 0 },
      { id: 4, type: "choice", question: "以下哪种页面置换算法可能产生Belady异常？", options: ["FIFO", "LRU", "OPT", "LFU"], answer: 0 },
      { id: 5, type: "text", question: "简述死锁产生的四个必要条件。", answer: "互斥条件、请求与保持条件、不剥夺条件、循环等待条件" },
    ]
  },
  {
    id: 3, name: "计算机系统 - 第一次测验", course: "计算机系统", teacher: "王老师",
    deadline: "2025-03-10 23:59", duration: 45, status: "completed", score: 85,
    questions: []
  },
  {
    id: 4, name: "计算机网络 - 第一次测验", course: "计算机网络", teacher: "李明辉",
    deadline: "2025-02-28 23:59", duration: 60, status: "completed", score: 72,
    questions: []
  },
  {
    id: 5, name: "操作系统 - 期中考试", course: "操作系统", teacher: "张教授",
    deadline: "2025-04-10 18:00", duration: 120, status: "pending",
    questions: [
      { id: 1, type: "choice", question: "进程和线程的主要区别是：", options: ["资源分配的基本单位不同", "执行速度不同", "优先级不同", "创建时间不同"], answer: 0 },
      { id: 2, type: "choice", question: "以下哪种磁盘调度算法平均寻道时间最短？", options: ["SSTF", "FCFS", "SCAN", "CSCAN"], answer: 0 },
      { id: 3, type: "judge", question: "信号量机制可以用于实现进程同步。", options: ["正确", "错误"], answer: 0 },
      { id: 4, type: "choice", question: "段页式管理结合了分段和分页的优点，其中地址结构包含：", options: ["段号、段内页号、页内偏移", "页号、页内偏移", "段号、段内偏移", "进程号、页号"], answer: 0 },
      { id: 5, type: "text", question: "什么是虚拟内存？它的主要作用是什么？", answer: "虚拟内存是操作系统提供的一种内存管理技术，通过将部分数据交换到磁盘，使程序可以使用超过物理内存大小的地址空间，提高系统的并发能力和内存利用率。" },
    ]
  },
  {
    id: 6, name: "计算机网络 - 第2次测验", course: "计算机网络", teacher: "李明辉",
    deadline: "2025-03-01 23:59", duration: 45, status: "completed", score: 68,
    questions: []
  },
];

const scoreTrendWithClass = [
  { exam: "第1次测验", score: 72, classAvg: 75 },
  { exam: "第2次测验", score: 68, classAvg: 72 },
  { exam: "期中考试", score: 75, classAvg: 78 },
  { exam: "第3次测验", score: 80, classAvg: 76 },
  { exam: "第4次测验", score: 77, classAvg: 74 },
  { exam: "期末考试", score: 82, classAvg: 79 },
];

// ─── Utility components ───────────────────────────────────────────────────────
const Tag = ({ color, children }: { color: string; children: React.ReactNode }) => {
  const map: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
    yellow: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const StatCard = ({ count, label, icon: Icon, color }: { count: string | number; label: string; icon: any; color: string }) => {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50", green: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50", purple: "text-purple-600 bg-purple-50",
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

const roleLabel = (role: string) => {
  if (role === "admin") return <Tag color="blue">管理员</Tag>;
  if (role === "teacher") return <Tag color="green">教师</Tag>;
  if (role === "teaching-assistant") return <Tag color="purple">助教</Tag>;
  return <Tag color="orange">学生</Tag>;
};

const diffLabel = (d: string) => {
  if (d === "简单") return <Tag color="green">简单</Tag>;
  if (d === "困难") return <Tag color="red">困难</Tag>;
  return <Tag color="yellow">中等</Tag>;
};

const statusLabel = (s: string) => {
  if (s === "pending") return <Tag color="yellow">待审核</Tag>;
  if (s === "approved") return <Tag color="green">已通过</Tag>;
  return <Tag color="red">已驳回</Tag>;
};

// ─── Layout Shell ─────────────────────────────────────────────────────────────
const navItems: Record<Role, { icon: any; label: string; page?: Page; children?: { label: string; page: Page }[] }[]> = {
  admin: [
    { icon: LayoutDashboard, label: "系统总览", page: "admin-dashboard" },
    { icon: GraduationCap, label: "教师账号管理", page: "admin-teachers" },
    { icon: Brain, label: "AI运维中心", page: "admin-ai-ops" },
    { icon: FileSearch, label: "系统审计日志", page: "admin-audit" },
    { icon: Settings, label: "系统配置", page: "admin-config" },
  ],
  teacher: [
    { icon: LayoutDashboard, label: "教学驾驶舱", page: "teacher-dashboard" },
    { icon: Users, label: "班级管理", page: "teacher-class" },
    { icon: Upload, label: "数据导入", page: "teacher-import" },
    { icon: BookOpen, label: "题库管理", page: "teacher-bank", children: [
      { label: "AI出题组卷", page: "teacher-ai-quiz" },
      { label: "题库管理", page: "teacher-bank" },
    ]},
    { icon: FileText, label: "考试管理", page: "teacher-exam" },
    { icon: Bell, label: "通知中心", page: "teacher-notification" },
    { icon: History, label: "操作日志", page: "teacher-logs" },
  ],
  "teaching-assistant": [
    { icon: LayoutDashboard, label: "教学驾驶舱", page: "ta-dashboard" },
    { icon: Users, label: "班级管理", page: "teacher-class" },
    { icon: Upload, label: "数据导入", page: "ta-import" },
    { icon: User, label: "学生画像", page: "ta-profile" },
    { icon: FileText, label: "考试批阅", page: "ta-grading" },
  ],
  student: [
    { icon: LayoutDashboard, label: "个人学习中心", page: "student-dashboard" },
    { icon: User, label: "我的画像", page: "student-profile" },
    { icon: TrendingUp, label: "成绩趋势", page: "student-score-trend" },
    { icon: BookOpen, label: "错题本", page: "student-wrong-book" },
    { icon: Clock, label: "在线考试", page: "student-exam" },
  ],
};

const roleUser: Record<Role, { name: string; uid: string }> = {
  admin: { name: "陈系统", uid: "A0001" },
  teacher: { name: "刘晓红", uid: "T2019002" },
  "teaching-assistant": { name: "陈晓峰", uid: "TA2024001" },
  student: { name: "张伟", uid: "2024001" },
};

function Sidebar({ role, page, onNav, onLogout, dark, onToggleDark, collapsed, onToggleCollapse }: {
  role: Role; page: Page; onNav: (p: Page) => void; onLogout: () => void;
  dark: boolean; onToggleDark: () => void; collapsed: boolean; onToggleCollapse: () => void;
}) {
  const items = navItems[role];
  const user = roleUser[role];
  return (
    <aside className={`flex flex-col h-full bg-sidebar transition-all duration-200 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <Brain size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-white leading-tight">AI教学评价<br />系统</span>
        )}
        <button onClick={onToggleCollapse} className="ml-auto text-sidebar-foreground hover:text-white">
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
        <button onClick={onToggleDark} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-sidebar-foreground hover:text-white rounded transition-colors">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && <span>{dark ? "浅色模式" : "深色模式"}</span>}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-sidebar-foreground hover:text-red-400 rounded transition-colors">
          <LogOut size={14} />
          {!collapsed && <span>退出登录</span>}
        </button>
        {!collapsed && (
          <div className="px-3 pt-2 border-t border-sidebar-border mt-1">
            <p className="text-xs font-medium text-white">{user.name}</p>
            <p className="text-xs text-sidebar-foreground font-mono">{user.uid}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar({ title, breadcrumb, role }: { title: string; breadcrumb: string[]; role: Role }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotifications = () => {
    switch (role) {
      case "student": return studentNotifications;
      case "teacher": return teacherNotifications;
      case "admin": return adminNotifications;
      case "teaching-assistant": return teacherNotifications;
      default: return [];
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "system":
      case "warning":
        return { icon: AlertCircle, bg: "bg-red-100", color: "text-red-600" };
      case "ai":
        return { icon: Brain, bg: "bg-purple-100", color: "text-purple-600" };
      case "admin":
        return { icon: Shield, bg: "bg-blue-100", color: "text-blue-600" };
      case "homework":
        return { icon: BookOpen, bg: "bg-green-100", color: "text-green-600" };
      case "exam":
        return { icon: FileText, bg: "bg-orange-100", color: "text-orange-600" };
      case "grade":
        return { icon: Award, bg: "bg-yellow-100", color: "text-yellow-600" };
      default:
        return { icon: Bell, bg: "bg-blue-100", color: "text-blue-600" };
    }
  };

  const notifications = getNotifications();

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
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute top-full right-0 mt-2 w-80 bg-card rounded-lg border border-border shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h4 className="font-medium text-sm">通知中心</h4>
                <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">暂无通知</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => {
                    const { icon: Icon, bg, color } = getNotificationIcon(n.type);
                    return (
                      <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer transition-colors">
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                            <Icon size={12} className={color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{n.title}</p>
                            {(n as any).sender && <p className="text-xs text-muted-foreground mt-1">{(n as any).sender}</p>}
                            {(n as any).recipients && <p className="text-xs text-muted-foreground mt-1">{(n as any).recipients}</p>}
                            {(n as any).target && <p className="text-xs text-muted-foreground mt-1">{(n as any).target}</p>}
                            <p className="text-xs text-muted-foreground">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="px-4 py-2 border-t border-border">
                <button onClick={() => setShowNotifications(false)} className="w-full text-xs text-primary hover:underline">查看全部通知</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AppShell({ role, page, onNav, onLogout, dark, onToggleDark, breadcrumb, children }: {
  role: Role; page: Page; onNav: (p: Page) => void; onLogout: () => void;
  dark: boolean; onToggleDark: () => void; breadcrumb: string[]; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar role={role} page={page} onNav={onNav} onLogout={onLogout} dark={dark} onToggleDark={onToggleDark} collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={breadcrumb[breadcrumb.length - 1]} breadcrumb={breadcrumb} role={role} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (role: Role, user: any) => void }) {
  const [role, setRole] = useState<Role>("student");
  const [uid, setUid] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!uid) { setError("请输入账号"); return; }
    if (pwd.length < 6) { setError("密码长度不能少于6位"); return; }
    setError("");
    setLoading(true);
    
    try {
      const user = await login({ username: uid, password: pwd });
      saveUser(user);
      const frontendRole = mapRole(user.role);
      onLogin(frontendRole, user);
    } catch (err: any) {
      setError(err.message || "登录失败，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  const roleMap: { key: Role; label: string }[] = [
    { key: "student", label: "学生" },
    { key: "teacher", label: "教师" },
    { key: "teaching-assistant", label: "助教" },
    { key: "admin", label: "管理员" },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.1) 39px,rgba(255,255,255,.1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.1) 39px,rgba(255,255,255,.1) 40px)" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">AI教学评价系统</span>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            智能分析学情<br />个性化学习路径
          </h1>
          <p className="text-slate-400 max-w-sm">
            基于AI技术，为每位学生提供精准的知识点掌握度分析与针对性练习推荐，助力教学质量提升。
          </p>
          <div className="flex gap-8">
            {[{ n: "1,284", l: "注册用户" }, { n: "86%", l: "平均分析覆盖率" }, { n: "12+", l: "接入学院" }].map(({ n, l }) => (
              <div key={l}>
                <p className="text-2xl font-mono font-bold text-white">{n}</p>
                <p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-slate-600 text-xs">© 2025 AI教学评价系统 · 版权所有</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[420px] flex items-center justify-center bg-[#1E293B] p-8">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">欢迎登录</h2>
            <p className="text-slate-400 text-sm mt-1">请选择角色并输入账号密码</p>
          </div>

          {/* Role tabs */}
          <div className="flex rounded-lg bg-[#0F172A] p-1 gap-1">
            {roleMap.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                className={`flex-1 py-2 text-sm rounded-md transition-all font-medium
                  ${role === key ? "bg-primary text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <input
              value={uid} onChange={e => setUid(e.target.value)}
              placeholder="请输入学号/工号"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
            <div className="relative">
              <input
                value={pwd} onChange={e => setPwd(e.target.value)}
                type={showPwd ? "text" : "password"}
                placeholder="请输入密码（不少于6位）"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-md px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-colors pr-10"
              />
              <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-3.5 text-slate-400 hover:text-white text-xs">
                {showPwd ? "隐藏" : "显示"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded" />
            <label htmlFor="remember" className="text-slate-400 text-sm">记住账号</label>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <div className="text-center text-slate-500 text-xs space-y-1">
            <p>测试账号：</p>
            <p>管理员: admin / admin123</p>
            <p>教师: T001 / 123456 | T002 / 123456</p>
            <p>学生: 2024001 / 123456 | 2024002 / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Teacher Management ────────────────────────────────────────────────
function AdminTeacherManagement() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("teachers");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; fail: number; errors: string[] } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<TeacherVO | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "enable" | "disable"; teacher: TeacherVO } | null>(null);
  const [newTeacher, setNewTeacher] = useState({ staffId: "", name: "", password: "", department: "", role: "" });
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  // Fetch teachers on mount
  useEffect(() => {
    setLoading(true);
    getTeacherList(1, 100).then(data => {
      setTeachers(data.records || []);
    }).catch(() => {
      setTeachers(mockTeachers.map(t => ({
        id: t.id, teacherNo: t.staffId, name: t.name, status: t.status === 'active' ? 'ACTIVE' : 'DISABLED',
        college: t.department || '', createTime: t.createdAt,
      } as TeacherVO)));
    }).finally(() => setLoading(false));
  }, []);

  const departments = [
    { id: "cs", name: "计算机学院", count: 15, children: [
      { id: "cs-se", name: "软件工程系", count: 6 },
      { id: "cs-ds", name: "数据科学系", count: 5 },
      { id: "cs-ai", name: "人工智能系", count: 4 },
    ]},
    { id: "math", name: "数学学院", count: 10, children: [
      { id: "math-pure", name: "基础数学系", count: 5 },
      { id: "math-applied", name: "应用数学系", count: 5 },
    ]},
    { id: "physics", name: "物理学院", count: 8, children: [] },
    { id: "econ", name: "经管学院", count: 7, children: [] },
    { id: "other", name: "其他", count: 5, children: [] },
  ];

  const roleTemplates = [
    { id: "full", name: "课程负责人", description: "拥有课程内的全部管理权限", permissions: ["viewClassData", "importData", "manageStudents", "viewProfile", "aiQuiz", "publishExam", "gradeExam", "sendNotification", "viewWarning", "exportData"] },
    { id: "secretary", name: "教学秘书", description: "可以查看所有数据但不能修改", permissions: ["viewClassData", "viewProfile", "viewWarning", "exportData"] },
    { id: "ta-readonly", name: "助教只读", description: "只能查看数据不能操作", permissions: ["viewClassData", "viewProfile"] },
    { id: "ta-grading", name: "助教可批阅", description: "在只读基础上增加批阅权限", permissions: ["viewClassData", "viewProfile", "gradeExam"] },
  ];

  const allPermissions = [
    { id: "viewClassData", name: "查看班级数据" },
    { id: "importData", name: "导入教学数据" },
    { id: "manageStudents", name: "管理学生名单" },
    { id: "viewProfile", name: "查看学生画像" },
    { id: "aiQuiz", name: "AI出题组卷" },
    { id: "publishExam", name: "发布考试" },
    { id: "gradeExam", name: "批阅考试" },
    { id: "sendNotification", name: "发送通知" },
    { id: "viewWarning", name: "查看预警信息" },
    { id: "exportData", name: "导出数据" },
  ];

  const filteredTeachers = teachers.filter(t => 
    t.name?.includes(search) || t.teacherNo?.includes(search) || (t.college || '').includes(search)
  );

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
    setNewPassword(pwd);
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.staffId || !newTeacher.name || !newTeacher.password) return;
    try {
      const created = await createTeacher({ teacherNo: newTeacher.staffId, name: newTeacher.name, password: newTeacher.password, college: newTeacher.department });
      setTeachers([...teachers, created]);
      setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" });
      setShowAddModal(false);
      showToast("教师添加成功");
    } catch (err: any) {
      showToast(err.message || "添加失败");
    }
  };

  const handleEditTeacher = async () => {
    if (!editingTeacher || !newTeacher.name) return;
    try {
      await updateTeacher(editingTeacher.id, { name: newTeacher.name, college: newTeacher.department });
      setTeachers(teachers.map(t => 
        t.id === editingTeacher.id ? { ...t, name: newTeacher.name, college: newTeacher.department || t.college } : t
      ));
      setShowEditModal(false);
      setEditingTeacher(null);
      setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" });
      showToast("教师信息更新成功");
    } catch (err: any) {
      showToast(err.message || "更新失败");
    }
  };

  const handleStatusChange = async (type: "enable" | "disable", teacher: TeacherVO) => {
    try {
      await updateTeacherStatus(teacher.id, type === "enable" ? "ACTIVE" : "DISABLED");
      setTeachers(teachers.map(t => 
        t.id === teacher.id ? { ...t, status: type === "enable" ? "ACTIVE" : "DISABLED" } : t
      ));
      setShowConfirmModal(false);
      setConfirmAction(null);
      showToast(type === "enable" ? "账号已启用" : "账号已禁用");
    } catch (err: any) {
      showToast(err.message || "操作失败");
    }
  };

  const handleResetPasswordCancel = () => {
    setShowResetModal(false);
    setNewPassword("");
    setGeneratedPassword("");
  };

  const handleResetPasswordConfirm = async () => {
    if (!editingTeacher) return;
    try {
      const result = await resetTeacherPassword(editingTeacher.id);
      setNewPassword(result.newPassword);
      setGeneratedPassword(result.newPassword);
      showToast("密码重置成功");
    } catch (err: any) {
      showToast(err.message || "重置失败");
    }
  };

  const handleDeleteTeacher = async (teacher: TeacherVO) => {
    if (!confirm(`确定要删除教师 ${teacher.name} 吗？`)) return;
    try {
      await deleteTeacher(teacher.id);
      setTeachers(teachers.filter(t => t.id !== teacher.id));
      showToast("教师已删除");
    } catch (err: any) {
      showToast(err.message || "删除失败");
    }
  };

  const handleDownloadTemplate = () => {
    const template = "工号,姓名,初始密码,部门,角色\n";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "教师导入模板.csv";
    link.click();
  };

  const handleImport = () => {
    setImportResult({ success: 3, fail: 1, errors: ["第4行：工号T2020003已存在"] });
  };

  const handleDownloadErrorLog = () => {
    if (!importResult) return;
    const log = importResult.errors.join("\n");
    const blob = new Blob([log], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "导入错误日志.txt";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold">教师账号管理</h2>
        <p className="text-blue-100 text-sm mt-1">管理教师账号、组织架构与角色权限</p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-card rounded-lg border border-border">
        <button onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "teachers" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
          教师账号
        </button>
        <button onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "departments" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
          组织架构
        </button>
        <button onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "roles" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
          角色权限模板
        </button>
      </div>

      {activeTab === "teachers" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="按姓名、工号搜索"
                className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <select value={selectedDepartment || ""} onChange={e => setSelectedDepartment(e.target.value || null)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">全部部门</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select value={selectedRole || ""} onChange={e => setSelectedRole(e.target.value || null)}
              className="px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">全部角色</option>
              {roleTemplates.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent">
              <Upload size={13} />导入教师
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-blue-700">
              <Plus size={13} />添加教师
            </button>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">工号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">学院</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">职称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{t.teacherNo}</td>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{t.college || "未分配"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Tag color="blue">{t.title || "—"}</Tag>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === "ACTIVE" ? <Tag color="green">正常</Tag> : <Tag color="red">已禁用</Tag>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.createTime?.split('T')[0] || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          setEditingTeacher(t);
                          setNewTeacher({ staffId: t.teacherNo, name: t.name, password: "", department: t.college || "", role: "" });
                          setShowEditModal(true);
                        }} className="text-primary hover:underline text-xs">编辑</button>
                        <button onClick={() => {
                          setConfirmAction({ type: t.status === "ACTIVE" ? "disable" : "enable", teacher: t });
                          setShowConfirmModal(true);
                        }} className={`hover:underline text-xs ${t.status === "ACTIVE" ? "text-orange-500" : "text-emerald-600"}`}>
                          {t.status === "ACTIVE" ? "禁用" : "启用"}
                        </button>
                        <button onClick={() => {
                          setEditingTeacher(t);
                          setShowResetModal(true);
                        }} className="text-blue-500 hover:underline text-xs">重置密码</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {filteredTeachers.length} 条记录</span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">上一页</button>
                <span className="px-2 py-1 bg-primary text-white rounded">1</span>
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">下一页</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                <h3 className="font-medium text-sm">部门树结构</h3>
              </div>
              <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">
                添加部门
              </button>
            </div>
            <div className="space-y-2">
              {departments.map(dept => (
                <div key={dept.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{dept.name}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{dept.count}人</span>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-primary">管理</button>
                  </div>
                  {dept.children && dept.children.length > 0 && (
                    <div className="ml-4 space-y-2">
                      {dept.children.map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-1.5 h-1.5 rounded-full bg-muted" />
                            <span className="text-sm">{child.name}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{child.count}人</span>
                          </div>
                          <button className="text-xs text-muted-foreground hover:text-primary">编辑</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon size={16} className="text-primary" />
              <h3 className="font-medium text-sm">部门教师分布</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={departments.map(d => ({ name: d.name, value: d.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {departments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              {roleTemplates.map(role => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-4 rounded-lg border text-sm transition-colors ${selectedRole === role.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{role.name}</span>
                    <Tag color="gray">{role.permissions.length}项权限</Tag>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </button>
              ))}
              <button className="w-full text-left p-4 rounded-lg border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-gray-900 transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <Plus size={16} />
                  自定义角色
                </div>
              </button>
            </div>
            <div className="bg-card rounded-lg border border-border p-5">
              {selectedRole ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm">权限详情</h3>
                    <button className="text-xs text-primary hover:underline">编辑权限</button>
                  </div>
                  <div className="space-y-2">
                    {allPermissions.map(perm => (
                      <div key={perm.id} className={`flex items-center justify-between p-3 rounded-lg ${roleTemplates.find(r => r.id === selectedRole)?.permissions.includes(perm.id) ? "bg-primary/5" : "bg-muted/50"}`}>
                        <span className="text-sm">{perm.name}</span>
                        {roleTemplates.find(r => r.id === selectedRole)?.permissions.includes(perm.id) ? (
                          <CheckCircle size={16} className="text-primary" />
                        ) : (
                          <XCircle size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Shield size={32} className="mx-auto mb-2" />
                    <p className="text-sm">请选择一个角色模板查看权限详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">添加教师</h3>
              <button onClick={() => { setShowAddModal(false); setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" }); }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">工号 <span className="text-red-500">*</span></label>
                <input value={newTeacher.staffId} onChange={e => setNewTeacher({ ...newTeacher, staffId: e.target.value })}
                  placeholder="请输入工号"
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">姓名 <span className="text-red-500">*</span></label>
                <input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">所属部门</label>
                <select value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择部门</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select value={newTeacher.role} onChange={e => setNewTeacher({ ...newTeacher, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择角色</option>
                  {roleTemplates.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">初始密码 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    type="password"
                    placeholder="请输入初始密码"
                    className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={generateRandomPassword} className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent">生成</button>
                </div>
                {generatedPassword && <p className="text-xs text-emerald-600 mt-1">生成密码：{generatedPassword}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddModal(false); setNewTeacher({ staffId: "", name: "", password: "", department: "", role: "" }); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleAddTeacher} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">编辑教师</h3>
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">工号</label>
                <input value={editingTeacher.staffId} disabled
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">姓名 <span className="text-red-500">*</span></label>
                <input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">所属部门</label>
                <select value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择部门</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select value={newTeacher.role} onChange={e => setNewTeacher({ ...newTeacher, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">请选择角色</option>
                  {roleTemplates.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleEditTeacher} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">重置密码</h3>
              <button onClick={handleResetPasswordCancel}><X size={16} /></button>
            </div>
            <p className="text-sm text-muted-foreground">为教师 <span className="font-medium">{editingTeacher.name}</span> 设置新密码</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">新密码</label>
                <div className="flex gap-2">
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    type="password"
                    placeholder="请输入新密码"
                    className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={generateRandomPassword} className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent">生成随机密码</button>
                </div>
                {generatedPassword && <p className="text-xs text-emerald-600 mt-1">新密码：{generatedPassword}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetPasswordCancel} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleResetPasswordConfirm} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">确认重置</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmAction.type === "disable" ? "bg-red-50" : "bg-emerald-50"}`}>
                {confirmAction.type === "disable" ? <XCircle size={20} className="text-red-500" /> : <CheckCircle size={20} className="text-emerald-500" />}
              </div>
              <div>
                <h3 className="font-semibold">{confirmAction.type === "disable" ? "禁用账号" : "启用账号"}</h3>
                <p className="text-sm text-muted-foreground">确定要{confirmAction.type === "disable" ? "禁用" : "启用"}教师 {confirmAction.teacher.name} 的账号吗？</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => handleStatusChange(confirmAction.type, confirmAction.teacher)}
                className={`flex-1 py-2 rounded-md text-sm ${confirmAction.type === "disable" ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                确定{confirmAction.type === "disable" ? "禁用" : "启用"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">批量导入教师</h3>
              <button onClick={() => { setShowImportModal(false); setImportResult(null); }}><X size={16} /></button>
            </div>
            {!importResult ? (
              <div className="space-y-4">
                <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-md hover:border-primary transition-colors">
                  <Download size={16} />下载导入模板
                </button>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">拖拽或点击上传 Excel 文件</p>
                  <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv 格式</p>
                </div>
                <button onClick={handleImport} className="w-full py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">开始导入</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-6 py-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mx-auto mb-2">
                      <CheckCircle size={24} className="text-emerald-500" />
                    </div>
                    <p className="font-mono text-xl font-bold text-emerald-600">{importResult.success}</p>
                    <p className="text-xs text-muted-foreground">成功</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
                      <XCircle size={24} className="text-red-500" />
                    </div>
                    <p className="font-mono text-xl font-bold text-red-600">{importResult.fail}</p>
                    <p className="text-xs text-muted-foreground">失败</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-red-700">失败记录：</p>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">{err}</p>
                    ))}
                    <button onClick={handleDownloadErrorLog} className="mt-2 w-full py-1.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-100">
                      下载错误日志
                    </button>
                  </div>
                )}
                <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="w-full py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">完成</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────
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
    { label: "大模型服务", status: "online", value: "正常运行", icon: Wifi, color: "bg-emerald-500" },
    { label: "数据库连接", status: "online", value: "已连接", icon: Database, color: "bg-emerald-500" },
    { label: "系统运行天数", status: "online", value: "156天", icon: Server, color: "bg-blue-500" },
    { label: "缓存服务", status: "degraded", value: "性能降级", icon: Activity, color: "bg-yellow-500" },
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
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">系统总览</h2>
            <p className="text-blue-100 text-sm mt-1">实时监控平台运行状态与业务数据</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm">系统正常运行中</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.map(item => (
          <button key={item.label} onClick={() => handleCardClick(item.label)}
            className="bg-card rounded-lg border border-border p-4 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "online" ? "bg-emerald-50" : item.status === "degraded" ? "bg-yellow-50" : "bg-red-50"}`}>
                {item.status === "online" ? <Wifi size={18} className="text-emerald-600" /> : item.status === "degraded" ? <Wifi size={18} className="text-yellow-600" /> : <WifiOff size={18} className="text-red-600" />}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.status === "online" ? "bg-emerald-100 text-emerald-700" : item.status === "degraded" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
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
              <span className="text-xs text-emerald-600">
                {item.change.startsWith("+") ? <ArrowUpRight size={12} className="inline mr-0.5" /> : <ArrowDownRight size={12} className="inline mr-0.5" />}
                {item.change}
              </span>
            </div>
            <p className="font-mono text-xl font-bold text-gray-900">{item.value}</p>
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
              <span className="w-3 h-0.5 bg-emerald-500 rounded" />
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
            <Line type="monotone" dataKey="teachers" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="活跃教师" />
            <Line type="monotone" dataKey="students" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="活跃学生" />
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
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.severity === "error" ? "bg-red-50" : event.severity === "warning" ? "bg-yellow-50" : "bg-blue-50"}`}>
                {event.severity === "error" ? <XCircle size={14} className="text-red-500" /> : event.severity === "warning" ? <AlertCircle size={14} className="text-yellow-500" /> : <CheckCircle size={14} className="text-blue-500" />}
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

// ─── Admin: Users ─────────────────────────────────────────────────────────────
function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<{ id: number; uid: string; name: string; role: string; college: string; class: string; status: string; created: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从后端获取教师列表，学生/管理员暂无全量接口，用 mock 补充
    getTeacherList(1, 100).then(data => {
      const teacherUsers = (data.records || []).map(t => ({
        id: t.id, uid: t.teacherNo || '', name: t.name || '',
        role: 'teacher', college: t.college || '', class: '—',
        status: t.status === 'ACTIVE' ? 'active' : 'inactive', created: t.createTime || '',
      }));
      // 合并 mock 中的学生和管理员数据
      const otherUsers = mockUsers.filter(u => u.role !== 'teacher');
      setUsers([...teacherUsers, ...otherUsers]);
    }).catch(() => {
      setUsers(mockUsers);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.includes(search) || u.uid.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名/学号..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="py-2 px-3 text-sm bg-card border border-border rounded-md focus:outline-none">
          <option value="all">全部角色</option>
          <option value="admin">管理员</option>
          <option value="teacher">教师</option>
          <option value="student">学生</option>
        </select>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent">
          <Download size={13} />导出
        </button>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-blue-700">
          <Plus size={13} />新增用户
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中...</div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 px-4 py-3 text-left"><input type="checkbox" /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">序号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">学号/工号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">所属学院</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.uid}</td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{roleLabel(u.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.college}</td>
                    <td className="px-4 py-3">
                      {u.status === "active" ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.created}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-primary hover:underline text-xs">编辑</button>
                        <button className="text-orange-500 hover:underline text-xs">重置密码</button>
                        <button className="text-red-500 hover:underline text-xs">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无用户数据</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>共 {filtered.length} 条记录</span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">上一页</button>
                <span className="px-2 py-1 bg-primary text-white rounded">1</span>
                <button className="px-2 py-1 border border-border rounded hover:bg-accent">下一页</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">新增用户</h3>
              <button onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {[["学号/工号", "请输入"], ["姓名", "请输入"], ["所属学院", "请输入"], ["班级（学生）", "请输入"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input placeholder={ph} className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none">
                  <option>学生</option><option>教师</option><option>管理员</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">确认新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Courses ───────────────────────────────────────────────────────────
function AdminCourses() {
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCourses().then(data => {
      setCourses(data);
    }).catch(() => {
      // 后端/admin 暂无全量课程列表接口，回退到 mock
      setCourses(mockCourses.map(c => ({
        id: c.id, courseNo: c.code, courseName: c.name, semester: c.semester,
        studentCount: c.students, className: c.name
      } as ClassVO)));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const keyword = search.toLowerCase();
    return !keyword || (c.courseName || '').toLowerCase().includes(keyword)
      || (c.courseNo || '').toLowerCase().includes(keyword);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索课程名/课程编码..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select className="py-2 px-3 text-sm bg-card border border-border rounded-md">
          <option>全部状态</option><option>进行中</option><option>已结束</option>
        </select>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-blue-700">
          <Plus size={13} />新增课程
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中...</div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["课程编码", "课程名称", "学期", "选课人数", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{c.courseNo || '-'}</td>
                  <td className="px-4 py-3 font-medium">{c.courseName || c.className}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.semester || '-'}</td>
                  <td className="px-4 py-3 font-mono">{c.studentCount ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-primary hover:underline text-xs">编辑</button>
                      <button className="text-primary hover:underline text-xs">详情</button>
                      <button className="text-red-500 hover:underline text-xs">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">暂无课程数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Admin: AI Ops Center ─────────────────────────────────────────────────────
function AdminAIOpsCenter() {
  const [modelStatus, setModelStatus] = useState("online");
  const [testResult, setTestResult] = useState<string | null>(null);

  const models = [
    { name: "qwen2.5:7b", size: "7B", status: "online" },
    { name: "qwen2.5:4b", size: "4B", status: "online" },
    { name: "llama3:8b", size: "8B", status: "degraded" },
    { name: "mistral:7b", size: "7B", status: "offline" },
  ];

  const responseTimeData = [
    { request: 1, time: 450 }, { request: 2, time: 380 }, { request: 3, time: 520 },
    { request: 4, time: 410 }, { request: 5, time: 390 }, { request: 6, time: 480 },
    { request: 7, time: 550 }, { request: 8, time: 420 }, { request: 9, time: 360 },
    { request: 10, time: 490 },
  ];

  const successRateData = [
    { name: "成功", value: 94 },
    { name: "超时", value: 3 },
    { name: "错误", value: 3 },
  ];

  const callStats = [
    { scenario: "智能出题", count: 1256, users: 28 },
    { scenario: "错题分析", count: 892, users: 22 },
    { scenario: "综合评价", count: 456, users: 18 },
    { scenario: "苏格拉底提问", count: 234, users: 15 },
    { scenario: "其他", count: 168, users: 12 },
  ];

  const frequentUsers = [
    { name: "王建国", calls: 286, department: "计算机学院" },
    { name: "刘晓红", calls: 215, department: "数学学院" },
    { name: "张晓明", calls: 198, department: "物理学院" },
    { name: "李婷婷", calls: 175, department: "经管学院" },
    { name: "陈志强", calls: 156, department: "计算机学院" },
  ];

  const promptTemplates = [
    { id: 1, name: "智能出题", scenario: "ai-quiz", variables: ["知识点", "题型", "数量", "难度"], content: "请根据以下知识点生成{{数量}}道{{题型}}题，难度为{{难度}}：\n\n知识点：{{知识点}}\n\n要求：题目要有区分度，覆盖不同难度级别。" },
    { id: 2, name: "错题分析", scenario: "wrong-analysis", variables: ["题目", "学生答案", "正确答案"], content: "分析以下错题并给出详细解析：\n\n题目：{{题目}}\n学生答案：{{学生答案}}\n正确答案：{{正确答案}}\n\n请从知识点掌握程度、错误原因、改进建议三个方面进行分析。" },
    { id: 3, name: "综合评价", scenario: "evaluation", variables: ["学生姓名", "课程", "成绩数据"], content: "为学生{{学生姓名}}生成{{课程}}课程的综合评价报告，基于以下数据：\n\n{{成绩数据}}\n\n评价应包括学习表现、优势领域、改进建议等方面。" },
  ];

  const [activeTemplate, setActiveTemplate] = useState(promptTemplates[0]);
  const [templateContent, setTemplateContent] = useState(promptTemplates[0].content);
  const [testResultText, setTestResultText] = useState("");

  const handleTestTemplate = () => {
    setTestResultText("正在生成测试结果...");
    setTimeout(() => {
      setTestResultText("【测试结果示例】\n\n请根据以下知识点生成5道选择题，难度为中等：\n\n知识点：数据结构、算法\n\n1. 以下哪种数据结构最适合实现\"先进先出\"的操作？\nA) 栈 B) 队列 C) 链表 D) 二叉树\n\n2. 快速排序的平均时间复杂度是？\nA) O(n) B) O(nlogn) C) O(n²) D) O(logn)\n...");
    }, 1500);
  };

  const handleTestConnection = () => {
    setTestResult("测试中...");
    setTimeout(() => {
      setTestResult("连接成功！大模型服务运行正常");
      setModelStatus("online");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">AI运维中心</h2>
            <p className="text-blue-100 text-sm mt-1">监控和管理AI模型服务与调用</p>
          </div>
          <div className="flex items-center gap-2">
            {modelStatus === "online" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm">AI服务正常</span>
              </>
            ) : modelStatus === "degraded" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-sm">AI服务降级</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm">AI服务离线</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-primary" />
              <h3 className="font-medium text-sm">模型服务状态</h3>
            </div>
            <button onClick={handleTestConnection} className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">
              测试连接
            </button>
          </div>
          {testResult && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${testResult.includes("成功") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {testResult}
            </div>
          )}
          <div className="space-y-3">
            {models.map(model => (
              <div key={model.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">模型大小：{model.size}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${model.status === "online" ? "bg-emerald-100 text-emerald-700" : model.status === "degraded" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {model.status === "online" ? "在线" : model.status === "degraded" ? "降级" : "离线"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="font-medium text-sm">响应时间分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="request" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => `${v}ms`} />
              <Bar dataKey="time" fill="#1A56DB" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>平均响应时间：443ms</span>
            <span>P95响应时间：550ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-primary" />
            <h3 className="font-medium text-sm">调用成功率</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={successRateData} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {successRateData.map((_, i) => <Cell key={i} fill={i === 0 ? "#10B981" : i === 1 ? "#F59E0B" : "#EF4444"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary" />
            <h3 className="font-medium text-sm">场景调用统计</h3>
          </div>
          <div className="space-y-2">
            {callStats.map(item => (
              <div key={item.scenario}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.scenario}</span>
                  <span>{item.count}次</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(item.count / 1256) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h3 className="font-medium text-sm">活跃用户排行</h3>
          </div>
          <div className="space-y-2">
            {frequentUsers.map((user, i) => (
              <div key={user.name} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.department}</p>
                </div>
                <span className="text-xs font-mono">{user.calls}次</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h3 className="font-medium text-sm">Prompt模板管理</h3>
          </div>
          <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">
            恢复默认
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {promptTemplates.map(tpl => (
              <button key={tpl.id} onClick={() => { setActiveTemplate(tpl); setTemplateContent(tpl.content); }}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${activeTemplate.id === tpl.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tpl.scenario}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">模板内容</label>
              <textarea value={templateContent} onChange={e => setTemplateContent(e.target.value)}
                className="w-full h-40 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">可用变量：</span>
                {activeTemplate.variables.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{'{'}{'{'}{v}{'}'}{'}'}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleTestTemplate} className="px-3 py-1.5 border border-border text-sm rounded-md hover:bg-accent">
                  测试运行
                </button>
                <button className="px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-blue-700">
                  保存模板
                </button>
              </div>
            </div>
            {testResultText && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">测试结果预览：</p>
                <pre className="text-xs font-mono whitespace-pre-wrap">{testResultText}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Audit Logs ────────────────────────────────────────────────────────
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
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">系统审计日志</h2>
            <p className="text-blue-100 text-sm mt-1">追踪系统操作记录与异常事件</p>
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
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-mono text-xl font-bold">{abnormalEvents.filter(e => e.severity === "error").length}</p>
              <p className="text-xs text-muted-foreground">严重异常</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-yellow-500" />
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
                      {log.privacy && <span className="inline-flex items-center gap-1 mr-1"><Shield size={10} className="text-orange-500" /></span>}
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
                    <td className="px-4 py-3">
                      {log.status === "success" ? <span className="text-emerald-600 text-xs font-medium">成功</span> : <span className="text-red-600 text-xs font-medium">失败</span>}
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
              <div key={event.id} className={`p-3 rounded-lg ${event.severity === "error" ? "bg-red-50 border border-red-100" : event.severity === "warning" ? "bg-yellow-50 border border-yellow-100" : "bg-blue-50 border border-blue-100"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${event.severity === "error" ? "text-red-700" : event.severity === "warning" ? "text-yellow-700" : "text-blue-700"}`}>
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

// ─── Admin: Config ────────────────────────────────────────────────────────────
function AdminConfig() {
  const [modelApiUrl, setModelApiUrl] = useState("http://localhost:11434");
  const [modelName, setModelName] = useState("qwen2.5:7b");
  const [modelTimeout, setModelTimeout] = useState("60");
  const [defaultPassword, setDefaultPassword] = useState("123456");
  const [absenteeismThreshold, setAbsenteeismThreshold] = useState("3");
  const [gradeDropThreshold, setGradeDropThreshold] = useState("20");
  const [homeworkThreshold, setHomeworkThreshold] = useState("3");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAllConfigs().then(data => {
      const allConfigs = Object.values(data || {}).flat();
      for (const c of allConfigs) {
        if (c.configKey === "model.api.url") setModelApiUrl(c.configValue || "");
        if (c.configKey === "model.name") setModelName(c.configValue || "");
        if (c.configKey === "model.timeout") setModelTimeout(c.configValue || "");
        if (c.configKey === "default.password") setDefaultPassword(c.configValue || "");
        if (c.configKey === "absenteeism.threshold") setAbsenteeismThreshold(c.configValue || "");
        if (c.configKey === "grade.drop.threshold") setGradeDropThreshold(c.configValue || "");
        if (c.configKey === "homework.threshold") setHomeworkThreshold(c.configValue || "");
      }
    }).catch(() => {});
  }, []);

  const [riskWeights, setRiskWeights] = useState({
    attendance: 30,
    scoreDrop: 35,
    homework: 20,
    activity: 15,
  });

  const save = async () => {
    try {
      await batchUpdateConfigs({
        "model.api.url": modelApiUrl,
        "model.name": modelName,
        "model.timeout": modelTimeout,
        "default.password": defaultPassword,
        "absenteeism.threshold": absenteeismThreshold,
        "grade.drop.threshold": gradeDropThreshold,
        "homework.threshold": homeworkThreshold,
      });
    } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold">系统配置</h2>
        <p className="text-blue-100 text-sm mt-1">管理系统全局参数设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-purple-500" />
            <h3 className="font-medium text-sm">大模型配置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">大模型API地址</label>
              <input type="text" value={modelApiUrl} onChange={e => setModelApiUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="http://localhost:11434" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">大模型名称</label>
              <input type="text" value={modelName} onChange={e => setModelName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="qwen2.5:7b" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">模型超时时间（秒）</label>
              <input type="number" value={modelTimeout} onChange={e => setModelTimeout(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-500" />
            <h3 className="font-medium text-sm">教师导入配置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">默认初始密码</label>
              <div className="flex items-center gap-2">
                <input type="text" value={defaultPassword} onChange={e => setDefaultPassword(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">教师账号初始密码</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-orange-500" />
          <h3 className="font-medium text-sm">预警规则全局管理</h3>
          <span className="text-xs text-muted-foreground ml-auto">教师可在默认规则基础上自定义</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">预警阈值设置</h4>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">缺勤预警阈值（次）</label>
              <div className="flex items-center gap-3">
                <input type="number" value={absenteeismThreshold} onChange={e => setAbsenteeismThreshold(e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground">累计缺勤≥此值触发</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">成绩下滑预警阈值（%）</label>
              <div className="flex items-center gap-3">
                <input type="number" value={gradeDropThreshold} onChange={e => setGradeDropThreshold(e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground">连续两次下降≥此值</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">作业未交预警阈值（次）</label>
              <div className="flex items-center gap-3">
                <input type="number" value={homeworkThreshold} onChange={e => setHomeworkThreshold(e.target.value)}
                  className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <span className="text-xs text-muted-foreground">连续未交≥此值触发</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">综合风险评分权重</h4>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">出勤情况</span>
                <span>{riskWeights.attendance}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.attendance} onChange={e => setRiskWeights({ ...riskWeights, attendance: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">成绩下滑</span>
                <span>{riskWeights.scoreDrop}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.scoreDrop} onChange={e => setRiskWeights({ ...riskWeights, scoreDrop: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">作业完成</span>
                <span>{riskWeights.homework}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.homework} onChange={e => setRiskWeights({ ...riskWeights, homework: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">学习活跃度</span>
                <span>{riskWeights.activity}%</span>
              </div>
              <input type="range" min="0" max="100" value={riskWeights.activity} onChange={e => setRiskWeights({ ...riskWeights, activity: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">权重总和</span>
              <span className={`text-xs font-medium ${riskWeights.attendance + riskWeights.scoreDrop + riskWeights.homework + riskWeights.activity === 100 ? "text-emerald-600" : "text-red-600"}`}>
                {riskWeights.attendance + riskWeights.scoreDrop + riskWeights.homework + riskWeights.activity}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">预警等级划分</h4>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-red-700">高风险</span>
                <span className="text-xs text-red-600">评分 ≥ 70分</span>
              </div>
              <p className="text-xs text-red-600">需要重点关注，建议及时沟通</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-yellow-700">中风险</span>
                <span className="text-xs text-yellow-600">40分 ≤ 评分 {'<'} 70分</span>
              </div>
              <p className="text-xs text-yellow-600">需要持续观察学习状态</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-emerald-700">低风险</span>
                <span className="text-xs text-emerald-600">评分 {'<'} 40分</span>
              </div>
              <p className="text-xs text-emerald-600">学习状态良好，继续保持</p>
            </div>
          </div>
        </div>
      </div>



      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-gray-500" />
          <h3 className="font-medium text-sm">系统维护</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            <RotateCcw size={16} />
            重置系统缓存
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            <Download size={16} />
            导出系统日志
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-sm hover:bg-accent transition-colors">
            <Upload size={16} />
            导入配置备份
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          最后更新：2024-01-15 10:30
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
            重置为默认
          </button>
          <button onClick={save} className="px-5 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Save size={14} />
            保存配置
          </button>
          {saved && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle size={14} />保存成功</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Teacher: Dashboard (教学驾驶舱) ──────────────────────────────────────────
function TeacherDashboard({ onNav, setSelectedStudentId, setSelectedCourseId }: { onNav: (p: Page) => void; setSelectedStudentId: (id: number | null) => void; setSelectedCourseId: (id: number | null) => void }) {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"single" | "merged" | "compare">("single");
  const [selectedCompareClasses, setSelectedCompareClasses] = useState<number[]>([1, 2]);
  const [warningFilter, setWarningFilter] = useState<string | null>(null);
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAutoWarningModal, setShowAutoWarningModal] = useState(false);
  const [autoWarningConfig, setAutoWarningConfig] = useState({
    attendanceThreshold: 3,
    homeworkThreshold: 2,
    scoreDropThreshold: 10,
    autoSendNotification: true,
    checkFrequency: "daily",
  });
  const [notificationContent, setNotificationContent] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [moduleOrder, setModuleOrder] = useState(["stats", "score-dist", "score-trend", "attendance", "homework", "experiment", "warnings"]);
  const [assessmentType, setAssessmentType] = useState<string | null>(null);

  const typeModuleMap: Record<string, string[]> = {
    homework: ["stats", "homework"],
    test: ["stats", "score-dist", "score-trend", "warnings"],
    experiment: ["stats", "experiment"],
  };

  const isModuleVisible = (moduleId: string) => {
    if (hiddenModules.includes(moduleId)) return false;
    if (!assessmentType) return true;
    if (moduleId === "course-profile") return true;
    const allowedModules = typeModuleMap[assessmentType] || [];
    return allowedModules.includes(moduleId);
  };

  // API data states
  const [dashboardCourses, setDashboardCourses] = useState<ClassVO[]>([]);
  const [dashboardCharts, setDashboardCharts] = useState<DashboardCharts | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [dashboardWarnings, setDashboardWarnings] = useState<WarningStudent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    getMyCourses().then(courses => {
      setDashboardCourses(courses);
    }).catch(() => {
      // Fallback to mock data
      setDashboardCourses(teacherClasses.map(c => ({ id: c.id, className: c.name, courseName: c.course, semester: c.semester, studentCount: c.studentCount })));
    });
  }, []);

  // Fetch dashboard data when class is selected
  useEffect(() => {
    if (!selectedClass) return;
    setDataLoading(true);
    getDashboardFull(selectedClass).then(data => {
      setDashboardOverview(data.overview);
      setDashboardCharts(data.charts);
      setDashboardWarnings(data.warnings);
    }).catch(() => {
      // Fallback to mock data
      const mock = classDashboardData[selectedClass];
      if (mock) {
        setDashboardOverview({ avgScore: mock.avgScore, attendanceRate: mock.attendanceRate, homeworkRate: mock.homeworkRate });
        setDashboardCharts({ scoreDist: mock.scoreDist, scoreTrend: mock.scoreTrend, attendanceStats: mock.attendanceStats, homeworkSubmitStats: mock.homeworkSubmitStats, attendanceTrend: mock.attendanceTrend, knowledgeData: mock.knowledgeData });
        setDashboardWarnings(warningStudents || []);
      }
    }).finally(() => setDataLoading(false));
  }, [selectedClass]);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const toggleWarningSelection = (uid: string) => {
    setSelectedWarnings(prev =>
      prev.includes(uid) ? prev.filter(w => w !== uid) : [...prev, uid]
    );
  };

  const classInfo = dashboardCourses.find(c => c.id === selectedClass);
  const currentCharts = dashboardCharts;
  const currentOverview = dashboardOverview;
  const currentWarnings = dashboardWarnings;
  const warningCount = currentWarnings.filter(w => warningFilter ? w.reason === warningFilter : true).length;
  const filteredWarnings = currentWarnings.filter(w => warningFilter ? w.reason === warningFilter : true);

  const handleSendNotification = async () => {
    if (!notificationContent.trim()) { alert("请输入通知内容"); return; }
    try {
      await sendNotification({ title: "教学预警通知", content: notificationContent, courseId: selectedClass || undefined });
      setShowNotificationModal(false);
      setNotificationContent("");
      setSelectedWarnings([]);
      showToastMsg("通知已发送");
    } catch {
      showToastMsg("发送失败，请重试");
    }
  };

  const toggleModuleVisibility = (module: string) => {
    setHiddenModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
  };

  const toggleCompareClass = (classId: number) => {
    setSelectedCompareClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(c => c !== classId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), classId];
      }
      return [...prev, classId];
    });
  };

  const compareScoreData = [
    { exam: "第1次测验", class1: 75, class2: 72, class3: 78 },
    { exam: "第2次测验", class1: 72, class2: 76, class3: 75 },
    { exam: "期中考试", class1: 78, class2: 74, class3: 80 },
    { exam: "第3次测验", class1: 76, class2: 78, class3: 77 },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      {selectedClass === null ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">教学驾驶舱</h2>
              <p className="text-sm text-muted-foreground mt-1">选择班级查看详细数据</p>
            </div>
            <button onClick={() => setViewMode("compare")} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-accent">
              <GitCompare size={14} />班级对比
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardCourses.map(c => {
              const warningCount = dashboardWarnings.length;
              return (
                <div key={c.id} onClick={() => setSelectedClass(c.id)}
                  className="bg-card rounded-xl border border-border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-base">{c.className}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{c.courseName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.semester}</p>
                    </div>
                    {warningCount > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">{warningCount} 预警</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="font-mono font-bold text-primary">{c.studentCount || 0}</p>
                      <p className="text-xs text-muted-foreground">人数</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-bold text-green-600">{c.avgScore != null && c.avgScore > 0 ? Number(c.avgScore).toFixed(1) : "—"}</p>
                      <p className="text-xs text-muted-foreground">平均分</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-bold text-blue-600">{c.attendanceRate != null && c.attendanceRate > 0 ? Number(c.attendanceRate).toFixed(1) + "%" : "—"}</p>
                      <p className="text-xs text-muted-foreground">出勤率</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-bold text-emerald-600">{c.homeworkRate != null && c.homeworkRate > 0 ? Number(c.homeworkRate).toFixed(1) + "%" : "—"}</p>
                      <p className="text-xs text-muted-foreground">作业率</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">点击查看详情</span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedClass(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ChevronLeft size={16} />返回班级列表
              </button>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select value={selectedClass} onChange={e => setSelectedClass(parseInt(e.target.value))}
                    className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                    {dashboardCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.className} · {c.courseName}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
                </div>
                <div className="flex bg-card border border-border rounded-lg p-0.5">
                  <button onClick={() => setViewMode("single")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "single" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    单班查看
                  </button>
                  <button onClick={() => setViewMode("merged")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "merged" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    多班合并
                  </button>
                  <button onClick={() => setViewMode("compare")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "compare" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    班级对比
                  </button>
                </div>
                <div className="flex bg-card border border-border rounded-lg p-0.5 ml-2">
                  <button onClick={() => setAssessmentType(null)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${!assessmentType ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    全部类型
                  </button>
                  <button onClick={() => setAssessmentType("homework")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${assessmentType === "homework" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    作业
                  </button>
                  <button onClick={() => setAssessmentType("test")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${assessmentType === "test" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    测试
                  </button>
                  <button onClick={() => setAssessmentType("experiment")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${assessmentType === "experiment" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                    实验
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {viewMode === "compare" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">对比班级：</span>
                  {dashboardCourses.map(c => (
                    <button key={c.id} onClick={() => toggleCompareClass(c.id)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${selectedCompareClasses.includes(c.id) ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>
                      {c.className}
                    </button>
                  ))}
                </div>
              )}
              {classInfo && viewMode !== "compare" && (
                <span className="text-sm text-muted-foreground">{classInfo.semester} · {classInfo.courseName}</span>
              )}
              <button onClick={() => setShowCustomizeModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-accent">
                <Settings size={14} />布局设置
              </button>
            </div>
          </div>

          {viewMode === "compare" ? (
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-medium text-sm mb-4">班级成绩对比</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={compareScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="class1" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name={dashboardCourses.find(c => c.id === selectedCompareClasses[0])?.name} />
                  {selectedCompareClasses.length > 1 && <Line type="monotone" dataKey="class2" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name={dashboardCourses.find(c => c.id === selectedCompareClasses[1])?.name} />}
                  {selectedCompareClasses.length > 2 && <Line type="monotone" dataKey="class3" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name={dashboardCourses.find(c => c.id === selectedCompareClasses[2])?.name} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <>
              {isModuleVisible("stats") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: "班级人数", value: currentOverview?.studentCount ?? classInfo?.studentCount ?? 0, icon: Users, color: "blue" },
                    { label: "平均成绩", value: currentOverview?.averageScore != null ? Number(currentOverview.averageScore).toFixed(1) : "—", icon: TrendingUp, color: "green" },
                    { label: "出勤率", value: currentOverview?.attendanceRate != null ? Number(currentOverview.attendanceRate).toFixed(1) + "%" : "—", icon: Activity, color: "blue" },
                    { label: "作业提交率", value: currentOverview?.homeworkRate != null ? Number(currentOverview.homeworkRate).toFixed(1) + "%" : "—", icon: CheckCircle, color: "green" },
                    { label: "预警人数", value: warningCount.toString(), icon: AlertCircle, color: "red", highlight: warningCount > 0 },
                  ].map(item => (
                    <div key={item.label} className={`bg-card rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-md ${item.highlight ? "border-red-200 bg-red-50/50" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color === "red" ? "bg-red-100" : item.color === "green" ? "bg-green-100" : "bg-blue-100"}`}>
                          <item.icon size={16} className={item.color === "red" ? "text-red-600" : item.color === "green" ? "text-green-600" : "text-blue-600"} />
                        </div>
                        {item.highlight && <span className="text-xs text-red-600 font-medium">点击查看</span>}
                      </div>
                      <p className={`font-mono text-xl font-bold ${item.highlight ? "text-red-600" : "text-primary"}`}>{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className={`grid gap-4 ${assessmentType ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {isModuleVisible("score-dist") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">班级成绩分布图</h3>
                    {assessmentType === "test" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={currentCharts?.scoreDistribution || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}人`} />
                            <Bar dataKey="value" fill="#1A56DB" radius={[2, 2, 0, 0]} name="人数" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[220px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">分数段</th>
                                <th className="text-center font-medium py-2 px-2">人数</th>
                                <th className="text-center font-medium py-2 px-2">占比</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.scoreDistribution || []).map((item, i) => {
                                const total = (currentCharts?.scoreDistribution || []).reduce((sum, x) => sum + (x.value || 0), 0);
                                const pct = total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : "0";
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="py-2 px-2 font-medium">{item.name}</td>
                                    <td className="text-center py-2 px-2 text-primary">{item.value}</td>
                                    <td className="text-center py-2 px-2 text-muted-foreground">{pct}%</td>
                                  </tr>
                                );
                              })}
                              {(currentCharts?.scoreDistribution || []).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center py-8 text-muted-foreground text-xs">暂无成绩数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={currentCharts?.scoreDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => `${v}人`} />
                          <Bar dataKey="value" fill="#1A56DB" radius={[2, 2, 0, 0]} name="人数" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
                {isModuleVisible("score-trend") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-sm">成绩趋势图</h3>
                    </div>
                    {assessmentType === "test" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={currentCharts?.scoreTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}分`} />
                            <Line type="monotone" dataKey="value" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="班级平均分" />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[220px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">考核名称</th>
                                <th className="text-center font-medium py-2 px-2">平均分</th>
                                <th className="text-center font-medium py-2 px-2">排名</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.scoreTrend || []).map((item, i) => {
                                const sorted = [...(currentCharts?.scoreTrend || [])].sort((a, b) => (b.value || 0) - (a.value || 0));
                                const rank = sorted.findIndex(s => s.name === item.name) + 1;
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="py-2 px-2 font-medium">{item.name}</td>
                                    <td className="text-center py-2 px-2 text-primary font-mono">{item.value}</td>
                                    <td className="text-center py-2 px-2">
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${rank <= 3 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                                        第{rank}名
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {(currentCharts?.scoreTrend || []).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center py-8 text-muted-foreground text-xs">暂无成绩数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={currentCharts?.scoreTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => `${v}分`} />
                          <Line type="monotone" dataKey="value" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="班级平均分" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>

              <div className={`grid gap-4 ${assessmentType ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {isModuleVisible("attendance") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">考勤统计</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={currentCharts?.attendanceStats || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                          {(currentCharts?.attendanceStats || []).map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${v}次`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {isModuleVisible("homework") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">作业提交统计</h3>
                    {assessmentType === "homework" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={currentCharts?.homeworkStats || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="homeworkName" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="onTimeCount" fill="#10B981" name="按时" />
                            <Bar dataKey="lateCount" fill="#F59E0B" name="迟交" />
                            <Bar dataKey="absentCount" fill="#EF4444" name="未交" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[200px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">作业名称</th>
                                <th className="text-center font-medium py-2 px-2">按时</th>
                                <th className="text-center font-medium py-2 px-2">迟交</th>
                                <th className="text-center font-medium py-2 px-2">未交</th>
                                <th className="text-center font-medium py-2 px-2">提交率</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.homeworkStats || []).map((hw, i) => {
                                const total = hw.onTimeCount + hw.lateCount + hw.absentCount;
                                const rate = total > 0 ? ((hw.onTimeCount + hw.lateCount) / total * 100).toFixed(1) : "0";
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="py-2 px-2 font-medium">{hw.homeworkName}</td>
                                    <td className="text-center py-2 px-2 text-green-600">{hw.onTimeCount}</td>
                                    <td className="text-center py-2 px-2 text-yellow-600">{hw.lateCount}</td>
                                    <td className="text-center py-2 px-2 text-red-600">{hw.absentCount}</td>
                                    <td className="text-center py-2 px-2 font-medium">{rate}%</td>
                                  </tr>
                                );
                              })}
                              {(currentCharts?.homeworkStats || []).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-xs">暂无作业数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={currentCharts?.homeworkStats || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="homeworkName" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="onTimeCount" fill="#10B981" name="按时" />
                          <Bar dataKey="lateCount" fill="#F59E0B" name="迟交" />
                          <Bar dataKey="absentCount" fill="#EF4444" name="未交" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
                {isModuleVisible("experiment") && (
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-medium text-sm mb-4">实验报告统计</h3>
                    {assessmentType === "experiment" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={currentCharts?.experimentStats || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="experimentName" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}分`} />
                            <Legend />
                            <Bar dataKey="avgScore" fill="#8B5CF6" name="平均分" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto max-h-[200px]">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/30 sticky top-0">
                              <tr>
                                <th className="text-left font-medium py-2 px-2">实验名称</th>
                                <th className="text-center font-medium py-2 px-2">平均分</th>
                                <th className="text-center font-medium py-2 px-2">提交率</th>
                                <th className="text-center font-medium py-2 px-2">提交/总数</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(currentCharts?.experimentStats || []).map((exp, i) => (
                                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                                  <td className="py-2 px-2 font-medium">{exp.experimentName}</td>
                                  <td className="text-center py-2 px-2 text-purple-600 font-mono">{exp.avgScore}</td>
                                  <td className="text-center py-2 px-2 font-medium">{exp.submitRate}%</td>
                                  <td className="text-center py-2 px-2 text-muted-foreground text-xs">{exp.submittedCount}/{exp.totalCount}</td>
                                </tr>
                              ))}
                              {(currentCharts?.experimentStats || []).length === 0 && (
                                <tr>
                                  <td colSpan={4} className="text-center py-8 text-muted-foreground text-xs">暂无实验数据</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={currentCharts?.experimentStats || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="experimentName" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => `${v}分`} />
                          <Legend />
                          <Bar dataKey="avgScore" fill="#8B5CF6" name="平均分" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </div>

              {isModuleVisible("warnings") && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-sm">预警学生列表</h3>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">{filteredWarnings.length} 条</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowAutoWarningModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent">
                        <Settings size={12} />自动预警设置
                      </button>
                      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                        <button onClick={() => setWarningFilter(null)} className={`text-xs px-2.5 py-1 rounded transition-colors ${!warningFilter ? "bg-primary text-white" : "hover:bg-accent"}`}>全部</button>
                        <button onClick={() => setWarningFilter("成绩下滑")} className={`text-xs px-2.5 py-1 rounded transition-colors ${warningFilter === "成绩下滑" ? "bg-primary text-white" : "hover:bg-accent"}`}>成绩下滑</button>
                        <button onClick={() => setWarningFilter("缺勤过多")} className={`text-xs px-2.5 py-1 rounded transition-colors ${warningFilter === "缺勤过多" ? "bg-primary text-white" : "hover:bg-accent"}`}>缺勤过多</button>
                        <button onClick={() => setWarningFilter("作业连续未交")} className={`text-xs px-2.5 py-1 rounded transition-colors ${warningFilter === "作业连续未交" ? "bg-primary text-white" : "hover:bg-accent"}`}>作业未交</button>
                      </div>
                      {selectedWarnings.length > 0 && (
                        <>
                          <button onClick={() => setShowNotificationModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-blue-700">
                            <Bell size={12} />发送通知 ({selectedWarnings.length})
                          </button>
                          <button onClick={() => { setSelectedWarnings([]); showToastMsg("已取消选择"); }} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent">
                            <X size={12} />取消选择
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-10">
                            <input type="checkbox" checked={selectedWarnings.length === filteredWarnings.length && filteredWarnings.length > 0}
                              onChange={e => setSelectedWarnings(e.target.checked ? filteredWarnings.map(w => w.uid) : [])} className="w-4 h-4" />
                          </th>
                          {["学号", "姓名", "预警类型", "预警时间", "严重程度", "操作"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWarnings.map(w => (
                          <tr key={w.uid} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <input type="checkbox" checked={selectedWarnings.includes(w.uid)} onChange={() => toggleWarningSelection(w.uid)} className="w-4 h-4" />
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs">{w.uid}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-primary cursor-pointer hover:underline font-medium" onClick={() => { setSelectedStudentId(w.studentId); setSelectedCourseId(selectedClass); onNav("teacher-profile"); }}>{w.studentName || w.name}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <Tag color={w.type === "成绩下滑" ? "red" : w.type === "缺勤过多" ? "orange" : "yellow"}>
                                {w.type === "成绩下滑" && <TrendingUp className="inline-block w-3 h-3 mr-1" />}
                                {w.type === "缺勤过多" && <AlertCircle className="inline-block w-3 h-3 mr-1" />}
                                {w.type === "作业连续未交" && <BookMarked className="inline-block w-3 h-3 mr-1" />}
                                {w.type}
                              </Tag>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{w.time}</td>
                            <td className="px-4 py-2.5">
                              <Tag color={w.severity === "高" ? "red" : w.severity === "中" ? "orange" : "yellow"}>
                                {w.severity === "高" && <span className="inline-block w-1.5 h-1.5 bg-current rounded-full mr-1 animate-pulse" />}
                                {w.severity}
                              </Tag>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setSelectedStudentId(w.studentId); setSelectedCourseId(selectedClass); onNav("teacher-profile"); }} className="flex items-center gap-1 text-primary hover:underline text-xs">
                                  <Eye size={12} />查看详情
                                </button>
                                <button onClick={() => showToastMsg(`已标记 ${w.name} 的预警为已处理`)} className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded text-xs">
                                  <CheckCircle size={12} />标记处理
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredWarnings.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                              <Shield size={24} className="mx-auto mb-2 opacity-50" />
                              <p>暂无预警学生</p>
                              <p className="text-xs mt-1">当前筛选条件下没有需要关注的学生</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isModuleVisible("course-profile") && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-medium text-sm">综合课程画像</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "课程名称", value: classInfo?.courseName || "计算机网络", icon: BookOpen, color: "blue" },
                        { label: "授课班级", value: `${dashboardCourses.length}个班`, icon: Building2, color: "green" },
                        { label: "总学生数", value: dashboardCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0).toString(), icon: Users, color: "purple" },
                        { label: "教学周期", value: classInfo?.semester || "2025-2026学年第二学期", icon: Calendar, color: "orange" },
                      ].map(item => (
                        <div key={item.label} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color === "blue" ? "bg-blue-100" : item.color === "green" ? "bg-green-100" : item.color === "purple" ? "bg-purple-100" : "bg-orange-100"}`}>
                            <item.icon size={14} className={item.color === "blue" ? "text-blue-600" : item.color === "green" ? "text-green-600" : item.color === "purple" ? "text-purple-600" : "text-orange-600"} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3">知识点掌握度分布</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={currentCharts?.knowledgeRadar || []}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => `${v}%`} />
                            <Bar dataKey="value" fill="#1A56DB" radius={[4, 4, 0, 0]}>
                              {(currentCharts?.knowledgeRadar || []).map((item, i) => (
                                <Cell key={`cell-${i}`} fill={item.value >= 80 ? "#10B981" : item.value >= 70 ? "#1A56DB" : item.value >= 60 ? "#F59E0B" : "#EF4444"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3">学习资源使用情况</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={[
                              { name: "视频学习", value: 45 },
                              { name: "在线测验", value: 25 },
                              { name: "实验实践", value: 20 },
                              { name: "讨论互动", value: 10 },
                            ]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                              {[{ fill: "#1A56DB" }, { fill: "#10B981" }, { fill: "#F59E0B" }, { fill: "#8B5CF6" }].map((c, i) => (
                                <Cell key={`cell-${i}`} {...c} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${v}%`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-3">课程分析与改进建议</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs flex-shrink-0">优</div>
                          <div>
                            <p className="text-sm font-medium">整体表现良好</p>
                            <p className="text-xs text-muted-foreground">大部分学生对TCP/IP和HTTP协议掌握较好，视频学习资源利用率高。</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs flex-shrink-0">改</div>
                          <div>
                            <p className="text-sm font-medium">重点关注薄弱环节</p>
                            <p className="text-xs text-muted-foreground">路由算法和拥塞控制是学生的薄弱点，建议增加相关练习和讲解。</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs flex-shrink-0">建</div>
                          <div>
                            <p className="text-sm font-medium">互动性有待提升</p>
                            <p className="text-xs text-muted-foreground">讨论区互动较少，建议增加课堂互动环节或设置小组讨论任务。</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showAutoWarningModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">自动预警设置</h3>
                      <button onClick={() => setShowAutoWarningModal(false)}><X size={16} /></button>
                    </div>
                    <p className="text-sm text-muted-foreground">设置自动预警规则，系统将根据规则自动检测并发送预警通知。</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">缺勤阈值（次数）</label>
                        <input type="number" value={autoWarningConfig.attendanceThreshold} onChange={e => setAutoWarningConfig(prev => ({ ...prev, attendanceThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">学生缺勤次数超过此值时触发预警</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">作业缺交阈值（次数）</label>
                        <input type="number" value={autoWarningConfig.homeworkThreshold} onChange={e => setAutoWarningConfig(prev => ({ ...prev, homeworkThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">学生连续缺交作业次数超过此值时触发预警</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">成绩下滑阈值（分）</label>
                        <input type="number" value={autoWarningConfig.scoreDropThreshold} onChange={e => setAutoWarningConfig(prev => ({ ...prev, scoreDropThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                        <p className="text-xs text-muted-foreground mt-1">学生成绩较上次下降超过此分数时触发预警</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">自动发送预警通知</label>
                        <input type="checkbox" checked={autoWarningConfig.autoSendNotification} onChange={e => setAutoWarningConfig(prev => ({ ...prev, autoSendNotification: e.target.checked }))} className="w-4 h-4 rounded" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">检查频率</label>
                        <select value={autoWarningConfig.checkFrequency} onChange={e => setAutoWarningConfig(prev => ({ ...prev, checkFrequency: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm">
                          <option value="daily">每天</option>
                          <option value="weekly">每周</option>
                          <option value="after-exam">每次考试后</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button onClick={() => setShowAutoWarningModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
                      <button onClick={() => { setShowAutoWarningModal(false); showToastMsg("自动预警设置已保存"); }} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">保存设置</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">页面布局设置</h3>
              <button onClick={() => setShowCustomizeModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground">显示/隐藏模块</h4>
              {[
                { id: "stats", name: "统计卡片" },
                { id: "score-dist", name: "成绩分布图" },
                { id: "score-trend", name: "成绩趋势图" },
                { id: "attendance", name: "考勤统计" },
                { id: "homework", name: "作业提交统计" },
                { id: "experiment", name: "实验报告统计" },
                { id: "warnings", name: "预警学生列表" },
                { id: "course-profile", name: "综合课程画像" },
              ].map(module => (
                <div key={module.id} className="flex items-center justify-between">
                  <span className="text-sm">{module.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={!hiddenModules.includes(module.id)} onChange={() => toggleModuleVisibility(module.id)} className="sr-only peer" />
                    <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary`} />
                  </label>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCustomizeModal(false)} className="w-full py-2 bg-primary text-white rounded-md text-sm">保存设置</button>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">发送通知</h3>
              <button onClick={() => setShowNotificationModal(false)}><X size={16} /></button>
            </div>
            <p className="text-sm text-muted-foreground">已选择 {selectedWarnings.length} 名学生</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">通知内容</label>
              <textarea value={notificationContent} onChange={e => setNotificationContent(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-32"
                placeholder="请输入通知内容..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNotificationModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm">取消</button>
              <button onClick={handleSendNotification} className="flex-1 py-2 bg-primary text-white rounded-md text-sm">发送通知</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teaching Assistant: Dashboard (教学驾驶舱) ────────────────────────────────
function TA_Dashboard({ onNav }: { onNav: (p: Page) => void }) {
  const [selectedClass, setSelectedClass] = useState(taPermissions["TA2024001"].allowedClasses[0]);
  const [warningFilter, setWarningFilter] = useState<string | null>(null);

  const taUid = "TA2024001";
  const permissions = taPermissions[taUid];
  const allowedClasses = teacherClasses.filter(c => permissions.allowedClasses.includes(c.id));
  
  const classInfo = teacherClasses.find(c => c.id === selectedClass);
  const warningCount = warningStudents.filter(w => warningFilter ? w.type === warningFilter : true).length;
  const filteredWarnings = warningStudents.filter(w => warningFilter ? w.type === warningFilter : true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">班级选择</span>
          <div className="relative">
            <select value={selectedClass} onChange={e => setSelectedClass(parseInt(e.target.value))}
              className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
              {allowedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} · {c.course}</option>
              ))}
              <option value={-1}>多班合并视图</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        {classInfo && (
          <span className="text-sm text-muted-foreground">{classInfo.semester} · {classInfo.courseName}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "班级人数", value: classInfo?.studentCount || "98", icon: Users, color: "blue" },
          { label: "平均成绩", value: "76.5", icon: TrendingUp, color: "green" },
          { label: "出勤率", value: "93.8%", icon: Activity, color: "blue" },
          { label: "作业提交率", value: "90%", icon: CheckCircle, color: "green" },
          { label: "预警人数", value: warningCount.toString(), icon: AlertCircle, color: "red", highlight: warningCount > 0 },
        ].map(item => (
          <div key={item.label} className={`bg-card rounded-lg border border-border p-4 ${item.highlight ? "border-red-200 bg-red-50/50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color === "red" ? "bg-red-100" : item.color === "green" ? "bg-green-100" : "bg-blue-100"}`}>
                <item.icon size={16} className={item.color === "red" ? "text-red-600" : item.color === "green" ? "text-green-600" : "text-blue-600"} />
              </div>
              {item.highlight && <span className="text-xs text-red-600 font-medium">点击查看</span>}
            </div>
            <p className={`font-mono text-xl font-bold ${item.highlight ? "text-red-600" : "text-primary"}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">班级成绩分布图</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${v}人`} />
              <Bar dataKey="count" fill="#1A56DB" radius={[2, 2, 0, 0]} name="人数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">成绩趋势图</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${v}分`} />
              <Line type="monotone" dataKey="score" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="班级平均分" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">考勤统计</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={attendanceStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count">
                {attendanceStats.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}人`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">作业提交统计</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={homeworkSubmitStats} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="homework" tick={{ fontSize: 11 }} />
              <YAxis tick={{ formatter: (v: any) => `${v}%` }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" stackId="a" fill="#10B981" name="按时" />
              <Bar dataKey="late" stackId="a" fill="#F59E0B" name="迟交" />
              <Bar dataKey="notSubmit" stackId="a" fill="#EF4444" name="未交" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-sm">预警学生列表</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setWarningFilter(null)} className={`text-xs px-2 py-1 rounded ${!warningFilter ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>全部</button>
            <button onClick={() => setWarningFilter("成绩下滑")} className={`text-xs px-2 py-1 rounded ${warningFilter === "成绩下滑" ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>成绩下滑</button>
            <button onClick={() => setWarningFilter("缺勤过多")} className={`text-xs px-2 py-1 rounded ${warningFilter === "缺勤过多" ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>缺勤过多</button>
            <button onClick={() => setWarningFilter("作业连续未交")} className={`text-xs px-2 py-1 rounded ${warningFilter === "作业连续未交" ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>作业未交</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["学号", "姓名", "预警类型", "预警时间", "严重程度", "操作"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredWarnings.map(w => (
              <tr key={w.uid} className="border-b border-border last:border-0 hover:bg-accent/30">
                <td className="px-4 py-2.5 font-mono text-xs">{w.uid}</td>
                <td className="px-4 py-2.5 text-primary cursor-pointer hover:underline" onClick={() => onNav("ta-profile")}>{w.name}</td>
                <td className="px-4 py-2.5"><Tag color={w.type === "成绩下滑" ? "red" : w.type === "缺勤过多" ? "orange" : "yellow"}>{w.type}</Tag></td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{w.time}</td>
                <td className="px-4 py-2.5"><Tag color={w.severity === "高" ? "red" : w.severity === "中" ? "orange" : "yellow"}>{w.severity}</Tag></td>
                <td className="px-4 py-2.5">
                  <button onClick={() => onNav("ta-profile")} className="text-primary hover:underline text-xs">查看详情</button>
                </td>
              </tr>
            ))}
            {filteredWarnings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">暂无预警学生</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Teacher: Class Management (班级管理) ──────────────────────────────────────
function TeacherClassManagement({ onNav, setSelectedStudentId, setSelectedCourseId }: { onNav: (p: Page) => void; setSelectedStudentId: (id: number | null) => void; setSelectedCourseId: (id: number | null) => void }) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showTAConfigModal, setShowTAConfigModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newClass, setNewClass] = useState({ name: "", course: "", semester: "" });
  const [newStudent, setNewStudent] = useState({ studentNo: "", name: "", password: "" });
  const [selectedTA, setSelectedTA] = useState<string>("");
  const [taPerms, setTaPerms] = useState({ canImport: false, canGrade: false, canViewProfile: false });
  const [classList, setClassList] = useState<ClsVO[]>([]);
  const [studentList, setStudentList] = useState<StudentVO[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    setLoadingClasses(true);
    setLoadError(null);
    getMyClasses().then(data => {
      setClassList(data || []);
    }).catch((err) => {
      setClassList([]);
      setLoadError(err.message || "加载失败");
    }).finally(() => setLoadingClasses(false));
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    getClassStudents(selectedClassId).then(data => {
      setStudentList(data || []);
    }).catch(() => {
      setStudentList([]);
    }).finally(() => setLoadingStudents(false));
  }, [selectedClassId]);

  const students = studentList;
  const filteredStudents = studentList.filter(s => s.studentNo?.includes(searchQuery) || s.name?.includes(searchQuery));

  const classTAs = teachingAssistants.filter(ta => {
    const perms = taPermissions[ta.staffId];
    return perms && perms.allowedClasses.includes(selectedClassId || 0);
  });

  const handleAddClass = async () => {
    if (!newClass.name) return;
    try {
      const created = await createClass({ name: newClass.name, courseName: newClass.course, semester: newClass.semester });
      setClassList([...classList, created]);
      setShowAddClassModal(false);
      setNewClass({ name: "", course: "", semester: "" });
    } catch (err: any) {
      alert(err.message || "创建失败");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.studentNo || !newStudent.name || !selectedClassId) return;
    try {
      const created = await addStudentToClass(selectedClassId, { studentNo: newStudent.studentNo, name: newStudent.name, password: newStudent.password });
      setStudentList([...studentList, created]);
      setShowAddStudentModal(false);
      setNewStudent({ studentNo: "", name: "", password: "" });
    } catch (err: any) {
      alert(err.message || "添加失败");
    }
  };

  const handleTAConfig = () => {
    if (selectedTA && selectedClassId) {
      const perms = taPermissions[selectedTA];
      if (perms && !perms.allowedClasses.includes(selectedClassId)) {
        perms.allowedClasses.push(selectedClassId);
      }
      perms.canImport = taPerms.canImport;
      perms.canGrade = taPerms.canGrade;
      perms.canViewProfile = taPerms.canViewProfile;
    }
    setShowTAConfigModal(false);
    setSelectedTA("");
    setTaPerms({ canImport: false, canGrade: false, canViewProfile: false });
  };

  const removeTAFromClass = (taId: string) => {
    const perms = taPermissions[taId];
    if (perms && selectedClassId) {
      perms.allowedClasses = perms.allowedClasses.filter(c => c !== selectedClassId);
    }
  };

  return (
    <div className="space-y-5">
      {!selectedClassId ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">班级管理</h2>
            <button onClick={() => setShowAddClassModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
              <Plus size={14} />新增班级
            </button>
          </div>
          {loadingClasses ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : loadError ? (
            <div className="bg-card rounded-lg border border-red-200 p-12 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
              <p className="text-sm text-red-600 font-medium">加载失败</p>
              <p className="text-xs text-muted-foreground mt-1">{loadError}</p>
            </div>
          ) : classList.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Users size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">暂无班级，点击右上角新增班级</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classList.map(c => (
                <div key={c.id} onClick={() => setSelectedClassId(c.id)} className="bg-card rounded-lg border border-border p-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{c.className}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.courseName}</p>
                    </div>
                    <Users size={18} className="text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted rounded p-2">
                      <p className="text-xs text-muted-foreground">学生人数</p>
                      <p className="font-mono font-semibold">{c.studentCount ?? 0}</p>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <p className="text-xs text-muted-foreground">学期</p>
                      <p className="text-xs">{c.semester || "—"}</p>
                    </div>
                  </div>
                  <button className="mt-3 w-full py-2 text-sm border border-primary text-primary rounded-md hover:bg-accent transition-colors">
                    查看学生名单
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedClassId(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight size={14} />返回班级列表
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input type="text" placeholder="搜索学号或姓名..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm w-64" />
              </div>
              <button onClick={() => setShowAddStudentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
                <Plus size={14} />添加学生
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
                <Upload size={14} />导入名单
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-medium text-sm">{classList.find(c => c.id === selectedClassId)?.className} · {classList.find(c => c.id === selectedClassId)?.courseName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">共 {students.length} 名学生</p>
            </div>
            {loadingStudents ? (
              <div className="py-16 text-center">
                <div className="w-7 h-7 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["学号", "姓名", "性别", "已导入数据", "操作"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.studentNo} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-mono text-xs">{s.studentNo}</td>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3"><Tag color="gray">{s.gender || "—"}</Tag></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{s.college || "—"} · {s.major || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedStudentId(s.studentId); setSelectedCourseId(selectedClassId); onNav("teacher-profile"); }} className="text-primary hover:underline text-xs mr-3">学生画像</button>
                        <button className="text-red-500 hover:underline text-xs">移除</button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">暂无学生</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">新增班级</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">班级名称</label>
                <input type="text" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：2024级3班" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">课程名称</label>
                <input type="text" value={newClass.course} onChange={e => setNewClass({ ...newClass, course: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：高等数学A" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">学期</label>
                <input type="text" value={newClass.semester} onChange={e => setNewClass({ ...newClass, semester: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="如：2024-2025第二学期" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddClassModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleAddClass} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">创建班级</button>
            </div>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">添加学生</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">学号</label>
                <input type="text" value={newStudent.uid} onChange={e => setNewStudent({ ...newStudent, uid: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="请输入学号" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">姓名</label>
                <input type="text" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm" placeholder="请输入姓名" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddStudentModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleAddStudent} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">添加学生</button>
            </div>
          </div>
        </div>
      )}

      {showTAConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold">分配助教权限</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">选择助教</label>
                <select value={selectedTA} onChange={e => setSelectedTA(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-border rounded-md text-sm">
                  <option value="">请选择助教</option>
                  {teachingAssistants.map(ta => (
                    <option key={ta.staffId} value={ta.staffId}>{ta.name} · {ta.staffId}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">权限设置</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taPerms.canImport} onChange={e => setTaPerms({ ...taPerms, canImport: e.target.checked })} className="rounded" />
                    <span className="text-sm">允许导入数据</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taPerms.canGrade} onChange={e => setTaPerms({ ...taPerms, canGrade: e.target.checked })} className="rounded" />
                    <span className="text-sm">允许考试批阅</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={taPerms.canViewProfile} onChange={e => setTaPerms({ ...taPerms, canViewProfile: e.target.checked })} className="rounded" />
                    <span className="text-sm">允许查看学生画像</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowTAConfigModal(false); setSelectedTA(""); setTaPerms({ canImport: false, canGrade: false, canViewProfile: false }); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleTAConfig} disabled={!selectedTA} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">保存设置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: Data Import (数据导入) ───────────────────────────────────────────
function TeacherDataImport() {
  const [activeTab, setActiveTab] = useState("homework");
  const [toast, setToast] = useState<{ msg: string; variant: "success" | "warn" | "error" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [importResult, setImportResult] = useState({
    fileName: "", totalRows: 0, successRows: 0, failRows: 0, skippedRows: 0,
    errors: [] as string[], warnings: [] as string[],
  });
  // 课程选择器 + 考核信息
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [assessmentName, setAssessmentName] = useState("");
  const [examType, setExamType] = useState<"MIDTERM" | "FINAL">("MIDTERM");

  const showToastMsg = (msg: string, variant: "success" | "warn" | "error" = "success") => {
    setToast({ msg, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { key: "homework", label: "作业成绩" },
    { key: "attendance", label: "考勤记录" },
    { key: "experiment", label: "实验报告" },
    { key: "quiz", label: "测验成绩" },
    { key: "exam", label: "期中/期末成绩" },
    { key: "student", label: "学生名单(选课导入)" },
  ];

  // 与后端导入模板/解析逻辑一致的列说明（详见 docs/import-templates.md）
  const templates: Record<string, string[]> = {
    homework: ["序号", "学号", "姓名", "第1~N题得分", "扣分主要知识点(每题一列)", "总成绩", "最薄弱知识点"],
    attendance: ["学号", "姓名", "日期(yyyy-MM-dd)", "状态", "节次", "第几周", "备注"],
    experiment: ["学号", "姓名", "实验名称", "实验次数", "分数", "提交时间(yyyy-MM-dd HH:mm:ss)", "备注"],
    quiz: ["序号", "学号", "姓名", "第1~N题得分", "扣分主要知识点(每题一列)", "总成绩", "最薄弱知识点"],
    exam: ["序号", "学号", "姓名", "第1~N题得分", "扣分主要知识点(每题一列)", "总成绩", "最薄弱知识点"],
    student: ["学号", "姓名", "性别", "学院", "专业", "班级", "年级", "邮箱"],
  };

  const importTypeMap: Record<string, string> = {
    homework: "HOMEWORK", attendance: "ATTENDANCE", experiment: "EXPERIMENT",
    quiz: "QUIZ", exam: "EXAM_SCORE", student: "CLASS_STUDENT",
  };

  /** 当前 tab 是否为成绩类导入（需要填写考核名称） */
  const needsAssessment = ["homework", "quiz", "exam"].includes(activeTab);

  // 加载导入历史 + 教师课程列表
  useEffect(() => {
    setLoadingHistory(true);
    getImportHistory(1, 20).then(data => {
      setImportHistory(data.records || []);
    }).catch(() => {}).finally(() => setLoadingHistory(false));
    getMyCourses().then(list => {
      setCourses(list || []);
      if (list && list.length === 1) setSelectedCourseId(String(list[0].id));
    }).catch(() => {});
  }, []);

  // 触发文件选择
  const handleClickUpload = () => {
    if (!selectedCourseId) {
      showToastMsg("请先选择归属课程", "warn");
      return;
    }
    if (needsAssessment && !assessmentName.trim()) {
      showToastMsg("请先填写考核名称（如：第1次作业）", "warn");
      return;
    }
    fileInputRef.current?.click();
  };

  // 处理文件选择并上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file, importTypeMap[activeTab] || activeTab, {
        courseId: Number(selectedCourseId),
        assessmentName: needsAssessment ? assessmentName.trim() : undefined,
        assessmentType: activeTab === "exam" ? examType : undefined,
      });
      setImportResult({
        fileName: file.name,
        totalRows: result.totalRows || (result.successRows + result.failRows + (result.skippedRows || 0)),
        successRows: result.successRows,
        failRows: result.failRows,
        skippedRows: result.skippedRows || 0,
        errors: result.errors || [],
        warnings: result.warnings || [],
      });
      setShowResultModal(true);
      // 刷新历史
      getImportHistory(1, 20).then(data => setImportHistory(data.records || [])).catch(() => {});
    } catch (err: any) {
      showToastMsg(err?.message || "上传失败，请检查文件格式", "error");
    } finally {
      setUploading(false);
      // 重置 input 以允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadErrorLog = () => {
    const logContent = importResult.errors.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `导入错误日志_${importResult.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg("错误日志已下载");
  };

  // 关闭结果弹窗时按真实结果提示
  const handleCloseResult = () => {
    setShowResultModal(false);
    if (importResult.failRows === 0 && importResult.successRows > 0) {
      showToastMsg(`成功导入 ${importResult.successRows} 条数据${importResult.skippedRows > 0 ? `，跳过 ${importResult.skippedRows} 条` : ""}`, "success");
    } else if (importResult.successRows > 0) {
      showToastMsg(`成功 ${importResult.successRows} 条，失败 ${importResult.failRows} 条，跳过 ${importResult.skippedRows} 条`, "warn");
    } else {
      showToastMsg("导入失败，未写入任何数据，请查看错误详情", "error");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await fetchTemplateBlob(importTypeMap[activeTab] || activeTab);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tabs.find(t => t.key === activeTab)?.label}_模板.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToastMsg("模板下载失败", "error");
    }
  };

  const toastStyle = toast?.variant === "error" ? "bg-red-600" : toast?.variant === "warn" ? "bg-amber-500" : "bg-emerald-600";

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 ${toastStyle} text-white text-sm rounded-lg shadow-lg`}>
          <div className="flex items-center gap-2">
            {toast.variant === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* 课程选择 + 考核信息 */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">归属课程 <span className="text-red-500">*</span></label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
              className="min-w-[260px] px-3 py-2 text-sm border border-border rounded-md bg-background">
              <option value="">请选择课程</option>
              {courses.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.courseName || c.className}{c.courseNo ? ` (${c.courseNo}` : ""}{c.semester ? ` · ${c.semester})` : c.courseNo ? ")" : ""}
                </option>
              ))}
            </select>
          </div>
          {needsAssessment && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">考核名称 <span className="text-red-500">*</span></label>
              <input type="text" value={assessmentName} onChange={e => setAssessmentName(e.target.value)}
                placeholder={activeTab === "exam" ? "如：期中考试" : activeTab === "quiz" ? "如：第1次测验" : "如：第1次作业"}
                className="min-w-[200px] px-3 py-2 text-sm border border-border rounded-md bg-background" />
            </div>
          )}
          {activeTab === "exam" && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">考试类型 <span className="text-red-500">*</span></label>
              <div className="flex gap-3 py-2">
                {([["MIDTERM", "期中"], ["FINAL", "期末"]] as const).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="examType" checked={examType === val} onChange={() => setExamType(val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {activeTab === "student" && (
            <p className="text-xs text-muted-foreground pb-2">
              名单中不存在的学生将自动创建账号（初始密码为系统默认），并加入所选课程的选课名单
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border px-4">
        <div className="flex gap-0 border-b border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" data-testid="import-file-input" />
          <div onClick={handleClickUpload}
            className={`border-2 border-dashed border-border rounded-lg p-10 text-center transition-colors
              ${uploading ? "opacity-50 cursor-not-allowed" : !selectedCourseId ? "opacity-60 cursor-pointer" : "hover:border-primary cursor-pointer"}`}>
            {uploading ? (
              <>
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
                <p className="font-medium text-sm">正在上传并导入...</p>
              </>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium text-sm">{selectedCourseId ? "拖拽文件到此处，或点击上传" : "请先在上方选择归属课程"}</p>
                <p className="text-xs text-muted-foreground mt-1">支持 .xlsx, .xls, .csv 格式</p>
              </>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              模板字段：{templates[activeTab].join("、")}
            </div>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent">
              <Download size={14} />下载模板
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-medium text-sm mb-4">上传说明</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>1. 先在上方选择归属课程{needsAssessment ? "并填写考核名称" : ""}，再上传文件</p>
            <p>2. 下载模板文件，按照模板格式填写数据（首行为表头，列名需与模板一致）</p>
            <p>3. 成绩/考勤/实验导入要求学生已在系统中，请先通过"学生名单"导入学生</p>
            <p>4. 上传即导入：成功行立即写入数据库，失败行会在结果中列出原因</p>
            <p>5. 重复数据（如已导入过的学号/成绩记录）会自动跳过并提示</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-sm">上传历史</h3>
        </div>
        {loadingHistory ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">加载中...</div>
        ) : importHistory.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">暂无导入记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["文件名", "数据类型", "上传时间", "成功条数", "失败条数", "状态"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importHistory.map(h => (
                <tr key={h.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-xs">{h.fileName || '-'}</td>
                  <td className="px-4 py-3"><Tag color="blue">{h.importType || '-'}</Tag></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{h.createTime || '-'}</td>
                  <td className="px-4 py-3 font-mono text-emerald-600">{h.successRows ?? 0}</td>
                  <td className="px-4 py-3 font-mono text-red-600">{h.failRows ?? 0}</td>
                  <td className="px-4 py-3">
                    {h.status === "SUCCESS" ? <Tag color="green">成功</Tag>
                      : h.status === "PARTIAL" ? <Tag color="orange">部分失败</Tag>
                      : <Tag color="red">失败</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">导入结果</h3>
              <button onClick={handleCloseResult}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">文件</p>
                <p className="text-sm font-medium truncate">{importResult.fileName}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">总行数</p>
                <p className="text-sm font-bold text-primary">{importResult.totalRows}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-600">成功</p>
                <p className="text-sm font-bold text-emerald-600">{importResult.successRows}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-red-600">失败</p>
                <p className="text-sm font-bold text-red-600">{importResult.failRows}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-600">跳过</p>
                <p className="text-sm font-bold text-amber-600">{importResult.skippedRows}</p>
              </div>
            </div>
            {(importResult.errors.length > 0 || importResult.warnings.length > 0) && (
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">错误详情</h4>
                    <div className="space-y-2">
                      {importResult.errors.map((msg, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <span className="text-xs text-red-600">{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {importResult.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">跳过明细</h4>
                    <div className="space-y-2">
                      {importResult.warnings.map((msg, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-xs text-amber-700">{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button onClick={handleDownloadErrorLog} disabled={importResult.errors.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                <Download size={14} />下载错误日志
              </button>
              <button onClick={handleCloseResult} className="px-4 py-2 text-sm bg-primary text-white rounded-md">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teaching Assistant: Data Import (数据导入) ────────────────────────────────
function TA_DataImport() {
  const [activeTab, setActiveTab] = useState("homework");
  const tabs = [
    { key: "homework", label: "作业成绩" },
    { key: "attendance", label: "考勤记录" },
    { key: "experiment", label: "实验报告" },
    { key: "quiz", label: "测验成绩" },
    { key: "exam", label: "期中/期末成绩" },
  ];

  const templates: Record<string, string[]> = {
    homework: ["学号", "姓名", "作业次数", "分数", "是否迟交"],
    attendance: ["学号", "姓名", "日期", "状态"],
    experiment: ["学号", "姓名", "实验名称", "分数", "提交时间"],
    quiz: ["学号", "姓名", "测验名称", "分数", "各题得分(可选)"],
    exam: ["学号", "姓名", "考试名称", "总分"],
  };

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-lg border border-border px-4">
        <div className="flex gap-0 border-b border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary transition-colors cursor-pointer">
          <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-sm">拖拽文件到此处，或点击上传</p>
          <p className="text-xs text-muted-foreground mt-1">支持 .xlsx, .xls 格式</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            模板字段：{templates[activeTab].join("、")}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-accent">
            <Download size={14} />下载模板
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-sm">上传历史</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["文件名", "数据类型", "上传时间", "成功条数", "失败条数", "状态"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {importHistory.map(h => (
              <tr key={h.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                <td className="px-4 py-3 font-medium">{h.fileName}</td>
                <td className="px-4 py-3"><Tag color="blue">{h.dataType}</Tag></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{h.uploadTime}</td>
                <td className="px-4 py-3 font-mono text-emerald-600">{h.success}</td>
                <td className="px-4 py-3 font-mono text-red-600">{h.fail}</td>
                <td className="px-4 py-3">
                  {h.status === "success" ? <Tag color="green">成功</Tag> : h.status === "partial" ? <Tag color="orange">部分失败</Tag> : <Tag color="red">失败</Tag>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Teacher: Student Profile (学生画像) ──────────────────────────────────────
function TeacherStudentProfile({ onNav, initialStudentId, initialCourseId }: { onNav: (p: Page) => void; initialStudentId?: number | null; initialCourseId?: number | null }) {
  const [activeTab, setActiveTab] = useState("score");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(initialStudentId || null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(initialCourseId || null);
  const [isFocused, setIsFocused] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSuggestionEdit, setShowSuggestionEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  // API data
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [courses, setCourses] = useState<ClsVO[]>([]);
  const [students, setStudents] = useState<StudentVO[]>([]);

  useEffect(() => {
    getMyClasses().then(data => {
      setCourses(data || []);
      if (data && data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id!);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    getClassStudents(selectedCourseId).then(data => {
      setStudents(data || []);
      if (data && data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].studentId);
      }
    }).catch(() => {});
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedStudentId || !selectedCourseId) return;
    setLoading(true);
    getStudentProfile(selectedStudentId, selectedCourseId).then(data => {
      setProfile(data);
      setIsFocused(data.isFocus || false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedStudentId, selectedCourseId]);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const handleFocusToggle = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    try {
      await toggleFocusStudent(selectedStudentId, selectedCourseId, !isFocused);
      setIsFocused(!isFocused);
      showToastMsg(!isFocused ? "已标记为重点关注" : "已取消重点关注");
    } catch { showToastMsg("操作失败"); }
  };

  const handleGenerateAi = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    setGeneratingAi(true);
    try {
      const text = await generateAiEvaluation(selectedStudentId, selectedCourseId);
      setProfile(prev => prev ? { ...prev, aiEvaluation: text } : null);
      showToastMsg("AI评价已生成");
    } catch { showToastMsg("AI评价生成失败"); }
    finally { setGeneratingAi(false); }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    setGeneratingSuggestions(true);
    try {
      const text = await generateAiSuggestions(selectedStudentId, selectedCourseId);
      setProfile(prev => prev ? { ...prev, aiSuggestions: text } : null);
      showToastMsg("AI学习建议已生成");
    } catch { showToastMsg("AI学习建议生成失败"); }
    finally { setGeneratingSuggestions(false); }
  };

  const learningSuggestions: LearningSuggestion[] = profile?.aiSuggestions
    ? (() => {
        try {
          const parsed = JSON.parse(profile.aiSuggestions);
          return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
      })()
    : [];

  const [editingSuggestions, setEditingSuggestions] = useState<LearningSuggestion[]>([]);
  const [savingSuggestions, setSavingSuggestions] = useState(false);

  const tabs = [
    { key: "score", label: "成绩概览" },
    { key: "attendance", label: "考勤记录" },
    { key: "homework", label: "作业情况" },
    { key: "experiment", label: "实验报告" },
    { key: "knowledge", label: "知识掌握度" },
    { key: "ai", label: "AI综合评价" },
  ];

  // Build display data from API profile
  const profileData = profile ? {
    name: profile.name,
    uid: profile.studentNo,
    className: profile.className || "",
    stats: {
      totalScore: profile.totalScore ? Math.round(profile.totalScore) : 0,
      maxScore: profile.scoreTrendList?.[0]?.overallScores?.length
        ? Math.max(...profile.scoreTrendList[0].overallScores.map(Number))
        : 0,
      minScore: profile.scoreTrendList?.[0]?.overallScores?.length
        ? Math.min(...profile.scoreTrendList[0].overallScores.map(Number))
        : 0,
      avgScore: profile.totalScore ? Math.round(profile.totalScore) : 0,
      rank: profile.classRank || 0,
      classTotal: profile.classTotal || 0,
    },
    scoreTrend: profile.scoreTrendList?.[0]
      ? profile.scoreTrendList[0].semesters.map((sem, i) => ({
          exam: sem,
          score: Number(profile.scoreTrendList![0].overallScores[i] || 0),
          classAvg: 75,
        }))
      : [],
    attendanceRecords: profile.attendanceList?.map(a => ({
      date: a.date?.split("T")[0] || "",
      status: normalizeAttendanceStatus(a.status || ""),
    })) || [],
    homeworkRecords: profile.homeworkList?.map(h => ({
      name: h.name || "",
      score: h.score ? Number(h.score) : 0,
      status: h.submitStatus || "未提交",
    })) || [],
    experimentRecords: profile.experimentList?.map(e => ({
      name: e.name || "",
      score: e.score ? Number(e.score) : null,
      submitTime: e.submitTime || "",
    })) || [],
    knowledgeData: profile.knowledgeRadar?.map(k => ({
      subject: k.name,
      value: Number(k.value) || 0,
    })) || [],
    aiEvaluation: profile.aiEvaluation || "",
  } : null;

  const attendanceStats = profileData?.attendanceRecords.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleExportReport = () => {
    showToastMsg("学生报告已导出为PDF");
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">学生画像</h2>
          <select value={selectedCourseId || ""} onChange={e => { setSelectedCourseId(Number(e.target.value)); setSelectedStudentId(null); }}
            className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseName || c.name}</option>
            ))}
          </select>
          <select value={selectedStudentId || ""} onChange={e => setSelectedStudentId(Number(e.target.value))}
            className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
            {students.map(s => (
              <option key={s.studentId} value={s.studentId}>{s.name} · {s.studentNo}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPrivacyMode(!privacyMode)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            privacyMode ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-muted hover:bg-accent border border-transparent"
          }`}>
            <Eye size={14} />
            {privacyMode ? "隐私模式：开启" : "隐私模式：关闭"}
          </button>
          <button onClick={handleFocusToggle} className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
            isFocused ? "bg-red-500 text-white" : "bg-muted hover:bg-accent"
          }`}>
            <Star size={14} />
            {isFocused ? "已重点关注" : "重点关注"}
          </button>
          <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
            <Download size={14} />导出报告
          </button>
        </div>
      </div>

      {privacyMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
          <Eye size={14} className="text-purple-600" />
          <span className="text-xs text-purple-700">隐私保护模式已开启，班级排名和对比数据已隐藏</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 bg-card rounded-lg border border-border p-6">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
          ) : !profileData ? (
            <div className="text-center py-8 text-sm text-muted-foreground">暂无数据</div>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User size={32} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold mt-3">{profileData.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">学号：{profileData.uid}</p>
                <p className="text-xs text-muted-foreground">{profileData.className}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">出勤率</span><span className="font-medium">{profile.attendanceRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">缺勤</span><span className="font-medium text-red-500">{profile.absentCount}次</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">迟到</span><span className="font-medium text-yellow-500">{profile.lateCount}次</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">请假</span><span className="font-medium text-blue-500">{profile.leaveCount}次</span></div>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border border-border px-4">
            <div className="flex gap-0 border-b border-border">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                    ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!profileData ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center text-sm text-muted-foreground">请选择课程和学生查看画像</div>
          ) : <>
          {activeTab === "score" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "总分", value: profileData.stats.totalScore, subtext: privacyMode ? "隐私保护" : `班级排名 ${profileData.stats.rank}/${profileData.stats.classTotal}` },
                  { label: "最高分", value: profileData.stats.maxScore, subtext: "历次考试" },
                  { label: "最低分", value: profileData.stats.minScore, subtext: "历次考试" },
                  { label: "平均分", value: profileData.stats.avgScore, subtext: profile.scoreTrendList?.[0]?.overallScores?.length ? `${profile.scoreTrendList[0].overallScores.length}次考试` : "暂无数据" },
                ].map(item => (
                  <div key={item.label} className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="font-mono text-xl font-bold text-primary">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    <p className={`text-xs mt-1 ${privacyMode && item.label === "总分" ? "text-purple-600" : "text-muted-foreground"}`}>{item.subtext}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">成绩趋势</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={profileData.scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}分`} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="个人成绩" />
                    {!privacyMode && <Line type="monotone" dataKey="classAvg" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">出勤统计</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={[
                        { name: "出勤", value: (attendanceStats["出勤"] || 0) + (attendanceStats["PRESENT"] || 0) },
                        { name: "迟到", value: (attendanceStats["迟到"] || 0) + (attendanceStats["LATE"] || 0) },
                        { name: "请假", value: (attendanceStats["请假"] || 0) + (attendanceStats["LEAVE"] || 0) },
                        { name: "缺勤", value: (attendanceStats["缺勤"] || 0) + (attendanceStats["ABSENT"] || 0) },
                      ]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {[{ fill: "#10B981" }, { fill: "#F59E0B" }, { fill: "#3B82F6" }, { fill: "#EF4444" }].map((c, i) => <Cell key={`cell-${i}`} {...c} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">出勤明细</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {profileData.attendanceRecords.map(r => (
                      <div key={r.date} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-xs font-mono">{r.date}</span>
                        <Tag color={getAttendanceTagColor(r.status)}>{r.status}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "homework" && (
            <div className="bg-card rounded-lg border border-border p-5">
              <h4 className="font-medium text-sm mb-4">作业提交情况</h4>
              <div className="space-y-4">
                {profileData.homeworkRecords.map(h => (
                  <div key={h.name} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium">{h.name}</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className={`h-3 rounded-full ${h.status === "按时" ? "bg-green-500" : h.status === "迟交" ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: h.score ? `${h.score}%` : "0%" }} />
                    </div>
                    <div className="w-16 text-right">
                      <span className="font-mono text-sm">{h.score ?? "—"}</span>
                    </div>
                    <Tag color={h.status === "按时" ? "green" : h.status === "迟交" ? "orange" : "red"}>{h.status}</Tag>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "experiment" && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["实验名称", "分数", "提交时间"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileData.experimentRecords.map(e => (
                    <tr key={e.name} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-medium">{e.name}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{e.score ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.submitTime || "未提交"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">知识掌握度雷达图</h4>
                  {!privacyMode && <span className="text-xs text-muted-foreground">已显示班级均值对比</span>}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={profileData.knowledgeData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#1A56DB" fill="#1A56DB" fillOpacity={0.3} name="个人掌握度" strokeWidth={2} />
                    {!privacyMode && (
                      <Radar dataKey="value" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" name="班级均值" />
                    )}
                    <Tooltip formatter={(v: any) => [`${v}%`, "掌握度"]} contentStyle={{ fontSize: "12px", padding: "8px 12px" }} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">知识点详情分析</h4>
                <div className="space-y-3">
                  {profileData.knowledgeData.map((k, i) => {
                    const isWeak = k.value < 70;
                    const isStrong = k.value >= 85;
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-28 text-sm font-medium">{k.subject}</div>
                        <div className="flex-1 bg-muted rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all ${isWeak ? "bg-red-500" : isStrong ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${k.value}%` }} />
                        </div>
                        <div className="w-16 text-right font-mono font-semibold">
                          <span className={isWeak ? "text-red-500" : isStrong ? "text-green-500" : "text-primary"}>{k.value}%</span>
                        </div>
                        <Tag color={isWeak ? "red" : isStrong ? "green" : "blue"}>
                          {isWeak ? "需加强" : isStrong ? "优秀" : "良好"}
                        </Tag>
                      </div>
                    );
                  })}
                </div>

                {profileData.knowledgeData.filter(k => k.value < 70).length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-red-600" />
                      <span className="text-xs font-medium text-red-700">薄弱知识点提醒</span>
                    </div>
                    <p className="text-xs text-red-600">
                      以下知识点掌握度低于70%：{profileData.knowledgeData.filter(k => k.value < 70).map(k => k.subject).join("、")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "综合评分", value: Math.round((Number(profileData.stats.avgScore) || 0) * 1.1), color: "bg-blue-50 text-blue-700", icon: <Award size={16} /> },
                  { label: "学习态度", value: profileData.homeworkRecords.length > 0 ? Math.round((profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100) : 0, color: "bg-green-50 text-green-700", icon: <Target size={16} /> },
                  { label: "知识掌握", value: profileData.knowledgeData.length > 0 ? Math.round(profileData.knowledgeData.reduce((sum, k) => sum + k.value, 0) / profileData.knowledgeData.length) : 0, color: "bg-purple-50 text-purple-700", icon: <BookOpen size={16} /> },
                  { label: "进步空间", value: 100 - Math.round(Number(profileData.stats.avgScore) || 0), color: "bg-orange-50 text-orange-700", icon: <TrendingUp size={16} /> },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs font-medium">{stat.label}</span></div>
                    <p className="text-xl font-bold">{stat.value}<span className="text-sm font-normal">分</span></p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-primary" />
                    <h4 className="font-medium text-sm">AI综合评价报告</h4>
                  </div>
                  <button
                    onClick={handleGenerateAi}
                    disabled={generatingAi}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generatingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : profileData.aiEvaluation ? (
                      <>
                        <RefreshCw size={14} />
                        更新评价
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        生成AI评价
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 min-h-[120px]">
                  {generatingAi ? (
                    <div className="flex flex-col items-center justify-center py-6 text-blue-600">
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                      <p className="text-sm">AI正在分析学生数据，生成评价中...</p>
                    </div>
                  ) : profileData.aiEvaluation ? (
                    <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{profileData.aiEvaluation}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-blue-400">
                      <Brain size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">点击上方按钮生成AI综合评价</p>
                    </div>
                  )}
                </div>
                {profileData.aiEvaluation && !generatingAi && (
                  <div className="mt-3 flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      上次生成时间：{new Date().toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={handleExportReport} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">导出评价</button>
                  <button className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">发送通知</button>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">AI学习建议</h4>
                  <button onClick={() => {
                    setEditingSuggestions([...learningSuggestions]);
                    setShowSuggestionEdit(true);
                  }} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Edit2 size={12} />编辑建议
                  </button>
                </div>
                <div className="space-y-3">
                  {learningSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        s.type === "strong" ? "bg-green-100 text-green-700" : 
                        s.type === "weak" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {s.type === "strong" ? "优" : s.type === "weak" ? "弱" : "改"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.content}</p>
                      </div>
                      {s.type === "weak" && (
                        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20">
                          <Play size={12} />针对性练习
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={handleGenerateSuggestions}
                    disabled={generatingSuggestions}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {generatingSuggestions ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Brain size={14} />
                        {learningSuggestions.length > 0 ? "更新建议" : "生成学习建议"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h4 className="font-medium text-sm mb-4">学习行为分析</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">作业按时提交率</span>
                      <span className="font-medium">{Math.round((profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100)}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">出勤率</span>
                      <span className="font-medium">{Math.round((profileData.attendanceRecords.filter(a => normalizeAttendanceStatus(a.status) === "出勤").length / profileData.attendanceRecords.length) * 100)}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(profileData.attendanceRecords.filter(a => normalizeAttendanceStatus(a.status) === "出勤").length / profileData.attendanceRecords.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">实验完成率</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">成绩稳定性</span>
                      <span className="font-medium">稳定</span>
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>}
        </div>
      </div>

      {showSuggestionEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">编辑学习建议</h3>
              <button onClick={() => setShowSuggestionEdit(false)}><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {editingSuggestions.map((s, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <select value={s.type} onChange={(e) => {
                        const newSuggestions = [...editingSuggestions];
                        (newSuggestions[i] as any).type = e.target.value;
                        setEditingSuggestions(newSuggestions);
                      }} className="px-2 py-1 text-xs border border-border rounded-md">
                        <option value="strong">优点</option>
                        <option value="weak">薄弱</option>
                        <option value="improve">改进</option>
                      </select>
                      <button onClick={() => {
                        setEditingSuggestions(editingSuggestions.filter((_, idx) => idx !== i));
                      }} className="text-xs text-red-500 hover:text-red-700">删除</button>
                    </div>
                    <input type="text" value={s.title} onChange={(e) => {
                      const newSuggestions = [...editingSuggestions];
                      newSuggestions[i].title = e.target.value;
                      setEditingSuggestions(newSuggestions);
                    }} className="w-full px-3 py-2 border border-border rounded-md text-sm mb-2" />
                    <textarea value={s.content} onChange={(e) => {
                      const newSuggestions = [...editingSuggestions];
                      newSuggestions[i].content = e.target.value;
                      setEditingSuggestions(newSuggestions);
                    }} className="w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none" />
                  </div>
                ))}
                <button onClick={() => {
                  setEditingSuggestions([...editingSuggestions, {
                    type: "improve" as const,
                    title: "新建议",
                    content: "输入建议内容...",
                  }]);
                }} className="w-full py-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  + 添加新建议
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <button onClick={() => setShowSuggestionEdit(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button
                onClick={async () => {
                  if (!selectedStudentId || !selectedCourseId) return;
                  setSavingSuggestions(true);
                  try {
                    const jsonStr = JSON.stringify(editingSuggestions);
                    setProfile(prev => prev ? { ...prev, aiSuggestions: jsonStr } : null);
                    setShowSuggestionEdit(false);
                    showToastMsg("学习建议已更新");
                  } catch { showToastMsg("保存失败"); }
                  finally { setSavingSuggestions(false); }
                }}
                disabled={savingSuggestions}
                className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                {savingSuggestions ? "保存中..." : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teaching Assistant: Student Profile (学生画像) ──────────────────────────────
function TA_StudentProfile({ onNav }: { onNav: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState("score");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [courses, setCourses] = useState<ClsVO[]>([]);
  const [students, setStudents] = useState<StudentVO[]>([]);

  useEffect(() => {
    getMyClasses().then(data => {
      setCourses(data || []);
      if (data && data.length > 0 && !selectedCourseId) setSelectedCourseId(data[0].id!);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    getClassStudents(selectedCourseId).then(data => {
      setStudents(data || []);
      if (data && data.length > 0 && !selectedStudentId) setSelectedStudentId(data[0].studentId);
    }).catch(() => {});
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedStudentId || !selectedCourseId) return;
    setLoading(true);
    getStudentProfile(selectedStudentId, selectedCourseId).then(data => {
      setProfile(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedStudentId, selectedCourseId]);

  const tabs = [
    { key: "score", label: "成绩概览" },
    { key: "attendance", label: "考勤记录" },
    { key: "homework", label: "作业情况" },
    { key: "experiment", label: "实验报告" },
    { key: "knowledge", label: "知识掌握度" },
    { key: "ai", label: "AI综合评价" },
  ];

  const profileData = profile ? {
    name: profile.name, uid: profile.studentNo, className: profile.className || "",
    stats: {
      totalScore: profile.totalScore ? Math.round(profile.totalScore) : 0,
      maxScore: profile.scoreTrendList?.[0]?.overallScores?.length
        ? Math.max(...profile.scoreTrendList[0].overallScores.map(Number))
        : 0,
      minScore: profile.scoreTrendList?.[0]?.overallScores?.length
        ? Math.min(...profile.scoreTrendList[0].overallScores.map(Number))
        : 0,
      avgScore: profile.totalScore ? Math.round(profile.totalScore) : 0,
      rank: profile.classRank || 0,
      classTotal: profile.classTotal || 0,
    },
    scoreTrend: profile.scoreTrendList?.[0]?.semesters.map((sem, i) => ({
      exam: sem, score: Number(profile.scoreTrendList![0].overallScores[i] || 0), classAvg: 75,
    })) || [],
    attendanceRecords: profile.attendanceList?.map(a => ({ date: a.date?.split("T")[0] || "", status: a.status || "" })) || [],
    homeworkRecords: profile.homeworkList?.map(h => ({ name: h.name || "", score: h.score ? Number(h.score) : 0, status: h.submitStatus || "未提交" })) || [],
    experimentRecords: profile.experimentList?.map(e => ({ name: e.name || "", score: e.score ? Number(e.score) : null, submitTime: e.submitTime || "" })) || [],
    knowledgeData: profile.knowledgeRadar?.map(k => ({ subject: k.name, value: Number(k.value) || 0 })) || [],
    aiEvaluation: profile.aiEvaluation || "",
  } : null;

  const attendanceStats = profileData?.attendanceRecords.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {} as Record<string, number>) || {};

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const handleGenerateAi = async () => {
    if (!selectedStudentId || !selectedCourseId) return;
    setGeneratingAi(true);
    try {
      const text = await generateAiEvaluation(selectedStudentId, selectedCourseId);
      setProfile(prev => prev ? { ...prev, aiEvaluation: text } : null);
      showToastMsg("AI评价已生成");
    } catch { showToastMsg("AI评价生成失败"); }
    finally { setGeneratingAi(false); }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">学生画像</h2>
          <select value={selectedCourseId || ""} onChange={e => { setSelectedCourseId(Number(e.target.value)); setSelectedStudentId(null); }}
            className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
            {courses.map(c => (<option key={c.id} value={c.id}>{c.courseName || c.name}</option>))}
          </select>
          <select value={selectedStudentId || ""} onChange={e => setSelectedStudentId(Number(e.target.value))}
            className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
            {students.map(s => (<option key={s.id} value={s.id}>{s.name} · {s.studentNo}</option>))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground">只读模式</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 bg-card rounded-lg border border-border p-6">
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold mt-3">{profileData.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">学号：{profileData.uid}</p>
            <p className="text-xs text-muted-foreground">{profileData.className}</p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border border-border px-4">
            <div className="flex gap-0 border-b border-border">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                    ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "score" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "总分", value: profileData.stats.totalScore, subtext: `班级排名 ${profileData.stats.rank}/${profileData.stats.classTotal}` },
                  { label: "最高分", value: profileData.stats.maxScore, subtext: "历次考试" },
                  { label: "最低分", value: profileData.stats.minScore, subtext: "历次考试" },
                  { label: "平均分", value: profileData.stats.avgScore, subtext: profile.scoreTrendList?.[0]?.overallScores?.length ? `${profile.scoreTrendList[0].overallScores.length}次考试` : "暂无数据" },
                ].map(item => (
                  <div key={item.label} className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="font-mono text-xl font-bold text-primary">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.subtext}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">成绩趋势</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={profileData.scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}分`} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="个人成绩" />
                    <Line type="monotone" dataKey="classAvg" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">出勤统计</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={[
                        { name: "出勤", value: (attendanceStats["出勤"] || 0) + (attendanceStats["PRESENT"] || 0) },
                        { name: "迟到", value: (attendanceStats["迟到"] || 0) + (attendanceStats["LATE"] || 0) },
                        { name: "请假", value: (attendanceStats["请假"] || 0) + (attendanceStats["LEAVE"] || 0) },
                        { name: "缺勤", value: (attendanceStats["缺勤"] || 0) + (attendanceStats["ABSENT"] || 0) },
                      ]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {[{ fill: "#10B981" }, { fill: "#F59E0B" }, { fill: "#3B82F6" }, { fill: "#EF4444" }].map((c, i) => <Cell key={`cell-${i}`} {...c} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-lg border border-border p-5">
                  <h4 className="font-medium text-sm mb-4">出勤明细</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {profileData.attendanceRecords.map(r => (
                      <div key={r.date} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-xs font-mono">{r.date}</span>
                        <Tag color={getAttendanceTagColor(r.status)}>{r.status}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "homework" && (
            <div className="bg-card rounded-lg border border-border p-5">
              <h4 className="font-medium text-sm mb-4">作业提交情况</h4>
              <div className="space-y-4">
                {profileData.homeworkRecords.map(h => (
                  <div key={h.name} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium">{h.name}</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className={`h-3 rounded-full ${h.status === "按时" ? "bg-green-500" : h.status === "迟交" ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: h.score ? `${h.score}%` : "0%" }} />
                    </div>
                    <div className="w-16 text-right">
                      <span className="font-mono text-sm">{h.score ?? "—"}</span>
                    </div>
                    <Tag color={h.status === "按时" ? "green" : h.status === "迟交" ? "orange" : "red"}>{h.status}</Tag>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "experiment" && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["实验名称", "分数", "提交时间"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileData.experimentRecords.map(e => (
                    <tr key={e.name} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-medium">{e.name}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{e.score ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.submitTime || "未提交"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="bg-card rounded-lg border border-border p-5">
              <h4 className="font-medium text-sm mb-4">知识掌握度</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={profileData.knowledgeData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#1A56DB" fill="#1A56DB" fillOpacity={0.2} name="个人掌握度" />
                  <Radar dataKey="value" stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 3" name="班级均值" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "综合评分", value: Math.round((Number(profileData.stats.avgScore) || 0) * 1.1), color: "bg-blue-50 text-blue-700", icon: <Award size={16} /> },
                  { label: "学习态度", value: profileData.homeworkRecords.length > 0 ? Math.round((profileData.homeworkRecords.filter(h => h.status === "按时").length / profileData.homeworkRecords.length) * 100) : 0, color: "bg-green-50 text-green-700", icon: <Target size={16} /> },
                  { label: "知识掌握", value: profileData.knowledgeData.length > 0 ? Math.round(profileData.knowledgeData.reduce((sum, k) => sum + k.value, 0) / profileData.knowledgeData.length) : 0, color: "bg-purple-50 text-purple-700", icon: <BookOpen size={16} /> },
                  { label: "进步空间", value: 100 - Math.round(Number(profileData.stats.avgScore) || 0), color: "bg-orange-50 text-orange-700", icon: <TrendingUp size={16} /> },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">{stat.icon}<span className="text-xs font-medium">{stat.label}</span></div>
                    <p className="text-xl font-bold">{stat.value}<span className="text-sm font-normal">分</span></p>
                  </div>
                ))}
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-primary" />
                    <h4 className="font-medium text-sm">AI综合评价报告</h4>
                  </div>
                  <button
                    onClick={handleGenerateAi}
                    disabled={generatingAi}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generatingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : profileData.aiEvaluation ? (
                      <>
                        <RefreshCw size={14} />
                        更新评价
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        生成AI评价
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 min-h-[120px]">
                  {generatingAi ? (
                    <div className="flex flex-col items-center justify-center py-6 text-blue-600">
                      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                      <p className="text-sm">AI正在分析学生数据，生成评价中...</p>
                    </div>
                  ) : profileData.aiEvaluation ? (
                    <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{profileData.aiEvaluation}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-blue-400">
                      <Brain size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">点击上方按钮生成AI综合评价</p>
                    </div>
                  )}
                </div>
                {profileData.aiEvaluation && !generatingAi && (
                  <div className="mt-3 flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      上次生成时间：{new Date().toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">导出评价</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Teaching Assistant: Grading (考试批阅) ──────────────────────────────────────
function TA_GradingLegacy() {
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  const taUid = "TA2024001";
  const permissions = taPermissions[taUid];
  const allowedTasks = gradingTasks.filter(t => permissions.allowedClasses.includes(t.classId));

  const currentQuestions = selectedTask
    ? subjectiveQuestions.filter(q => q.examId === selectedTask)
    : [];

  const currentQuestion = selectedQuestion
    ? currentQuestions.find(q => q.id === selectedQuestion)
    : null;

  const handleSubmitGrade = () => {
    if (currentQuestion && score) {
      currentQuestion.score = parseInt(score);
      currentQuestion.comment = comment;
      currentQuestion.graded = true;
      setSelectedQuestion(null);
      setScore("");
      setComment("");
      setShowAISuggestion(false);
    }
  };

  const handleApplyAISuggestion = () => {
    if (currentQuestion?.aiSuggestion) {
      const match = currentQuestion.aiSuggestion.match(/(\d+)\/(\d+)/);
      if (match) {
        setScore(match[1]);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-sm">批阅任务列表</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["考试名称", "班级", "题目总数", "已批阅", "状态", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allowedTasks.map(t => (
              <tr key={t.id} className={`border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer ${selectedTask === t.examId ? "bg-primary/5" : ""}`}
                onClick={() => setSelectedTask(t.examId)}>
                <td className="px-4 py-3 font-medium">{t.examName}</td>
                <td className="px-4 py-3">{t.className}</td>
                <td className="px-4 py-3 font-mono">{t.totalQuestions}</td>
                <td className="px-4 py-3 font-mono">{t.gradedCount}/{t.totalQuestions}</td>
                <td className="px-4 py-3">
                  {t.status === "in-progress" ? <Tag color="orange">批阅中</Tag> : <Tag color="yellow">待开始</Tag>}
                </td>
                <td className="px-4 py-3">
                  <button className="text-primary hover:underline text-xs">开始批阅</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-medium text-sm">待批阅题目</h3>
              <p className="text-xs text-muted-foreground mt-1">共 {currentQuestions.length} 道题目</p>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {currentQuestions.map(q => (
                <div key={q.id} className={`px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors ${selectedQuestion === q.id ? "bg-primary/5" : ""}`}
                  onClick={() => setSelectedQuestion(q.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{q.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{q.studentId}</p>
                    </div>
                    {q.graded ? (
                      <Tag color="green">已批阅 {q.score}分</Tag>
                    ) : (
                      <Tag color="yellow">待批阅</Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedQuestion && currentQuestion ? (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">阅卷详情</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{currentQuestion.examName} · {currentQuestion.studentName} · {currentQuestion.studentId}</p>
                  </div>
                  {currentQuestion.graded ? (
                    <Tag color="green">已批阅</Tag>
                  ) : (
                    <Tag color="yellow">待批阅</Tag>
                  )}
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">题目</label>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm">{currentQuestion.question}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">学生答案</label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{currentQuestion.myAnswer}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-muted-foreground">AI辅助评分建议</label>
                      <button onClick={() => setShowAISuggestion(!showAISuggestion)} className="text-xs text-primary hover:underline">
                        {showAISuggestion ? "收起" : "展开"}
                      </button>
                    </div>
                    {showAISuggestion && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">{currentQuestion.aiSuggestion}</p>
                        <button onClick={handleApplyAISuggestion} className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">
                          应用建议分数
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">评分</label>
                      <input type="number" min="0" max="15" value={score} onChange={e => setScore(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="请输入分数" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">评语</label>
                      <input type="text" value={comment} onChange={e => setComment(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="请输入评语" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSubmitGrade} disabled={!score || currentQuestion.graded}
                      className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      提交评分
                    </button>
                    <button onClick={() => { setSelectedQuestion(null); setScore(""); setComment(""); setShowAISuggestion(false); }}
                      className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
                      跳过
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-10 text-center">
                <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">请从左侧列表选择一道题目开始批阅</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: AI Quiz (AI出题组卷) ─────────────────────────────────────────────
function TeacherAIQuiz({ onNav }: { onNav: (p: Page) => void }) {
  const [params, setParams] = useState({
    topics: [] as string[],
    types: [] as string[],
    count: 5,
    difficulty: "中等",
    socrates: false,
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>(aiGeneratedQuestions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [uploadedReference, setUploadedReference] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    classes: [] as string[],
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedQuestionsForExam, setSelectedQuestionsForExam] = useState<number[]>([]);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const handleGenerate = async () => {
    if (params.topics.length === 0 || params.types.length === 0) {
      showToastMsg("请至少选择一个知识点和一种题型");
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await generateQuestions({
        knowledgePoints: params.topics,
        questionType: params.types.join("、"),
        count: params.count,
        difficulty: params.difficulty,
        socraticMode: params.socrates,
      });
      const questions = (generated || []).map((q: any, index: number) => {
        const optionEntries = Object.entries(q.options || {});
        const questionType = q.questionType || params.types[0] || "简答";
        const isChoice = questionType.includes("选");
        const isMultiple = questionType.includes("多选");
        const answerKeys = String(q.answer || "").toUpperCase().match(/[A-Z]/g) || [];
        const answerIndexes = [...new Set(answerKeys
          .map(key => optionEntries.findIndex(([optionKey]) => optionKey.toUpperCase() === key))
          .filter(optionIndex => optionIndex >= 0))];
        const answerIndex = optionEntries.findIndex(([key, value]) => key === q.answer || value === q.answer);
        return {
          id: Date.now() + index,
          type: isMultiple ? "multiple" : isChoice ? "choice" : questionType === "填空" ? "fill" : "text",
          questionType,
          topic: (q.knowledgeTags || params.topics).join("、"),
          difficulty: params.difficulty,
          professionalScore: 100,
          status: "pending" as const,
          question: q.stem,
          options: isChoice ? optionEntries.map(([, value]) => String(value)) : [],
          answer: isMultiple ? answerIndexes : isChoice ? (answerIndex >= 0 ? answerIndex : 0) : q.answer,
          explain: q.explanation,
          socraticQuestions: q.socraticQuestions || [],
        };
      });
      setGeneratedQuestions(questions);
      setSelectedQuestionsForExam([]);
      showToastMsg(`成功生成 ${questions.length} 道题目`);
    } catch (error) {
      showToastMsg(error instanceof Error ? error.message : "无法连接本地大模型服务");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (id: number) => {
    setGeneratedQuestions(prev => prev.map(q => q.id === id ? { ...q, status: "approved" as const } : q));
    setAddedCount(prev => prev + 1);
    showToastMsg("题目已审核通过并入库");
  };

  const handleBatchApprove = () => {
    const pendingCount = generatedQuestions.filter(q => q.status !== "approved").length;
    setGeneratedQuestions(prev => prev.map(q => ({ ...q, status: "approved" as const })));
    setAddedCount(pendingCount);
    setShowAddedModal(true);
    showToastMsg(`已批量通过 ${pendingCount} 道题目`);
  };

  const handleReject = (id: number) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
    showToastMsg("题目已驳回丢弃");
  };

  const handleUploadReference = () => {
    setUploadedReference("期中考试真题.pdf");
    showToastMsg("已上传参考试卷");
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newList = [...generatedQuestions];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);
    setGeneratedQuestions(newList);
    setDraggedIndex(null);
  };

  const handleQuestionSelect = (id: number) => {
    setSelectedQuestionsForExam(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePublishExam = () => {
    if (!examForm.name || !examForm.startTime || !examForm.endTime || examForm.classes.length === 0) {
      showToastMsg("请填写完整考试信息");
      return;
    }
    setShowPublishModal(false);
    showToastMsg(`考试「${examForm.name}」已发布，共 ${selectedQuestionsForExam.length} 道题目`);
  };

  const pendingQuestions = generatedQuestions.filter(q => q.status !== "approved");
  const approvedQuestions = generatedQuestions.filter(q => q.status === "approved");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="lg:col-span-1 bg-card rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-medium text-sm">题目生成参数</h3>
        
        <div>
          <label className="text-xs font-medium text-muted-foreground">知识点范围</label>
          <select multiple value={params.topics} onChange={e => setParams({ ...params, topics: Array.from(e.currentTarget.selectedOptions, option => option.value) })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm h-24">
            {questionCategories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">题型</label>
          <div className="mt-2 space-y-1">
            {["单选", "多选", "填空", "简答", "综合"].map(t => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={params.types.includes(t)} onChange={e => setParams({
                  ...params,
                  types: e.target.checked ? [...params.types, t] : params.types.filter(type => type !== t),
                })} className="rounded" />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">题目数量</label>
          <input type="number" value={params.count} onChange={e => setParams({ ...params, count: parseInt(e.target.value) })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" min={1} max={20} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">难度等级</label>
          <select value={params.difficulty} onChange={e => setParams({ ...params, difficulty: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm">
            <option value="简单">简单</option>
            <option value="中等">中等</option>
            <option value="困难">困难</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={params.socrates} onChange={e => setParams({ ...params, socrates: e.target.checked })} className="rounded" />
            苏格拉底模式
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">参考来源（可选）</label>
          <div className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center ${uploadedReference ? "border-primary bg-primary/5" : "border-border hover:border-primary"} cursor-pointer transition-colors`} onClick={handleUploadReference}>
            {uploadedReference ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <FileText size={14} />{uploadedReference}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                <Upload size={16} className="mx-auto mb-1" />上传参考试卷或练习题
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">上传后AI会模仿该试卷的命题风格，提取的题目仍需审核后入库</p>
        </div>

        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
          {isGenerating ? "生成中..." : "生成题目"}
        </button>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-sm">生成的题目列表</h3>
            <div className="flex bg-card border border-border rounded-lg p-0.5">
              <button onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "preview" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                预览模式
              </button>
              <button onClick={() => setViewMode("edit")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${viewMode === "edit" ? "bg-primary text-white" : "text-muted-foreground hover:text-gray-900"}`}>
                编辑模式
              </button>
            </div>
            <span className="text-xs text-muted-foreground">待审核 {pendingQuestions.length} 道 · 已入库 {approvedQuestions.length} 道 · 已选择 {selectedQuestionsForExam.length} 道</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingQuestions.length > 0 && (
              <button onClick={handleBatchApprove} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600">
                <CheckCircle size={12} />全部通过 ({pendingQuestions.length})
              </button>
            )}
            {selectedQuestionsForExam.length > 0 && (
              <button onClick={() => setShowPublishModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600">
                <Send size={12} />发布考试 ({selectedQuestionsForExam.length})
              </button>
            )}
            {approvedQuestions.length > 0 && (
              <button onClick={() => onNav("teacher-bank")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-blue-700">
                <Database size={12} />前往题库查看
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {generatedQuestions.map((q, index) => (
            <div key={q.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)}
              className={`bg-card rounded-lg border border-border p-4 ${q.professionalScore < 80 ? "border-yellow-200" : ""} ${q.status === "approved" ? "opacity-60" : ""} ${draggedIndex === index ? "opacity-50 border-primary shadow-lg" : ""} cursor-move hover:border-primary/50 transition-all`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedQuestionsForExam.includes(q.id)} onChange={() => handleQuestionSelect(q.id)} 
                    className="rounded text-primary focus:ring-primary" disabled={q.status !== "approved"} />
                  <GripVertical size={14} className="text-muted-foreground" />
                  <Tag color="blue">{q.questionType || (q.type === "multiple" ? "多选题" : q.type === "choice" ? "选择题" : q.type === "fill" ? "填空题" : "问答题")}</Tag>
                  <Tag color="gray">{q.topic}</Tag>
                  <Tag color={q.difficulty === "简单" ? "green" : q.difficulty === "中等" ? "blue" : "red"}>{q.difficulty}</Tag>
                  {q.professionalScore < 80 && <Tag color="yellow">专业度 {q.professionalScore}</Tag>}
                  <Tag color="cyan">AI生成</Tag>
                </div>
                <div className="flex items-center gap-2">
                  {q.status === "approved" ? <Tag color="green">已入库</Tag> : <Tag color="gray">待审核</Tag>}
                </div>
              </div>
              {viewMode === "edit" ? (
                <textarea defaultValue={q.question} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24 mb-3" />
              ) : (
                <p className="text-sm mb-3">{q.question}</p>
              )}
              {q.options?.length > 0 && (
                <div className="space-y-1 mb-3">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`text-xs px-3 py-1.5 rounded ${(Array.isArray(q.answer) ? q.answer.includes(i) : i === q.answer) ? "bg-green-50 text-green-700" : "bg-muted"}`}>
                      {String.fromCharCode(65 + i)}. {viewMode === "edit" ? <input type="text" defaultValue={opt} className="w-full bg-transparent text-xs" /> : opt}
                    </div>
                  ))}
                </div>
              )}
              {q.type !== "choice" && q.type !== "multiple" && (
                <div className="bg-green-50 rounded p-2 mb-3">
                  <p className="text-xs font-medium text-green-700">参考答案：{q.answer}</p>
                </div>
              )}
              <div className="bg-blue-50 rounded p-2 mb-3">
                <p className="text-xs text-blue-700">{q.explain}</p>
              </div>
              {q.socraticQuestions?.length > 0 && (
                <div className="bg-purple-50 rounded p-2 mb-3">
                  <p className="text-xs font-medium text-purple-700 mb-1">苏格拉底追问</p>
                  {q.socraticQuestions.map((question: string, i: number) => (
                    <p key={i} className="text-xs text-purple-700">{i + 1}. {question}</p>
                  ))}
                </div>
              )}
              {q.status !== "approved" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(q.id)} className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600">审核通过（入库）</button>
                  <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent">修改内容</button>
                  <button onClick={() => handleReject(q.id)} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded">驳回丢弃</button>
                  <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent">重新生成</button>
                </div>
              )}
              {q.status === "approved" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={12} className="text-green-500" />题目已入库，来源标记为"AI生成题目"
                  <button onClick={() => onNav("teacher-bank")} className="text-primary hover:underline">查看题库</button>
                </div>
              )}
            </div>
          ))}
          {generatedQuestions.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              <Brain size={32} className="mx-auto mb-3 opacity-50" />
              <p>暂无生成的题目</p>
              <p className="mt-1">设置参数后点击"生成题目"按钮开始生成</p>
            </div>
          )}
        </div>
      </div>

      {showAddedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">题目入库成功</h3>
              <p className="text-sm text-muted-foreground mt-1">已将 {addedCount} 道题目审核通过并写入题库</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddedModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">继续生成</button>
              <button onClick={() => { setShowAddedModal(false); onNav("teacher-bank"); }} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">前往题库查看</button>
            </div>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">发布考试</h3>
              <button onClick={() => setShowPublishModal(false)}><X size={16} /></button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">考试名称</label>
              <input type="text" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="如：期中考试" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">开始时间</label>
                <input type="datetime-local" value={examForm.startTime} onChange={e => setExamForm({ ...examForm, startTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">结束时间</label>
                <input type="datetime-local" value={examForm.endTime} onChange={e => setExamForm({ ...examForm, endTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">参与班级（多选）</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["2024级1班", "2024级2班", "2024级3班", "2024级4班"].map(cls => (
                  <label key={cls} className={`px-3 py-1.5 rounded-md text-xs cursor-pointer border transition-colors ${examForm.classes.includes(cls) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                    <input type="checkbox" checked={examForm.classes.includes(cls)} onChange={e => {
                      const newClasses = e.target.checked ? [...examForm.classes, cls] : examForm.classes.filter(c => c !== cls);
                      setExamForm({ ...examForm, classes: newClasses });
                    }} className="hidden" />
                    {cls}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">已选择题目数量</span>
                <span className="font-medium text-primary">{selectedQuestionsForExam.length} 道</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPublishModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm">取消</button>
              <button onClick={handlePublishExam} className="flex-1 py-2 bg-primary text-white rounded-md text-sm">确认发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: Question Bank (题库管理) ─────────────────────────────────────────
function TeacherQuestionBank({ onNav, setSelectedQuizQuestions, filterSourceType, setFilterSourceType }: { 
  onNav: (p: Page) => void; 
  setSelectedQuizQuestions: (ids: number[]) => void;
  filterSourceType: string | null;
  setFilterSourceType: (type: string | null) => void;
}) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(filterSourceType || null);
  const [searchText, setSearchText] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const filteredQuestions = teacherQuestions.filter(q => {
    if (selectedTopic && !q.topic.includes(selectedTopic)) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(q.type)) return false;
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(q.difficulty)) return false;
    if (selectedSourceType && q.sourceType !== selectedSourceType) return false;
    if (searchText && !q.preview.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const toggleQuestionSelection = (id: number) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleTypeSelection = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleDifficultySelection = (difficulty: string) => {
    setSelectedDifficulties(prev => prev.includes(difficulty) ? prev.filter(d => d !== difficulty) : [...prev, difficulty]);
  };

  const handleAddToQuiz = () => {
    setSelectedQuizQuestions(selectedQuestions);
    setFilterSourceType(null);
    onNav("teacher-exam");
    showToastMsg(`已选择 ${selectedQuestions.length} 道题目，正在跳转组卷...`);
  };

  const handleUploadExam = () => {
    setUploadedFile("计算机网络考研真题.pdf");
    showToastMsg("文件上传成功");
  };

  const handleAiExtract = () => {
    setAiExtracting(true);
    setTimeout(() => {
      setAiExtracting(false);
      setExtractedCount(12);
      showToastMsg(`AI已从试卷中提取 ${extractedCount} 道题目`);
    }, 2000);
  };

  const handleAddToBank = () => {
    showToastMsg(`已将 ${extractedCount} 道题目添加到题库`);
    setShowUploadModal(false);
    setUploadedFile(null);
    setExtractedCount(0);
  };

  const questionTypes = [
    { value: "choice", label: "选择题" },
    { value: "judge", label: "判断题" },
    { value: "text", label: "问答题" },
  ];

  const difficulties = [
    { value: "简单", label: "简单" },
    { value: "中等", label: "中等" },
    { value: "困难", label: "困难" },
  ];

  const sourceTypes = [
    { value: "postgraduate", label: "考研真题", icon: Award },
    { value: "ai-generated", label: "AI生成", icon: Brain },
    { value: "teacher-upload", label: "教师上传", icon: Upload },
    { value: "wrong-derived", label: "错题衍生", icon: AlertCircle },
  ];

  const stats = {
    total: teacherQuestions.length,
    choice: teacherQuestions.filter(q => q.type === "choice").length,
    judge: teacherQuestions.filter(q => q.type === "judge").length,
    text: teacherQuestions.filter(q => q.type === "text").length,
    postgraduate: teacherQuestions.filter(q => q.isPostgraduate).length,
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">题库管理</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => onNav("teacher-ai-quiz")} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
            <Plus size={14} />AI生成题目
          </button>
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
            <Upload size={14} />导入试卷
          </button>
          {selectedQuestions.length > 0 && (
            <button onClick={handleAddToQuiz} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">
              <Plus size={14} />加入组卷 ({selectedQuestions.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "题库总量", value: stats.total, icon: BookMarked, color: "blue" },
          { label: "选择题", value: stats.choice, icon: Target, color: "green" },
          { label: "判断题", value: stats.judge, icon: CheckCircle, color: "orange" },
          { label: "问答题", value: stats.text, icon: FileText, color: "purple" },
          { label: "考研真题", value: stats.postgraduate, icon: Award, color: "red" },
        ].map(item => (
          <div key={item.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color === "blue" ? "bg-blue-100" : item.color === "green" ? "bg-green-100" : item.color === "orange" ? "bg-orange-100" : item.color === "purple" ? "bg-purple-100" : "bg-red-100"}`}>
                <item.icon size={18} className={item.color === "blue" ? "text-blue-600" : item.color === "green" ? "text-green-600" : item.color === "orange" ? "text-orange-600" : item.color === "purple" ? "text-purple-600" : "text-red-600"} />
              </div>
              <div>
                <p className="font-mono text-xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Search size={14} className="text-muted-foreground" />搜索题目
            </h3>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
              placeholder="输入题干关键词..."
            />
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">题型筛选</h3>
            <div className="flex flex-wrap gap-1">
              {questionTypes.map(t => (
                <button key={t.value} onClick={() => toggleTypeSelection(t.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedTypes.includes(t.value) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <button onClick={() => setSelectedTypes([])} className="mt-2 text-xs text-primary hover:underline">清除筛选</button>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">难度筛选</h3>
            <div className="flex flex-wrap gap-1">
              {difficulties.map(d => (
                <button key={d.value} onClick={() => toggleDifficultySelection(d.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedDifficulties.includes(d.value) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            {selectedDifficulties.length > 0 && (
              <button onClick={() => setSelectedDifficulties([])} className="mt-2 text-xs text-primary hover:underline">清除筛选</button>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">来源筛选</h3>
            <div className="space-y-1">
              <button onClick={() => { setSelectedSourceType(null); setFilterSourceType(null); }} className={`w-full text-left text-sm hover:bg-accent rounded px-3 py-2 flex items-center gap-2 ${!selectedSourceType ? "bg-primary/10 text-primary" : ""}`}>
                <Database size={12} />全部来源
              </button>
              {sourceTypes.map(s => (
                <button key={s.value} onClick={() => { setSelectedSourceType(selectedSourceType === s.value ? null : s.value); setFilterSourceType(selectedSourceType === s.value ? null : s.value); }} className={`w-full text-left text-sm hover:bg-accent rounded px-3 py-2 flex items-center gap-2 ${selectedSourceType === s.value ? "bg-primary/10 text-primary" : ""}`}>
                  <s.icon size={12} />{s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">知识点筛选</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questionCategories.map(c => (
                <div key={c.name}>
                  <button onClick={() => setSelectedTopic(selectedTopic === c.name ? null : c.name)} className={`w-full text-left text-sm hover:bg-accent rounded px-2 py-1.5 ${selectedTopic === c.name ? "bg-primary/10 text-primary" : ""}`}>
                    {c.name}
                  </button>
                  {selectedTopic === c.name && (
                    <div className="ml-2 mt-1 space-y-0.5">
                      {c.sections.map(s => (
                        <button key={s} className="w-full text-left text-xs hover:bg-accent rounded px-2 py-1">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-sm">题目列表</h3>
                <span className="text-xs text-muted-foreground">共 {filteredQuestions.length} 道题目</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs text-muted-foreground hover:text-primary">刷新</button>
                <button className="text-xs text-muted-foreground hover:text-primary">导出</button>
              </div>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {filteredQuestions.map(q => (
                <div key={q.id} className={`px-4 py-4 hover:bg-accent/20 transition-colors ${q.isPostgraduate ? "bg-red-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Tag color="blue">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "问答题"}</Tag>
                        <Tag color="gray">{q.topic}</Tag>
                        <Tag color={q.difficulty === "简单" ? "green" : q.difficulty === "中等" ? "blue" : "red"}>{q.difficulty}</Tag>
                        {q.isPostgraduate && <Tag color="red"><Award size={10} className="inline mr-1" />考研真题</Tag>}
                        {q.sourceLabel && !q.isPostgraduate && <Tag color={q.sourceType === "ai-generated" ? "cyan" : q.sourceType === "teacher-upload" ? "purple" : "orange"}>{q.sourceLabel}</Tag>}
                      </div>
                      <p className="text-sm leading-relaxed">{q.preview}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>生成时间：{q.createdAt}</span>
                        <span>使用次数：{q.usedCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedQuestions.includes(q.id)} onChange={() => toggleQuestionSelection(q.id)} className="rounded" />
                      <button onClick={() => { toggleQuestionSelection(q.id); setTimeout(() => handleAddToQuiz(), 100); }} className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20">
                        加入组卷
                      </button>
                      <button className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent">编辑</button>
                      <button className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-md">删除</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <BookMarked size={32} className="mx-auto mb-3 opacity-50" />
                  <p>暂无符合条件的题目</p>
                  <button onClick={() => onNav("teacher-ai-quiz")} className="mt-3 text-primary hover:underline">去AI生成</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">上传试卷并提取题目</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadedFile(null); setExtractedCount(0); }}><X size={16} /></button>
            </div>
            <p className="text-xs text-muted-foreground">上传已有的试卷或练习题，AI会自动识别并提取题目到题库中</p>
            
            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${uploadedFile ? "border-primary bg-primary/5" : "border-border hover:border-primary"} cursor-pointer transition-colors`} onClick={handleUploadExam}>
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileText size={20} />
                  <span className="text-sm font-medium">{uploadedFile}</span>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium text-sm">拖拽文件到此处，或点击上传</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 .pdf, .doc, .docx 格式</p>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">AI智能分析</h4>
                  <div className="space-y-2 text-xs text-blue-700">
                    <div className="flex items-center justify-between">
                      <span>正在分析试卷内容...</span>
                      {aiExtracting && <div className="w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin" />}
                    </div>
                    {extractedCount > 0 && (
                      <>
                        <p>已识别题目类型：选择题 {Math.floor(extractedCount * 0.5)} 道，判断题 {Math.floor(extractedCount * 0.2)} 道，问答题 {Math.floor(extractedCount * 0.3)} 道</p>
                        <p>知识点分布：TCP/IP协议、HTTP协议、网络安全等</p>
                      </>
                    )}
                  </div>
                </div>

                {!aiExtracting && extractedCount === 0 && (
                  <button onClick={handleAiExtract} className="w-full py-3 bg-primary text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Brain size={16} />AI提取题目
                  </button>
                )}

                {extractedCount > 0 && (
                  <div className="flex gap-3">
                    <button onClick={() => { setShowUploadModal(false); setUploadedFile(null); setExtractedCount(0); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
                    <button onClick={handleAddToBank} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
                      添加 {extractedCount} 道题目到题库
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: Exam Management (考试管理) ───────────────────────────────────────
function TeacherExamManagementLegacy({ selectedQuizQuestions, setSelectedQuizQuestions }: {
  selectedQuizQuestions: number[];
  setSelectedQuizQuestions: (ids: number[]) => void;
}) {
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [viewingStudentExam, setViewingStudentExam] = useState<{ uid: string; examId: number } | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [examInfo, setExamInfo] = useState({
    name: "",
    classes: [] as string[],
    startTime: "",
    endTime: "",
  });
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<number[]>(selectedQuizQuestions);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAIGrading, setShowAIGrading] = useState(false);
  const [gradingExamId, setGradingExamId] = useState<number | null>(null);
  const [gradingResults, setGradingResults] = useState<any[]>([]);
  const [gradingStatus, setGradingStatus] = useState<"idle" | "grading" | "done">("idle");
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<string | null>(null);
  const [gradingTab, setGradingTab] = useState<"paper" | "students" | "review" | "analysis">("paper");

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  // API state
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    getExamPapers(1, 100).then(data => {
      setExamPapers(data.records || []);
    }).catch(() => {}).finally(() => setLoadingExams(false));
  }, []);

  const handleExportTranscript = () => {
    showToastMsg("成绩单已导出为Excel");
  };

  const handlePushWrongQuestions = () => {
    showToastMsg("错题练习已推送到学生错题本");
  };

  const handleAutoSubmit = async (examId: number) => {
    try {
      await closeExamPaper(examId);
      showToastMsg("已触发自动收卷，所有未提交答卷已自动提交");
      setExamPapers(prev => prev.map(p => p.id === examId ? { ...p, status: "CLOSED" } : p));
    } catch { showToastMsg("操作失败"); }
  };

  const handlePublishExam = async (examId: number) => {
    try {
      await publishExamPaper(examId);
      showToastMsg("考试已发布");
      setExamPapers(prev => prev.map(p => p.id === examId ? { ...p, status: "PUBLISHED" } : p));
    } catch { showToastMsg("发布失败"); }
  };

  const handleDeleteExam = async (examId: number) => {
    try {
      await deleteExamPaper(examId);
      showToastMsg("考试已删除");
      setExamPapers(prev => prev.filter(p => p.id !== examId));
    } catch { showToastMsg("删除失败"); }
  };

  const availableClasses = ["2024级1班", "2024级2班", "2024级3班"];

  const filteredBankQuestions = teacherQuestions.filter(q => {
    if (filterType.length > 0 && !filterType.includes(q.type)) return false;
    if (filterDifficulty.length > 0 && !filterDifficulty.includes(q.difficulty)) return false;
    if (filterSource && q.sourceType !== filterSource) return false;
    return true;
  });

  const toggleQuestionSelection = (id: number) => {
    setSelectedExamQuestions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateExam = async () => {
    try {
      const created = await createExamPaper({
        paperName: examInfo.name,
        courseId: null,
        startTime: examInfo.startTime,
        endTime: examInfo.endTime,
      });
      setExamPapers(prev => [created, ...prev]);
      showToastMsg("考试创建成功！");
    } catch { showToastMsg("创建失败"); }
    setShowCreateWizard(false);
    setCreateStep(1);
    setExamInfo({ name: "", classes: [], startTime: "", endTime: "" });
    setSelectedExamQuestions([]);
    setSelectedQuizQuestions([]);
  };

  const handleResetWizard = () => {
    setShowCreateWizard(false);
    setCreateStep(1);
    setSelectedExamQuestions([]);
    setSelectedQuizQuestions([]);
  };

  if (showCreateWizard) {
    const selectedQuestionsData = teacherQuestions.filter(q => selectedExamQuestions.includes(q.id));
    
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={handleResetWizard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronRight size={14} />返回考试列表
          </button>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${createStep >= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${createStep >= step ? "text-foreground" : "text-muted-foreground"}`}>
                  {step === 1 ? "基本信息" : step === 2 ? "选题组卷" : "预览发布"}
                </span>
                {step < 3 && <div className={`w-16 h-0.5 mx-4 ${createStep > step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {createStep === 1 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="font-medium text-center mb-4">第一步：填写考试基本信息</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">考试名称</label>
                <input type="text" value={examInfo.name} onChange={e => setExamInfo({ ...examInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="如：计算机网络期中考试" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">参与班级</label>
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map(c => (
                    <button key={c} onClick={() => setExamInfo({ ...examInfo, classes: examInfo.classes.includes(c) ? examInfo.classes.filter(cl => cl !== c) : [...examInfo.classes, c] })}
                      className={`px-4 py-2 rounded-lg text-sm ${examInfo.classes.includes(c) ? "bg-primary text-white" : "border border-border hover:bg-accent"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">开始时间</label>
                  <input type="datetime-local" value={examInfo.startTime} onChange={e => setExamInfo({ ...examInfo, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">截止时间</label>
                  <input type="datetime-local" value={examInfo.endTime} onChange={e => setExamInfo({ ...examInfo, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={handleResetWizard} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
                <button onClick={() => setCreateStep(2)} disabled={!examInfo.name || examInfo.classes.length === 0 || !examInfo.startTime || !examInfo.endTime}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">下一步</button>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-center mb-4">第二步：从题库选题组卷</h3>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">已选题目：{selectedExamQuestions.length} 道</span>
                <button onClick={() => { setSelectedExamQuestions([]); setSelectedQuizQuestions([]); }} className="text-xs text-primary hover:underline">清空已选</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium">题型筛选</h4>
                    {["choice", "judge", "text"].map(t => (
                      <button key={t} onClick={() => setFilterType(filterType.includes(t) ? filterType.filter(ft => ft !== t) : [...filterType, t])}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded ${filterType.includes(t) ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                        {t === "choice" ? "选择题" : t === "judge" ? "判断题" : "问答题"}
                      </button>
                    ))}
                  </div>

                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium">难度筛选</h4>
                    {["简单", "中等", "困难"].map(d => (
                      <button key={d} onClick={() => setFilterDifficulty(filterDifficulty.includes(d) ? filterDifficulty.filter(fd => fd !== d) : [...filterDifficulty, d])}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded ${filterDifficulty.includes(d) ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium">来源筛选</h4>
                    <button onClick={() => setFilterSource(null)} className={`w-full text-left text-sm px-2 py-1.5 rounded ${!filterSource ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>全部来源</button>
                    {["postgraduate", "ai-generated", "teacher-upload", "wrong-derived"].map(s => (
                      <button key={s} onClick={() => setFilterSource(filterSource === s ? null : s)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded ${filterSource === s ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                        {s === "postgraduate" ? "考研真题" : s === "ai-generated" ? "AI生成" : s === "teacher-upload" ? "教师上传" : "错题衍生"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="bg-card rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
                    <div className="divide-y divide-border">
                      {filteredBankQuestions.map(q => (
                        <div key={q.id} className={`px-4 py-3 hover:bg-accent/20 transition-colors ${selectedExamQuestions.includes(q.id) ? "bg-primary/5" : ""}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Tag color="blue">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "问答题"}</Tag>
                                <Tag color="gray">{q.topic}</Tag>
                                <Tag color={q.difficulty === "简单" ? "green" : q.difficulty === "中等" ? "blue" : "red"}>{q.difficulty}</Tag>
                                {q.isPostgraduate && <Tag color="red"><Award size={10} className="inline mr-1" />考研真题</Tag>}
                              </div>
                              <p className="text-sm line-clamp-2">{q.preview}</p>
                            </div>
                            <input type="checkbox" checked={selectedExamQuestions.includes(q.id)} onChange={() => toggleQuestionSelection(q.id)} className="rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setCreateStep(1)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">上一步</button>
                <button onClick={() => setCreateStep(3)} disabled={selectedExamQuestions.length === 0}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">下一步</button>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-center mb-4">第三步：预览并发布考试</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="font-medium text-sm mb-3">考试信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">考试名称</span><span>{examInfo.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">参与班级</span><span>{examInfo.classes.join("、")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">开始时间</span><span>{examInfo.startTime}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">截止时间</span><span>{examInfo.endTime}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">题目数量</span><span>{selectedExamQuestions.length} 道</span></div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="font-medium text-sm mb-3">题目预览</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedQuestionsData.slice(0, 5).map((q, i) => (
                      <div key={q.id} className="border border-border rounded p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{i + 1}.</span>
                          <Tag color="blue" className="text-xs">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "问答题"}</Tag>
                        </div>
                        <p className="text-xs line-clamp-2">{q.preview}</p>
                      </div>
                    ))}
                    {selectedQuestionsData.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">...还有 {selectedQuestionsData.length - 5} 道题目</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setCreateStep(2)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">上一步</button>
                <button onClick={handleCreateExam} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">发布考试</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedExam) {
    const details = examDetails[selectedExam];
    if (!details) return null;

    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => { viewingStudentExam ? setViewingStudentExam(null) : setSelectedExam(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronRight size={14} />{viewingStudentExam ? "返回成绩列表" : "返回考试列表"}
          </button>
          <div className="flex items-center gap-2">
            {!viewingStudentExam && (
              <>
                <button onClick={() => { setGradingExamId(selectedExam!); setShowAIGrading(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600">
                  <Brain size={14} />AI改卷
                </button>
                <button onClick={handleExportTranscript} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent">
                  <Download size={14} />导出成绩单
                </button>
                <button onClick={handlePushWrongQuestions} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-blue-700">
                  <BookOpen size={14} />推送错题练习
                </button>
              </>
            )}
          </div>
        </div>

        {viewingStudentExam ? (() => {
          const student = details.studentScores.find(s => s.uid === viewingStudentExam!.uid);
          const exam = mockExams.find(e => e.id === viewingStudentExam!.examId);
          const answers = details.studentAnswers?.[viewingStudentExam!.uid] || [];
          if (!student || !exam) return null;
          
          return (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.uid}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">总得分</p>
                    <p className={`text-2xl font-bold ${student.score >= 60 ? "text-emerald-600" : "text-red-600"}`}>
                      {student.score} <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>提交时间：{student.submitTime}</span>
                  <span>批阅状态：{student.graded ? <span className="text-green-600">已批阅</span> : <span className="text-yellow-600">待批阅</span>}</span>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h4 className="font-medium text-sm">试卷答题详情</h4>
                </div>
                <div className="p-4 space-y-4">
                  {exam.questions.map((q, idx) => {
                    const answer = answers.find(a => a.qid === q.id);
                    const isCorrect = q.type === "text" ? answer?.score === 20 : answer?.answer === q.answer;
                    return (
                      <div key={q.id} className={`rounded-lg p-4 border ${isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{idx + 1}</span>
                          <span className="text-xs text-muted-foreground">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "简答题"}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{q.type === "choice" ? "20分" : q.type === "judge" ? "10分" : "20分"}</span>
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-red-200 text-red-700"}`}>
                            {isCorrect ? "正确" : "错误"}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-3">{q.question}</p>
                        {q.options && (
                          <div className="space-y-1 mb-3">
                            {q.options.map((opt, i) => {
                              let cls = "bg-muted rounded text-xs";
                              if (i === q.answer) cls = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                              else if (answer?.answer === i) cls = "bg-red-100 text-red-700 border border-red-200";
                              return (
                                <div key={i} className={`px-3 py-2 ${cls}`}>
                                  {String.fromCharCode(65 + i)}. {opt}
                                  {i === q.answer && <span className="ml-2">✓ 正确答案</span>}
                                  {answer?.answer === i && i !== q.answer && <span className="ml-2">✗ 你的答案</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {q.type === "text" && (
                          <>
                            <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-2">
                              <p className="text-xs text-red-700 font-medium mb-1">你的答案</p>
                              <p className="text-sm text-red-600">{answer?.answer || "未作答"}</p>
                            </div>
                            <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-3">
                              <p className="text-xs text-emerald-700 font-medium mb-1">参考答案</p>
                              <p className="text-sm text-emerald-600">{q.answer}</p>
                            </div>
                          </>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">评语：{answer?.comment || "-"}</span>
                          <span className={`text-sm font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>得分：{answer?.score || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })() : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "平均分", value: details.avgScore, icon: TrendingUp },
                { label: "最高分", value: details.maxScore, icon: Award },
                { label: "最低分", value: details.minScore, icon: Target },
                { label: "及格率", value: `${details.passRate}%`, icon: CheckCircle },
                { label: "待批阅", value: details.pendingCount || "0", icon: Clock, highlight: true },
              ].map(item => (
                <div key={item.label} className={`bg-card rounded-lg border border-border p-4 ${item.highlight ? "border-yellow-200" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon size={16} className={item.highlight ? "text-yellow-600" : "text-primary"} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className={`font-mono text-xl font-bold ${item.highlight ? "text-yellow-600" : "text-primary"}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">成绩分布</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={details.scoreDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}人`} />
                    <Bar dataKey="count" fill="#1A56DB" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-lg border border-border p-5">
                <h4 className="font-medium text-sm mb-4">每题正确率</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={details.questionAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="qid" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ formatter: (v: any) => `${v}%` }} />
                    <Tooltip formatter={(v: any) => `${(v * 100).toFixed(0)}%`} />
                    <Bar dataKey="accuracy" fill="#10B981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h4 className="font-medium text-sm">学生成绩列表</h4>
                <button onClick={handleExportTranscript} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Download size={12} />导出Excel
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["学号", "姓名", "总分", "提交时间", "批阅状态", "操作"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.studentScores.map(s => (
                    <tr key={s.uid} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-mono text-xs">{s.uid}</td>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{s.score}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.submitTime}</td>
                      <td className="px-4 py-3">{s.graded ? <Tag color="green">已批阅</Tag> : <Tag color="yellow">待批阅</Tag>}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewingStudentExam({ uid: s.uid, examId: selectedExam! })} className="text-xs text-primary hover:underline">查看详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">高频错题分析</h4>
                <button onClick={handlePushWrongQuestions} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Send size={12} />推送全部错题到错题本
                </button>
              </div>
              <div className="space-y-3">
                {details.highFrequencyWrong.map((q, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium line-clamp-1">{q.preview}</span>
                      <Tag color="red">正确率 {(q.accuracy * 100).toFixed(0)}%</Tag>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{q.analysis}</p>
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-primary hover:underline">相似题推荐</button>
                      <button onClick={handlePushWrongQuestions} className="text-xs text-green-600 hover:underline">推送此题到错题本</button>
                      <button onClick={() => showToastMsg("相似题已推送到题库，来源标记为'错题衍生'")} className="text-xs text-blue-600 hover:underline">将相似题入库</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <button onClick={() => showToastMsg("所有相似题已批量推送到题库")} className="text-xs text-primary hover:underline">
                  <Plus size={12} className="inline mr-1" />将全部相似题入库（来源标记为错题衍生）
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">考试管理</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowCreateWizard(true); setSelectedExamQuestions(selectedQuizQuestions); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
            <Plus size={14} />创建考试
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["考试名称", "参与班级", "发布时间", "截止时间", "参与人数", "平均分", "状态", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingExams ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">加载中...</td></tr>
            ) : examPapers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">暂无考试，点击"创建考试"开始</td></tr>
            ) : examPapers.map(exam => (
              <tr key={exam.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                <td className="px-4 py-3 font-medium cursor-pointer hover:text-primary" onClick={() => setSelectedExam(exam.id)}>{exam.paperName || "未命名考试"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{exam.courseName || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{exam.createTime || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">—</td>
                <td className="px-4 py-3 font-mono">—</td>
                <td className="px-4 py-3 font-mono">—</td>
                <td className="px-4 py-3">
                  {exam.status === "CLOSED" ? <Tag color="green">已结束</Tag> : exam.status === "PUBLISHED" ? (
                    <div className="flex items-center gap-2">
                      <Tag color="blue">进行中</Tag>
                      <button onClick={() => handleAutoSubmit(exam.id)} className="text-xs text-red-500 hover:underline">自动收卷</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Tag color="gray">草稿</Tag>
                      <button onClick={() => handlePublishExam(exam.id)} className="text-xs text-primary hover:underline">发布</button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedExam(exam.id)} className="text-xs text-primary hover:underline">查看详情</button>
                  <span className="mx-1 text-muted-foreground">|</span>
                  <button onClick={() => handleDeleteExam(exam.id)} className="text-xs text-red-500 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAIGrading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">AI智能改卷</h3>
                {gradingExamId && (
                  <span className="text-xs text-muted-foreground">— {mockExams.find(e => e.id === gradingExamId)?.name}</span>
                )}
              </div>
              <button onClick={() => { setShowAIGrading(false); setGradingStatus("idle"); setGradingTab("paper"); }}><X size={16} /></button>
            </div>

            {gradingStatus === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Brain size={40} className="text-emerald-600" />
                </div>
                <h4 className="font-medium text-lg">AI自动批改试卷</h4>
                <p className="text-sm text-muted-foreground text-center max-w-lg">系统将自动批改选择题、判断题等客观题，并给出主观题评分建议。老师可对评分结果进行逐题复核修改，AI还会针对考卷分析学习情况并提出改进建议。</p>
                <button onClick={() => {
                  setGradingStatus("grading");
                  setTimeout(() => {
                    setGradingResults([
                      { 
                        id: 1, uid: "2024001", name: "张伟", 
                        answers: [
                          { questionId: 1, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 2, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 3, answer: 2, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，IPv6地址长度为128位" },
                          { questionId: 4, answer: 0, isCorrect: true, aiScore: 10, teacherScore: null, comment: "正确" },
                          { questionId: 5, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 6, answer: "客户端发送SYN，服务器回应SYN+ACK，客户端发送ACK", isCorrect: true, aiScore: 15, teacherScore: null, comment: "回答完整准确" },
                        ],
                        totalScore: 85, aiComments: "选择题正确率高，第3题IPv6知识点理解有误", status: "pending" 
                      },
                      { 
                        id: 2, uid: "2024002", name: "李娜", 
                        answers: [
                          { questionId: 1, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 2, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 3, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 4, answer: 0, isCorrect: true, aiScore: 10, teacherScore: null, comment: "正确" },
                          { questionId: 5, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 6, answer: "三次握手：1.客户端发SYN；2.服务器发SYN+ACK；3.客户端发ACK", isCorrect: true, aiScore: 20, teacherScore: null, comment: "回答完整，逻辑清晰" },
                        ],
                        totalScore: 110, aiComments: "全部正确，表现优秀", status: "pending" 
                      },
                      { 
                        id: 3, uid: "2024003", name: "赵磊", 
                        answers: [
                          { questionId: 1, answer: 2, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，第一次握手只发送SYN" },
                          { questionId: 2, answer: 1, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，TCP是面向连接的" },
                          { questionId: 3, answer: 1, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，IPv4地址长度为32位" },
                          { questionId: 4, answer: 1, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，HTTP默认使用80端口" },
                          { questionId: 5, answer: 1, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，TCP连接释放需要4次握手" },
                          { questionId: 6, answer: "客户端和服务器互相发送确认", isCorrect: false, aiScore: 8, teacherScore: null, comment: "回答过于简略，缺少关键步骤" },
                        ],
                        totalScore: 8, aiComments: "选择题错误较多，需加强TCP/IP协议和网络基础学习", status: "pending" 
                      },
                      { 
                        id: 4, uid: "2024004", name: "陈小明", 
                        answers: [
                          { questionId: 1, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 2, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 3, answer: 0, isCorrect: true, aiScore: 20, teacherScore: null, comment: "正确" },
                          { questionId: 4, answer: 0, isCorrect: true, aiScore: 10, teacherScore: null, comment: "正确" },
                          { questionId: 5, answer: 1, isCorrect: false, aiScore: 0, teacherScore: null, comment: "错误，TCP连接释放需要4次握手" },
                          { questionId: 6, answer: "TCP三次握手：首先客户端发送SYN请求，服务器收到后回复SYN+ACK，最后客户端发送ACK确认", isCorrect: true, aiScore: 18, teacherScore: null, comment: "回答准确，表述清晰" },
                        ],
                        totalScore: 88, aiComments: "判断题全对，第5题关于TCP连接释放的知识点需要复习", status: "pending" 
                      },
                    ]);
                    setGradingStatus("done");
                    setSelectedStudentForGrading("2024001");
                  }, 2000);
                }} className="px-8 py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 font-medium">开始AI改卷</button>
              </div>
            )}

            {gradingStatus === "grading" && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-8">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="text-center">
                  <p className="text-base font-medium">AI正在批改试卷...</p>
                  <p className="text-sm text-muted-foreground mt-1">正在分析 {gradingResults.length + 1} / 4 份试卷</p>
                </div>
                <div className="w-80 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-3/4 animate-pulse" />
                </div>
              </div>
            )}

            {gradingStatus === "done" && (
              <div className="flex-1 flex flex-col">
                <div className="flex border-b border-border">
                  {[
                    { key: "paper", label: "试卷与答案", icon: FileText },
                    { key: "students", label: "学生答题", icon: Users },
                    { key: "review", label: "教师复核", icon: Eye },
                    { key: "analysis", label: "AI分析", icon: BarChart3 },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setGradingTab(tab.key as any)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        gradingTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-gray-900"
                      }`}>
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {gradingTab === "paper" && gradingExamId && (
                    <div className="space-y-4">
                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="font-medium text-sm mb-4">试卷详情</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">试卷名称</p>
                            <p className="text-sm font-medium">{mockExams.find(e => e.id === gradingExamId)?.name}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">课程</p>
                            <p className="text-sm font-medium">{mockExams.find(e => e.id === gradingExamId)?.course}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">题目数量</p>
                            <p className="text-sm font-medium">{mockExams.find(e => e.id === gradingExamId)?.questions.length} 题</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">满分</p>
                            <p className="text-sm font-medium">100 分</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="p-4 border-b border-border">
                          <h4 className="font-medium text-sm">标准答案</h4>
                        </div>
                        <div className="p-4 space-y-4">
                          {(mockExams.find(e => e.id === gradingExamId)?.questions || []).map((q, idx) => (
                            <div key={q.id} className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{idx + 1}</span>
                                <span className="text-xs text-muted-foreground">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "简答题"}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{q.type === "choice" ? "20分" : q.type === "judge" ? "10分" : "20分"}</span>
                              </div>
                              <p className="text-sm font-medium mb-3">{q.question}</p>
                              {q.options && (
                                <div className="space-y-1 mb-3">
                                  {q.options.map((opt, i) => (
                                    <div key={i} className={`px-3 py-2 rounded text-xs ${i === q.answer ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-muted"}`}>
                                      {String.fromCharCode(65 + i)}. {opt}
                                      {i === q.answer && <span className="ml-2">✓ 正确答案</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {q.type === "text" && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                  <p className="text-xs text-emerald-700 font-medium mb-1">参考答案</p>
                                  <p className="text-sm text-emerald-600">{q.answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {gradingTab === "students" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <select value={selectedStudentForGrading || ""} onChange={e => setSelectedStudentForGrading(e.target.value)}
                          className="px-3 py-2 border border-border rounded-md text-sm">
                          <option value="">选择学生查看答题详情</option>
                          {gradingResults.map(r => (
                            <option key={r.id} value={r.uid}>{r.name} · {r.uid}</option>
                          ))}
                        </select>
                        <div className="text-sm text-muted-foreground">
                          已批改 {gradingResults.length} 份试卷
                        </div>
                      </div>

                      {selectedStudentForGrading && (() => {
                        const studentResult = gradingResults.find(r => r.uid === selectedStudentForGrading);
                        const exam = mockExams.find(e => e.id === gradingExamId);
                        if (!studentResult || !exam) return null;
                        
                        return (
                          <div className="space-y-4">
                            <div className="bg-card rounded-lg border border-border p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User size={18} className="text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{studentResult.name}</p>
                                    <p className="text-xs text-muted-foreground">{studentResult.uid}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">AI评分</p>
                                  <p className={`text-2xl font-bold ${studentResult.totalScore >= 60 ? "text-emerald-600" : "text-red-600"}`}>
                                    {studentResult.totalScore} <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-700 font-medium mb-1">AI评语</p>
                                <p className="text-sm text-blue-600">{studentResult.aiComments}</p>
                              </div>
                            </div>

                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                              <div className="p-4 border-b border-border">
                                <h4 className="font-medium text-sm">学生答题详情</h4>
                              </div>
                              <div className="p-4 space-y-4">
                                {exam.questions.map((q, idx) => {
                                  const answer = studentResult.answers.find(a => a.questionId === q.id);
                                  return (
                                    <div key={q.id} className={`rounded-lg p-4 border ${answer?.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{idx + 1}</span>
                                        <span className="text-xs text-muted-foreground">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "简答题"}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">{q.type === "choice" ? "20分" : q.type === "judge" ? "10分" : "20分"}</span>
                                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${answer?.isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-red-200 text-red-700"}`}>
                                          {answer?.isCorrect ? "正确" : "错误"}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium mb-3">{q.question}</p>
                                      {q.options && (
                                        <div className="space-y-1 mb-3">
                                          {q.options.map((opt, i) => {
                                            let cls = "bg-muted rounded text-xs";
                                            if (i === q.answer) cls = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                                            else if (answer?.answer === i) cls = "bg-red-100 text-red-700 border border-red-200";
                                            return (
                                              <div key={i} className={`px-3 py-2 ${cls}`}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                                {i === q.answer && <span className="ml-2">✓ 正确答案</span>}
                                                {answer?.answer === i && i !== q.answer && <span className="ml-2">✗ 学生答案</span>}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {q.type === "text" && (
                                        <>
                                          <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-2">
                                            <p className="text-xs text-red-700 font-medium mb-1">学生答案</p>
                                            <p className="text-sm text-red-600">{answer?.answer || "未作答"}</p>
                                          </div>
                                          <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-3">
                                            <p className="text-xs text-emerald-700 font-medium mb-1">参考答案</p>
                                            <p className="text-sm text-emerald-600">{q.answer}</p>
                                          </div>
                                        </>
                                      )}
                                      <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">AI评语：{answer?.comment}</span>
                                        <span className={`text-sm font-semibold ${answer?.isCorrect ? "text-emerald-600" : "text-red-600"}`}>得分：{answer?.aiScore}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {gradingTab === "review" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <select value={selectedStudentForGrading || ""} onChange={e => setSelectedStudentForGrading(e.target.value)}
                          className="px-3 py-2 border border-border rounded-md text-sm">
                          <option value="">选择学生进行复核</option>
                          {gradingResults.map(r => (
                            <option key={r.id} value={r.uid}>{r.name} · {r.uid} · {r.status === "approved" ? "已确认" : "待复核"}</option>
                          ))}
                        </select>
                        <button onClick={() => {
                          setGradingResults(prev => prev.map(r => ({ ...r, status: "approved", answers: r.answers.map(a => ({ ...a, teacherScore: a.teacherScore || a.aiScore })) })));
                          showToastMsg("已确认所有AI评分");
                        }} className="px-4 py-2 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600">确认全部评分</button>
                      </div>

                      {selectedStudentForGrading && (() => {
                        const studentResult = gradingResults.find(r => r.uid === selectedStudentForGrading);
                        const exam = mockExams.find(e => e.id === gradingExamId);
                        if (!studentResult || !exam) return null;
                        
                        return (
                          <div className="space-y-4">
                            <div className="bg-card rounded-lg border border-border p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User size={18} className="text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{studentResult.name}</p>
                                    <p className="text-xs text-muted-foreground">{studentResult.uid}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">AI评分</p>
                                    <p className="text-lg font-bold text-emerald-600">{studentResult.totalScore}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">最终评分</p>
                                    <input type="number" value={studentResult.totalScore} onChange={e => {
                                      const newScore = parseInt(e.target.value) || 0;
                                      setGradingResults(prev => prev.map(r => r.id === studentResult.id ? { ...r, totalScore: newScore } : r));
                                    }} className="w-20 px-2 py-1 border border-border rounded text-sm text-center font-bold" />
                                  </div>
                                  {studentResult.status === "approved" ? (
                                    <Tag color="green">已确认</Tag>
                                  ) : (
                                    <button onClick={() => {
                                      setGradingResults(prev => prev.map(r => r.id === studentResult.id ? { ...r, status: "approved", answers: r.answers.map(a => ({ ...a, teacherScore: a.teacherScore || a.aiScore })) } : r));
                                      showToastMsg(`已确认${studentResult.name}的评分`);
                                    }} className="px-3 py-1.5 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600">确认评分</button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                              <div className="p-4 border-b border-border">
                                <h4 className="font-medium text-sm">逐题复核</h4>
                              </div>
                              <div className="p-4 space-y-4">
                                {exam.questions.map((q, idx) => {
                                  const answer = studentResult.answers.find(a => a.questionId === q.id);
                                  return (
                                    <div key={q.id} className="bg-muted/50 rounded-lg p-4">
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{idx + 1}</span>
                                        <span className="text-xs text-muted-foreground">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "简答题"}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">满分：{q.type === "choice" ? "20分" : q.type === "judge" ? "10分" : "20分"}</span>
                                      </div>
                                      <p className="text-sm font-medium mb-3">{q.question}</p>
                                      {q.options && (
                                        <div className="space-y-1 mb-3">
                                          {q.options.map((opt, i) => {
                                            let cls = "bg-muted rounded text-xs";
                                            if (i === q.answer) cls = "bg-emerald-100 text-emerald-700";
                                            else if (answer?.answer === i) cls = "bg-red-100 text-red-700";
                                            return (
                                              <div key={i} className={`px-3 py-2 ${cls}`}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {q.type === "text" && (
                                        <div className="mb-3">
                                          <p className="text-xs text-muted-foreground mb-1">学生答案</p>
                                          <p className="text-sm">{answer?.answer || "未作答"}</p>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between bg-card rounded-lg p-3">
                                        <div className="flex items-center gap-4">
                                          <span className="text-xs text-muted-foreground">AI评分：<span className="font-semibold text-emerald-600">{answer?.aiScore}</span></span>
                                          <span className="text-xs text-muted-foreground">AI评语：{answer?.comment}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">修改分数：</span>
                                          <input type="number" value={answer?.teacherScore || answer?.aiScore} onChange={e => {
                                            const newScore = parseInt(e.target.value) || 0;
                                            setGradingResults(prev => prev.map(r => {
                                              if (r.id !== studentResult.id) return r;
                                              return {
                                                ...r,
                                                answers: r.answers.map(a => a.questionId === q.id ? { ...a, teacherScore: newScore } : a),
                                                totalScore: r.answers.reduce((sum, a) => sum + (a.teacherScore || a.aiScore), 0)
                                              };
                                            }));
                                          }} className="w-20 px-2 py-1 border border-border rounded text-sm text-center" />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {gradingTab === "analysis" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card rounded-lg border border-border p-4">
                          <p className="text-xs text-muted-foreground">参考人数</p>
                          <p className="text-2xl font-bold text-primary mt-1">{gradingResults.length}</p>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-4">
                          <p className="text-xs text-muted-foreground">平均分</p>
                          <p className="text-2xl font-bold text-emerald-600 mt-1">
                            {Math.round(gradingResults.reduce((sum, r) => sum + r.totalScore, 0) / gradingResults.length)}
                          </p>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-4">
                          <p className="text-xs text-muted-foreground">最高分</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {Math.max(...gradingResults.map(r => r.totalScore))}
                          </p>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-4">
                          <p className="text-xs text-muted-foreground">不及格人数</p>
                          <p className="text-2xl font-bold text-red-600 mt-1">
                            {gradingResults.filter(r => r.totalScore < 60).length}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-card rounded-lg border border-border p-4">
                          <h4 className="font-medium text-sm mb-4">各题正确率</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={[
                              { name: "第1题", correct: 3, total: 4, rate: 75 },
                              { name: "第2题", correct: 3, total: 4, rate: 75 },
                              { name: "第3题", correct: 2, total: 4, rate: 50 },
                              { name: "第4题", correct: 3, total: 4, rate: 75 },
                              { name: "第5题", correct: 2, total: 4, rate: 50 },
                              { name: "第6题", correct: 3, total: 4, rate: 75 },
                            ]}>
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(v: any) => `${v}%`} />
                              <Bar dataKey="rate" fill="#1A56DB" radius={[4, 4, 0, 0]}>
                                {[75, 75, 50, 75, 50, 75].map((v, i) => (
                                  <Cell key={`cell-${i}`} fill={v >= 70 ? "#10B981" : v >= 50 ? "#F59E0B" : "#EF4444"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-card rounded-lg border border-border p-4">
                          <h4 className="font-medium text-sm mb-4">分数分布</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={[
                                { name: "90分以上", value: 1 },
                                { name: "70-89分", value: 2 },
                                { name: "60-69分", value: 0 },
                                { name: "60分以下", value: 1 },
                              ]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                                {[{ fill: "#10B981" }, { fill: "#1A56DB" }, { fill: "#F59E0B" }, { fill: "#EF4444" }].map((c, i) => (
                                  <Cell key={`cell-${i}`} {...c} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg border border-border p-4">
                        <h4 className="font-medium text-sm mb-4">AI学习分析与建议</h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">1</div>
                            <div>
                              <p className="text-sm font-medium">整体表现分析</p>
                              <p className="text-xs text-muted-foreground mt-1">本次考试整体平均分 {Math.round(gradingResults.reduce((sum, r) => sum + r.totalScore, 0) / gradingResults.length)} 分，及格率 75%。大部分学生对TCP/IP基础和HTTP协议掌握较好，但在IPv6地址和TCP连接释放等知识点上存在明显薄弱。</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-medium flex-shrink-0">2</div>
                            <div>
                              <p className="text-sm font-medium">薄弱知识点</p>
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg">
                                  <span className="text-xs">IPv6地址长度</span>
                                  <span className="text-xs font-semibold text-red-600">正确率 50%</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg">
                                  <span className="text-xs">TCP连接释放过程</span>
                                  <span className="text-xs font-semibold text-red-600">正确率 50%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium flex-shrink-0">3</div>
                            <div>
                              <p className="text-sm font-medium">教学改进建议</p>
                              <p className="text-xs text-muted-foreground mt-1">建议增加IPv6和TCP连接释放相关的练习题和讲解视频，组织一次专题复习课。对于不及格学生，建议进行一对一辅导，了解学习困难所在。</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium flex-shrink-0">4</div>
                            <div>
                              <p className="text-sm font-medium">学生个性化建议</p>
                              <p className="text-xs text-muted-foreground mt-1">赵磊同学需要重点关注，多项基础知识点掌握薄弱，建议安排助教进行针对性辅导。张伟同学整体表现良好，建议挑战更高难度的题目。</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: Notification (通知中心) ──────────────────────────────────────────
function TeacherNotification() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationType, setNotificationType] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [useScheduledSend, setUseScheduledSend] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifRecipientScope, setNotifRecipientScope] = useState("COURSE");
  const [notifCourseId, setNotifCourseId] = useState<number | null>(null);

  // API state
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    getMyNotifications(1, 100).then(data => {
      setNotifications(data.records || []);
    }).catch(() => {}).finally(() => setLoadingNotifs(false));
  }, []);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const notificationTemplates = [
    { id: "homework", name: "作业发布提醒", title: "作业发布通知", content: "亲爱的同学，{{班级名称}}的{{作业名称}}已发布，请按时完成并提交。截止时间：{{截止时间}}。如有疑问，请及时联系任课教师。" },
    { id: "exam", name: "考试提醒", title: "考试通知", content: "亲爱的同学，{{考试名称}}将于{{考试时间}}开始，请提前做好准备，准时参加考试。考试地点：{{考试地点}}。" },
    { id: "warning", name: "预警提醒", title: "学习预警通知", content: "尊敬的同学，根据数据分析，你近期的{{预警类型}}情况需要关注。请及时调整学习状态，如有困难可联系任课教师寻求帮助。" },
    { id: "general", name: "通用通知", title: "重要通知", content: "各位同学：\n\n{{通知内容}}\n\n请大家相互转告，如有疑问请联系任课教师。" },
  ];

  const applyTemplate = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setShowTemplateModal(false);
      showToastMsg(`已应用模板：${template.name}`);
    }
  };

  const handleSendNotification = async () => {
    if (useScheduledSend && !scheduledTime) {
      showToastMsg("请设置定时发送时间");
      return;
    }
    try {
      await sendNotification({
        title: notifTitle || currentTemplate?.title || "通知",
        content: notifContent || currentTemplate?.content || "",
        recipientScope: notifRecipientScope,
        courseId: notifCourseId || undefined,
      });
      showToastMsg(useScheduledSend ? "定时通知已安排" : "通知已发送");
      // Refresh list
      getMyNotifications(1, 100).then(data => setNotifications(data.records || []));
    } catch { showToastMsg("发送失败"); }
    setShowSendModal(false);
    setUseScheduledSend(false);
    setScheduledTime("");
    setSelectedTemplate(null);
    setNotifTitle("");
    setNotifContent("");
  };

  const currentTemplate = notificationTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">通知中心</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">
            <FileText size={14} />模板管理
          </button>
          <button onClick={() => setShowSendModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
            <Plus size={14} />发送通知
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setNotificationType(null)} className={`px-4 py-2 rounded-md text-sm ${!notificationType ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>全部</button>
        <button onClick={() => setNotificationType("system")} className={`px-4 py-2 rounded-md text-sm ${notificationType === "system" ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>系统预警</button>
        <button onClick={() => setNotificationType("manual")} className={`px-4 py-2 rounded-md text-sm ${notificationType === "manual" ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>手动发送</button>
      </div>

      <div className="space-y-3">
        {loadingNotifs ? (
          <p className="text-center text-sm text-muted-foreground py-8">加载中...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">暂无通知</p>
        ) : notifications.filter(n => notificationType ? (notificationType === "system" ? n.senderName === "系统" : n.senderName !== "系统") : true).map(n => (
          <div key={n.id} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.createTime}</p>
                <p className="text-xs text-muted-foreground">{n.content}</p>
              </div>
              <Tag color={n.senderName === "系统" ? "red" : "blue"}>
                {n.senderName === "系统" ? "系统预警" : "手动发送"}
              </Tag>
            </div>
          </div>
        ))}
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">发送通知</h3>
              <button onClick={() => setShowSendModal(false)}><X size={16} /></button>
            </div>
            {selectedTemplate && (
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                当前使用模板：{currentTemplate?.name}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">收件人</label>
              <select className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option>全部班级</option>
                <option>高等数学A · 2024级1班</option>
                <option>高等数学A · 2024级2班</option>
                <option>线性代数 · 2024级1班</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">标题</label>
                {!selectedTemplate && (
                  <button onClick={() => setShowTemplateModal(true)} className="text-xs text-primary hover:underline">从模板选择</button>
                )}
              </div>
              <input type="text" defaultValue={currentTemplate?.title} className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="请输入通知标题" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">正文</label>
              <textarea defaultValue={currentTemplate?.content} className="mt-1 w-full px-3 py-2 border border-border rounded-md text-sm h-32 resize-none" placeholder="请输入通知内容" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={useScheduledSend} onChange={e => setUseScheduledSend(e.target.checked)} className="rounded" />
              <label className="text-sm">定时发送</label>
              {useScheduledSend && (
                <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="px-3 py-1.5 text-sm border border-border rounded-md" />
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSendModal(false); setSelectedTemplate(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={handleSendNotification} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
                {useScheduledSend ? "定时发送" : "立即发送"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">通知模板</h3>
              <button onClick={() => setShowTemplateModal(false)}><X size={16} /></button>
            </div>
            <p className="text-xs text-muted-foreground">选择一个模板，占位符如{{班级名称}}将在发送时自动替换</p>
            <div className="space-y-3">
              {notificationTemplates.map(t => (
                <div key={t.id} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{t.name}</span>
                    <button onClick={() => applyTemplate(t.id)} className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-blue-700">使用模板</button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTemplateModal(false)} className="w-full py-2 border border-border rounded-md text-sm">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: Operation Logs (操作日志) ───────────────────────────────────────
function TeacherOperationLogs() {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [revokedIds, setRevokedIds] = useState<Set<number>>(new Set());
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokingLog, setRevokingLog] = useState<typeof teacherOperationLogs[0] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const classOptions = ["2024级1班", "2024级2班"];
  const typeOptions = [
    { value: "exam", label: "考试管理", icon: FileText },
    { value: "grading", label: "批改作业", icon: Edit2 },
    { value: "notification", label: "发送通知", icon: Bell },
    { value: "ai", label: "AI操作", icon: Brain },
    { value: "import", label: "数据导入", icon: Upload },
    { value: "view", label: "查看操作", icon: Eye },
    { value: "suggestion", label: "学习建议", icon: Target },
  ];

  const filteredLogs = teacherOperationLogs.filter(log => {
    if (search && !log.user.includes(search) && !log.action.includes(search) && !log.detail.includes(search)) return false;
    if (filterClass && log.class !== filterClass) return false;
    if (filterType && log.type !== filterType) return false;
    return true;
  });

  const roleColor = (role: string) => role === "teacher" ? "blue" : "purple";
  const roleText = (role: string) => role === "teacher" ? "教师" : "助教";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">操作日志</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-border rounded-md text-sm w-64" placeholder="搜索操作日志..." />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">班级筛选:</span>
          <select value={filterClass || ""} onChange={e => setFilterClass(e.target.value || null)}
            className="px-3 py-2 border border-border rounded-md text-sm">
            <option value="">全部班级</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">操作类型:</span>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-md text-xs ${!filterType ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>全部</button>
            {typeOptions.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => setFilterType(filterType === t.value ? null : t.value)}
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${filterType === t.value ? "bg-primary text-white" : "bg-muted hover:bg-accent"}`}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["时间", "操作用户", "角色", "班级", "操作类型", "操作内容", "详情", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const isRevoked = revokedIds.has(log.id);
              const isAssistant = log.role === "teaching-assistant";
              return (
                <tr key={log.id} className={`border-b border-border last:border-0 ${isRevoked ? "opacity-50" : "hover:bg-accent/30"}`}>
                  <td className={`px-4 py-3 font-mono text-xs text-muted-foreground ${isRevoked ? "line-through" : ""}`}>{log.time}</td>
                  <td className={`px-4 py-3 font-medium ${isRevoked ? "line-through text-muted-foreground" : ""}`}>{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Tag color={roleColor(log.role)}>{roleText(log.role)}</Tag>
                      {isRevoked && <Tag color="gray">已撤回</Tag>}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs text-muted-foreground ${isRevoked ? "line-through" : ""}`}>{log.class}</td>
                  <td className={`px-4 py-3 ${isRevoked ? "line-through text-muted-foreground" : ""}`}>
                    {typeOptions.find(t => t.value === log.type) && (
                      <span className={isRevoked ? "text-xs" : "text-xs text-primary"}>{typeOptions.find(t => t.value === log.type)?.label}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${isRevoked ? "line-through text-muted-foreground" : ""}`}>{log.action}</td>
                  <td className={`px-4 py-3 text-xs text-muted-foreground ${isRevoked ? "line-through" : ""}`}>{log.detail}</td>
                  <td className="px-4 py-3">
                    {isAssistant && !isRevoked && (
                      <button onClick={() => { setRevokingLog(log); setShowRevokeModal(true); }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                        <RotateCcw size={12} />撤回
                      </button>
                    )}
                    {isRevoked && (
                      <span className="text-xs text-muted-foreground">已撤回</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      {showRevokeModal && revokingLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-semibold">确认撤回操作</h3>
                <p className="text-xs text-muted-foreground">撤回后将恢复操作前的状态</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作用户</span>
                <span className="text-sm font-medium">{revokingLog.user}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作时间</span>
                <span className="text-sm font-medium">{revokingLog.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作类型</span>
                <span className="text-sm font-medium">{typeOptions.find(t => t.value === revokingLog.type)?.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">操作内容</span>
                <span className="text-sm font-medium">{revokingLog.action}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">详情</span>
                <span className="text-sm text-muted-foreground">{revokingLog.detail}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRevokeModal(false); setRevokingLog(null); }} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => {
                setRevokedIds(prev => new Set([...prev, revokingLog!.id]));
                setShowRevokeModal(false);
                setRevokingLog(null);
                showToastMsg("已撤回助教操作");
              }} className="flex-1 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">确认撤回</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center text-xs text-muted-foreground">
        显示 {filteredLogs.length} 条记录，共 {teacherOperationLogs.length} 条
      </div>
    </div>
  );
}

// ─── Teacher: Quiz Review ─────────────────────────────────────────────────────
function TeacherQuizReview() {
  const [selected, setSelected] = useState<typeof quizItems[0] | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["课程", "题目预览", "知识点", "难度", "状态", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quizItems.map(q => (
              <tr key={q.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                <td className="px-4 py-3"><Tag color="blue">{q.course}</Tag></td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{q.preview}</td>
                <td className="px-4 py-3"><Tag color="gray">{q.topic}</Tag></td>
                <td className="px-4 py-3">{diffLabel(q.difficulty)}</td>
                <td className="px-4 py-3">{statusLabel(q.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(q)} className="text-primary hover:underline text-xs">审核</button>
                    {q.status === "pending" && (
                      <>
                        <button className="text-emerald-600 hover:underline text-xs">通过</button>
                        <button className="text-red-500 hover:underline text-xs">驳回</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">题目审核</h3>
              <button onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Tag color="blue">{selected.course}</Tag>
                <Tag color="gray">{selected.topic}</Tag>
                {diffLabel(selected.difficulty)}
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="font-medium text-sm">{selected.preview}</p>
              </div>
              <div className="space-y-1.5">
                {["A. 选项一（参考答案）", "B. 选项二", "C. 选项三", "D. 选项四"].map((o, i) => (
                  <div key={i} className={`px-3 py-2 rounded text-sm ${i === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                    {o}
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 rounded p-3 text-xs text-blue-700">
                <strong>解析：</strong>根据微分方程求解原理，正确答案为A。
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-border rounded-md text-sm text-red-500 hover:bg-red-50">驳回</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">编辑</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">通过</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Student: Dashboard ───────────────────────────────────────────────────────
function StudentDashboard({ onNav }: { onNav: (p: Page) => void }) {
  const currentUser = getCurrentUser();
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [studentOverview, setStudentOverview] = useState<StudentOverview | null>(null);
  const [scoreTrends, setScoreTrends] = useState<any[]>([]);
  const [pendingExamList, setPendingExamList] = useState<ExamPaper[]>([]);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    getStudentOverview(selectedCourseId).then(data => {
      setStudentOverview(data);
    }).catch(() => {
      setStudentOverview(null);
    });
    getStudentTrends(selectedCourseId).then(data => {
      setScoreTrends(data);
    }).catch(() => {
      setScoreTrends([]);
    });
    getPendingExams().then(data => {
      setPendingExamList(data);
    }).catch(() => {
      setPendingExamList([]);
    });
  }, [selectedCourseId]);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);
  const courseScoreTrend = scoreTrends.length > 0 ? scoreTrends.map((t: any) => ({ exam: t.name, score: t.score || 0, classAvg: t.classAvg || 0 })) : [];
  const pendingExams = pendingExamList.length;

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  const studentName = currentUser?.displayName || "同学";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">你好，{studentName} 👋</h2>
            <p className="text-blue-100 text-sm mt-1">{selectedCourse?.semester || ""} · {selectedCourse?.className || ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200">当前课程</span>
            <div className="relative">
              <select value={selectedCourseId || ""} onChange={e => handleCourseChange(parseInt(e.target.value))}
                className="appearance-none bg-white/20 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
                {studentCourses.map(c => (
                  <option key={c.id} value={c.id} className="text-gray-900">
                    {c.courseName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-white pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div>
            <p className="text-xs text-blue-200">授课教师</p>
            <p className="font-medium">{selectedCourse?.teacherName || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard count={studentOverview?.currentScore ?? "—"} label="当前成绩" icon={Target} color="blue" />
        <StatCard count={`${studentOverview?.attendanceRate ?? 0}%`} label="出勤率" icon={Activity} color="green" />
        <StatCard count={`${studentOverview?.homeworkRate ?? 0}%`} label="作业提交率" icon={CheckCircle} color="purple" />
        <StatCard count={pendingExams} label="待完成考试" icon={Clock} color="orange" />
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">成绩趋势</h3>
          <span className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""}</span>
        </div>
        {courseScoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={courseScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="我的成绩" />
              <Line type="monotone" dataKey="classAvg" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">暂无成绩数据</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">待参加考试</h3>
          <div className="space-y-3">
            {pendingExamList.filter(e => e.status === "pending").map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""} · {e.duration}分钟</p>
                </div>
                <div className="text-right">
                  <button onClick={() => onNav("student-exam")} className="mt-1 px-3 py-1 text-xs bg-primary text-white rounded hover:bg-blue-700">
                    参加考试
                  </button>
                </div>
              </div>
            ))}
            {pendingExamList.filter(e => e.status === "pending").length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">暂无待参加考试</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">预警提示</h3>
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground py-4">暂无预警提示</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-medium text-sm mb-4">快捷入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: User, label: "我的画像", page: "student-profile" as Page, color: "blue" },
            { icon: TrendingUp, label: "成绩趋势", page: "student-score-trend" as Page, color: "green" },
            { icon: BookOpen, label: "错题本", page: "student-wrong-book" as Page, color: "purple" },
            { icon: Clock, label: "在线考试", page: "student-exam" as Page, color: "orange" },
            { icon: Brain, label: "学习建议", page: "student-profile" as Page, color: "cyan" },
            { icon: FileText, label: "课程资料", page: "student-profile" as Page, color: "pink" },
          ].map(item => (
            <button key={item.label} onClick={() => onNav(item.page)}
              className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg hover:bg-accent transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color === "blue" ? "bg-blue-50 text-blue-600" : item.color === "green" ? "bg-green-50 text-green-600" : item.color === "purple" ? "bg-purple-50 text-purple-600" : item.color === "orange" ? "bg-orange-50 text-orange-600" : item.color === "cyan" ? "bg-cyan-50 text-cyan-600" : "bg-pink-50 text-pink-600"}`}>
                <item.icon size={18} />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Student: Profile ─────────────────────────────────────────────────────────
function StudentProfile() {
  const [toast, setToast] = useState<string | null>(null);
  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const gradeLabel = (score: number | null) => {
    if (!score) return { label: "待录入", color: "gray" };
    if (score >= 90) return { label: "优秀", color: "green" };
    if (score >= 80) return { label: "良好", color: "blue" };
    if (score >= 70) return { label: "中等", color: "yellow" };
    if (score >= 60) return { label: "及格", color: "orange" };
    return { label: "不及格", color: "red" };
  };

  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    getMyPortrait(selectedCourseId).then(data => {
      setProfile(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const text = await generateMyAiSuggestions(selectedCourseId!);
      setProfile(prev => prev ? { ...prev, aiSuggestions: text } : null);
      showToastMsg("AI学习建议已生成");
    } catch { showToastMsg("AI学习建议生成失败"); }
    finally { setGeneratingSuggestions(false); }
  };

  const learningSuggestions: LearningSuggestion[] = profile?.aiSuggestions
    ? (() => {
        try {
          const parsed = JSON.parse(profile.aiSuggestions);
          return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
      })()
    : [];

  const profileName = profile?.name || "我";
  const profileStudentNo = profile?.studentNo || "";
  const profileCollege = profile?.college || "";
  const profileClassName = profile?.className || "";
  const knowledgeData = profile?.knowledgeRadar?.map(k => ({ subject: k.name, value: Number(k.value) || 0 })) || [];
  const scoreTrend = profile?.scoreTrendList?.[0]?.semesters.map((sem, i) => ({
    exam: sem, score: Number(profile?.scoreTrendList![0].overallScores[i] || 0), classAvg: 75,
  })) || [];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">我的画像</h2>
              <p className="text-blue-100 text-sm mt-1">{profileName} · 学号：{profileStudentNo}</p>
              <p className="text-blue-200 text-xs">{profileCollege} · {profileClassName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200">选择课程</span>
            <div className="relative">
              <select value={selectedCourseId || ""} onChange={e => handleCourseChange(parseInt(e.target.value))}
                className="appearance-none bg-white/20 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
                {studentCourses.map(c => (
                  <option key={c.id} value={c.id} className="text-gray-900">
                    {c.courseName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-white pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">当前成绩</p>
          <p className="font-mono text-2xl font-bold text-primary mt-1">{profile?.totalScore != null ? profile.totalScore.toFixed(1) : "—"}</p>
          <Tag color={gradeLabel(profile?.totalScore ?? 0).color as any} className="mt-2">{gradeLabel(profile?.totalScore ?? 0).label}</Tag>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">出勤率</p>
          <p className="font-mono text-2xl font-bold text-emerald-600 mt-1">{profile?.attendanceRate != null ? profile.attendanceRate.toFixed(1) + "%" : "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">{profile?.absentCount === 0 ? "全勤" : `缺勤${profile?.absentCount}次`}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">作业提交率</p>
          <p className="font-mono text-2xl font-bold text-blue-600 mt-1">{profile?.homeworkRate != null ? profile.homeworkRate.toFixed(1) + "%" : "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">按时提交</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">班级排名</p>
          <p className="font-mono text-2xl font-bold text-purple-600 mt-1">{profile?.classRank && profile?.classTotal ? `${profile.classRank}/${profile.classTotal}` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">共{profile?.classTotal ?? 0}人</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">知识点掌握度</h3>
            <span className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""}</span>
          </div>
          <div className="space-y-3">
            {knowledgeData.map(k => (
              <div key={k.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={k.value < 60 ? "text-red-600 font-medium" : ""}>{k.subject}</span>
                  <span className={`font-mono text-xs ${k.value < 60 ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                    {k.value}% {k.value < 60 && "⚠"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${k.value < 60 ? "bg-red-500" : k.value < 75 ? "bg-yellow-500" : "bg-emerald-500"}`}
                    style={{ width: `${k.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">能力雷达图</h3>
            <span className="text-xs text-muted-foreground">综合评估</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={knowledgeData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="#1A56DB" fill="#1A56DB" fillOpacity={0.2} name="掌握度" />
              <Tooltip formatter={(v: any) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-medium text-sm mb-4">课程成绩详情</h3>
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">{selectedCourse?.courseName || "—"}</p>
              <p className="text-xs text-muted-foreground">{selectedCourse?.teacherName || ""} · {selectedCourse?.courseNo || ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">总评成绩</p>
              <p className="font-mono text-2xl font-bold text-primary mt-1">{profile?.totalScore != null ? profile.totalScore.toFixed(1) : "—"}</p>
            </div>
            <Tag color={gradeLabel(profile?.totalScore ?? 0).color as any}>{gradeLabel(profile?.totalScore ?? 0).label}</Tag>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">学习行为分析</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "本周学习时长", value: "12.5小时", trend: "+8%" },
              { label: "完成练习题数", value: "48道", trend: "+15%" },
              { label: "错题订正率", value: "78%", trend: "-5%" },
              { label: "访问课程资源", value: "23次", trend: "+12%" },
            ].map(item => (
              <div key={item.label} className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-mono text-xl font-bold mt-1">{item.value}</p>
                <p className={`text-xs mt-1 ${item.trend.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
                  {item.trend} 较上周
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="font-medium text-sm mb-4">AI个性化学习建议</h3>
          <div className="space-y-3">
            {learningSuggestions.length > 0 ? (
              learningSuggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    s.type === "strong" ? "bg-green-100 text-green-700" : 
                    s.type === "weak" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {s.type === "strong" ? "优" : s.type === "weak" ? "弱" : "改"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Brain size={32} className="mb-2 opacity-50" />
                <p className="text-sm">点击下方按钮生成AI学习建议</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={handleGenerateSuggestions}
              disabled={generatingSuggestions}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {generatingSuggestions ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Brain size={14} />
                  {learningSuggestions.length > 0 ? "更新建议" : "生成学习建议"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-sm">课程资料</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: "video", title: "第1章：计算机网络概述", size: "45分钟", icon: Play },
                { type: "video", title: "第2章：物理层", size: "52分钟", icon: Play },
                { type: "video", title: "第3章：数据链路层", size: "58分钟", icon: Play },
                { type: "pdf", title: "课程讲义（完整版）", size: "3.2MB", icon: FileText },
                { type: "pdf", title: "习题集及答案", size: "1.8MB", icon: FileText },
                { type: "code", title: "实验代码示例", size: "56KB", icon: Code },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === "video" ? "bg-red-50 text-red-600" : item.type === "pdf" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.size}</p>
                  </div>
                  <Download size={14} className="text-muted-foreground hover:text-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Student: Score Trend ──────────────────────────────────────────────────────
function StudentScoreTrend() {
  const [showClassAvg, setShowClassAvg] = useState(true);
  const [apiTrends, setApiTrends] = useState<{ exam: string; score: number; classAvg: number }[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadingTrends(true);
    getStudentTrends(selectedCourseId).then(data => {
      if (data && data.length > 0) {
        setApiTrends(data.map(item => ({
          exam: item.name,
          score: typeof item.score === 'number' ? item.score : 0,
          classAvg: typeof item.classAvg === 'number' ? item.classAvg : 0,
        })));
      } else {
        setApiTrends([]);
      }
    }).catch(() => setApiTrends([])).finally(() => setLoadingTrends(false));
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  const courseScoreTrend = apiTrends;

  const stats = courseScoreTrend.length > 0 ? {
    max: Math.max(...courseScoreTrend.map(s => s.score)),
    min: Math.min(...courseScoreTrend.map(s => s.score)),
    avg: Math.round(courseScoreTrend.reduce((sum, s) => sum + s.score, 0) / courseScoreTrend.length),
    std: Math.round(Math.sqrt(courseScoreTrend.reduce((sum, s) => sum + Math.pow(s.score - (courseScoreTrend.reduce((sum, s) => sum + s.score, 0) / courseScoreTrend.length), 2), 0) / courseScoreTrend.length) * 10) / 10,
  } : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">成绩趋势分析</h2>
            <p className="text-blue-100 text-sm mt-1">{selectedCourse?.courseName || ""}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-200">选择课程</span>
              <div className="relative">
                <select value={selectedCourseId || ""} onChange={e => handleCourseChange(parseInt(e.target.value))}
                  className="appearance-none bg-white/20 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
                  {studentCourses.map(c => (
                    <option key={c.id} value={c.id} className="text-gray-900">
                      {c.courseName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-2.5 text-white pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showClassAvg} onChange={e => setShowClassAvg(e.target.checked)} className="rounded" />
                显示班级均值
              </label>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">最高分</p>
            <p className="font-mono text-2xl font-bold text-primary mt-1">{stats.max}</p>
            <p className="text-xs text-muted-foreground mt-1">{courseScoreTrend.find(s => s.score === stats.max)?.exam}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">最低分</p>
            <p className="font-mono text-2xl font-bold text-red-600 mt-1">{stats.min}</p>
            <p className="text-xs text-muted-foreground mt-1">{courseScoreTrend.find(s => s.score === stats.min)?.exam}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">平均分</p>
            <p className="font-mono text-2xl font-bold text-blue-600 mt-1">{stats.avg}</p>
            <p className="text-xs text-muted-foreground mt-1">{courseScoreTrend.length}次考试</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">标准差</p>
            <p className="font-mono text-2xl font-bold text-purple-600 mt-1">{stats.std}</p>
            <p className="text-xs text-muted-foreground mt-1">成绩波动</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">成绩变化趋势</h3>
          <span className="text-xs text-muted-foreground">{selectedCourse?.courseName || ""}</span>
        </div>
        {courseScoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={courseScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${v}分`} />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#1A56DB" strokeWidth={2} dot={{ r: 4 }} name="我的成绩" />
              {showClassAvg && (
                <Line type="monotone" dataKey="classAvg" stroke="#94A3B8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="班级均值" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">暂无成绩数据</p>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="font-medium text-sm">成绩详情</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">考试名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">我的分数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">班级均分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">与均值差值</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">变化趋势</th>
              </tr>
            </thead>
            <tbody>
              {courseScoreTrend.map((item, i) => {
                const diff = item.score - item.classAvg;
                const prevScore = i > 0 ? courseScoreTrend[i - 1].score : null;
                const trend = prevScore !== null ? (item.score - prevScore >= 0 ? `+${item.score - prevScore}` : item.score - prevScore) : "-";
                return (
                  <tr key={item.exam} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{item.exam}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{item.score}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{item.classAvg}</td>
                    <td className={`px-4 py-3 font-mono ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {diff >= 0 ? "+" : ""}{diff}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${prevScore !== null && item.score >= prevScore ? "text-emerald-600" : prevScore !== null ? "text-red-600" : "text-muted-foreground"}`}>
                      {trend}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Student: Wrong Book ───────────────────────────────────────────────────────
function StudentWrongBook() {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceQuestionsList, setPracticeQuestionsList] = useState<any[]>([]);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [showAddWrongModal, setShowAddWrongModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [apiWrongQuestions, setApiWrongQuestions] = useState<any[]>([]);
  const [loadingWrong, setLoadingWrong] = useState(true);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    getStudentCourses().then(courses => {
      setStudentCourses(courses);
      if (courses.length > 0) {
        const saved = localStorage.getItem("selectedCourseId");
        const savedId = saved ? parseInt(saved) : null;
        const found = savedId && courses.find(c => c.id === savedId);
        setSelectedCourseId(found ? savedId! : courses[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourseId) return;
    getStudentWrongQuestions(selectedCourseId).then(data => {
      if (data && data.length > 0) {
        setApiWrongQuestions(data.map(q => ({
          id: q.id,
          course: q.courseName || selectedCourse?.courseName || "",
          chapter: q.knowledgePoint || "未知",
          section: q.knowledgePoint || "",
          question: q.questionContent,
          type: "choice",
          options: ["A", "B", "C", "D"],
          myAnswer: q.studentAnswer ? 0 : -1,
          correctAnswer: q.correctAnswer ? 0 : 0,
          explain: "",
        })));
      }
    }).catch(() => {}).finally(() => setLoadingWrong(false));
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
    setSelectedChapter(null);
    setSelectedSection(null);
  };

  const toggleCourse = (name: string) => {
    setExpandedCourses(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allQuestions = apiWrongQuestions;
  const filteredQuestions = allQuestions.filter(q => {
    if (q.course !== selectedCourse?.courseName) return false;
    if (!selectedChapter && !selectedSection) return true;
    if (selectedChapter && q.chapter !== selectedChapter) return false;
    if (selectedSection && q.section !== selectedSection) return false;
    return true;
  });

  const startPractice = (question: any) => {
    setPracticeQuestionsList([
      { ...question, isOriginal: true },
      {
        id: 999, type: "choice", topic: question.chapter,
        question: `与 "${question.section}" 相关的练习题：求微分方程 y' - 2y = 4 的通解？`,
        options: ["y = Ce^{2x} - 2", "y = Ce^{-2x} + 2", "y = Ce^{2x} + 2", "y = Ce^{-2x} - 2"],
        answer: 0, explain: "一阶线性微分方程，积分因子 e^{-2x}，求解得 y = Ce^{2x} - 2。",
      },
    ]);
    setPracticeMode(true);
    setPracticeIdx(0);
    setPracticeAnswers({});
  };

  const handlePracticeAnswer = (qIdx: number, answer: number) => {
    setPracticeAnswers(prev => ({ ...prev, [qIdx]: answer }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">错题本</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">选择课程</span>
            <div className="relative">
              <select value={selectedCourseId || ""} onChange={e => handleCourseChange(parseInt(e.target.value))}
                className="appearance-none bg-card border border-border px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                {studentCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.courseName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">共 {filteredQuestions.length} 道错题</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddWrongModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-sm rounded-md hover:bg-accent">
              <Plus size={14} />手动添加
            </button>
            <button onClick={() => setShowAIGenerateModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-blue-700">
              <Brain size={14} />AI生成相似题
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 bg-card rounded-lg border border-border p-4">
          <h3 className="font-medium text-sm mb-3">知识点筛选</h3>
          <div className="space-y-2">
            {wrongQuestionCategories.filter(c => c.name === selectedCourse.name).map(course => (
              <div key={course.name}>
                <button onClick={() => toggleCourse(course.name)} className="w-full flex items-center justify-between text-left text-sm hover:bg-accent rounded px-2 py-1">
                  <span>{course.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${expandedCourses[course.name] ? "rotate-180" : ""}`} />
                </button>
                {expandedCourses[course.name] && (
                  <div className="ml-2 mt-1 space-y-1">
                    {course.chapters.map(chapter => (
                      <div key={chapter.name}>
                        <button onClick={() => {
                          toggleChapter(`${course.name}-${chapter.name}`);
                          setSelectedChapter(chapter.name);
                          setSelectedSection(null);
                        }} className={`w-full flex items-center justify-between text-left text-xs hover:bg-accent rounded px-2 py-1 ${selectedChapter === chapter.name ? "bg-primary/10 text-primary" : ""}`}>
                          <span>{chapter.name}</span>
                          <ChevronDown size={12} className={`transition-transform ${expandedChapters[`${course.name}-${chapter.name}`] ? "rotate-180" : ""}`} />
                        </button>
                        {expandedChapters[`${course.name}-${chapter.name}`] && (
                          <div className="ml-2 mt-1 space-y-1">
                            {chapter.sections.map(section => (
                              <button key={section} onClick={() => setSelectedSection(selectedSection === section ? null : section)}
                                className={`w-full text-left text-xs hover:bg-accent rounded px-2 py-1 ${selectedSection === section ? "bg-primary/10 text-primary" : ""}`}>
                                {section}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {(selectedChapter || selectedSection) && (
            <button onClick={() => { setSelectedChapter(null); setSelectedSection(null); }} className="mt-4 w-full py-2 text-xs border border-border rounded hover:bg-accent">
              清除筛选
            </button>
          )}
        </div>

        <div className="lg:col-span-3 bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-medium text-sm">错题列表</h3>
          </div>
          <div className="divide-y divide-border">
            {filteredQuestions.map(q => (
              <div key={q.id} className="p-4 hover:bg-accent/30 cursor-pointer" onClick={() => setSelectedQuestion(q)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color="blue">{q.course}</Tag>
                      <Tag color="gray">{q.chapter}</Tag>
                      <Tag color="green">{q.type === "choice" ? "选择题" : "判断题"}</Tag>
                    </div>
                    <p className="text-sm line-clamp-2">{q.question}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span className="text-red-600">我的答案：{q.options[q.myAnswer]}</span>
                      <span className="text-emerald-600">正确答案：{q.options[q.correctAnswer]}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); startPractice(q); }} className="flex-shrink-0 px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-blue-700">
                    练习相似题
                  </button>
                </div>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">暂无错题</p>
            )}
          </div>
        </div>
      </div>

      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag color="blue">{selectedQuestion.course}</Tag>
                <Tag color="gray">{selectedQuestion.chapter}</Tag>
                <Tag color="green">{selectedQuestion.type === "choice" ? "选择题" : "判断题"}</Tag>
              </div>
              <button onClick={() => setSelectedQuestion(null)}><X size={16} /></button>
            </div>
            <p className="font-medium text-sm">{selectedQuestion.question}</p>
            <div className="space-y-2">
              {selectedQuestion.options.map((opt, i) => (
                <div key={i} className={`px-4 py-3 rounded-md text-sm ${
                  i === selectedQuestion.correctAnswer ? "bg-emerald-50 border border-emerald-200" :
                  i === selectedQuestion.myAnswer ? "bg-red-50 border border-red-200" :
                  "bg-muted"
                }`}>
                  <span className={`font-medium ${
                    i === selectedQuestion.correctAnswer ? "text-emerald-700" :
                    i === selectedQuestion.myAnswer ? "text-red-700" : ""
                  }`}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </span>
                  {i === selectedQuestion.correctAnswer && <span className="ml-2 text-xs text-emerald-600">✓ 正确答案</span>}
                  {i === selectedQuestion.myAnswer && i !== selectedQuestion.correctAnswer && <span className="ml-2 text-xs text-red-600">✗ 我的答案</span>}
                </div>
              ))}
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-700 mb-1">解析</p>
              <p className="text-sm text-blue-600">{selectedQuestion.explain}</p>
            </div>
            <button onClick={() => { startPractice(selectedQuestion); setSelectedQuestion(null); }} className="w-full py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
              练习相似题
            </button>
          </div>
        </div>
      )}

      {practiceMode && practiceQuestionsList.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">相似题练习</h3>
              <button onClick={() => setPracticeMode(false)} className="text-sm text-muted-foreground hover:text-foreground">退出练习</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">第 {practiceIdx + 1} / {practiceQuestionsList.length} 题</span>
              <div className="flex-1 bg-muted rounded-full h-1">
                <div className="bg-primary h-1 rounded-full" style={{ width: `${((practiceIdx + 1) / practiceQuestionsList.length) * 100}%` }} />
              </div>
            </div>

            <div>
              <p className="font-medium text-sm mb-3">{practiceQuestionsList[practiceIdx].question}</p>
              <div className="space-y-2">
                {practiceQuestionsList[practiceIdx].options.map((opt, i) => {
                  const answered = practiceAnswers[practiceIdx] !== undefined;
                  let cls = "border border-border hover:border-primary text-sm";
                  if (answered) {
                    if (i === practiceQuestionsList[practiceIdx].answer) cls = "border border-emerald-500 bg-emerald-50 text-emerald-700 text-sm";
                    else if (i === practiceAnswers[practiceIdx] && practiceAnswers[practiceIdx] !== practiceQuestionsList[practiceIdx].answer) cls = "border border-red-400 bg-red-50 text-red-700 text-sm";
                    else cls = "border border-border text-muted-foreground text-sm";
                  }
                  return (
                    <button key={i} onClick={() => !answered && handlePracticeAnswer(practiceIdx, i)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${cls} ${!answered ? "cursor-pointer" : "cursor-default"}`}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  );
                })}
              </div>
              {practiceAnswers[practiceIdx] !== undefined && (
                <div className="mt-3 bg-blue-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-700 mb-1">解析</p>
                  <p className="text-sm text-blue-600">{practiceQuestionsList[practiceIdx].explain}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPracticeMode(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              {practiceAnswers[practiceIdx] !== undefined && practiceIdx < practiceQuestionsList.length - 1 && (
                <button onClick={() => setPracticeIdx(i => i + 1)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">下一题</button>
              )}
              {practiceAnswers[practiceIdx] !== undefined && practiceIdx === practiceQuestionsList.length - 1 && (
                <button onClick={() => setPracticeMode(false)} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">完成练习</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddWrongModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">手动添加错题</h3>
              <button onClick={() => setShowAddWrongModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">题目内容</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm h-24 resize-none" placeholder="请输入题目内容..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">选项（每行一个）</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm h-20 resize-none" placeholder="A. 选项一&#10;B. 选项二&#10;C. 选项三&#10;D. 选项四" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">正确答案</label>
                <select className="w-full px-3 py-2 border border-border rounded-md text-sm">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">我的错误答案</label>
                <select className="w-full px-3 py-2 border border-border rounded-md text-sm">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">知识点/章节</label>
                <input type="text" className="w-full px-3 py-2 border border-border rounded-md text-sm" placeholder="例如：微积分 - 导数" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">备注/理解难点</label>
                <textarea className="w-full px-3 py-2 border border-border rounded-md text-sm h-16 resize-none" placeholder="记录自己做错的原因或理解难点..." />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddWrongModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">取消</button>
              <button onClick={() => { setShowAddWrongModal(false); alert("错题已添加"); }} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">保存错题</button>
            </div>
          </div>
        </div>
      )}

      {showAIGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">AI生成相似题</h3>
              <button onClick={() => { setShowAIGenerateModal(false); setAiGenerating(false); }}><X size={16} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {aiGenerating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary animate-spin" />
                  <p className="text-sm">AI正在分析错题并生成相似题目...</p>
                </div>
              ) : aiGeneratedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {aiGeneratedQuestions.map((q, i) => (
                    <div key={i} className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag color="cyan">AI生成</Tag>
                        <span className="text-xs text-muted-foreground">第{i + 1}题</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt: string, j: number) => (
                          <div key={j} className="px-3 py-2 bg-muted rounded text-xs">
                            {String.fromCharCode(65 + j)}. {opt}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700">答案：{String.fromCharCode(65 + q.answer)}</p>
                        <p className="text-xs text-blue-600 mt-1">{q.explain}</p>
                      </div>
                      <button onClick={() => alert("已添加到错题本")} className="mt-3 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-md hover:bg-primary/20">添加到错题本</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">选择一个错题，AI将根据该题的知识点生成相似题目，帮助您巩固薄弱环节。</p>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-sm font-medium mb-3">选择生成依据</h4>
                    <div className="space-y-2">
                      <button onClick={() => {
                        setAiGenerating(true);
                        setTimeout(() => {
                          setAiGeneratedQuestions([
                            {
                              question: "求函数 f(x) = x³ - 3x² + 2 在 x = 1 处的导数值。",
                              options: ["-3", "0", "3", "-6"],
                              answer: 0,
                              explain: "f'(x) = 3x² - 6x，代入 x = 1 得 f'(1) = 3 - 6 = -3。",
                            },
                            {
                              question: "设函数 y = e^(2x)，求 dy/dx。",
                              options: ["e^(2x)", "2e^(2x)", "e^(x)", "2e^(x)"],
                              answer: 1,
                              explain: "复合函数求导，dy/dx = e^(2x) * 2 = 2e^(2x)。",
                            },
                            {
                              question: "求不定积分 ∫(2x + 1)dx。",
                              options: ["x² + x + C", "2x² + x + C", "x² + 2x + C", "2x² + 2x + C"],
                              answer: 0,
                              explain: "∫(2x + 1)dx = x² + x + C。",
                            },
                          ]);
                          setAiGenerating(false);
                        }, 2000);
                      }} className="w-full text-left px-3 py-2 border border-border rounded-md text-sm hover:bg-accent">
                        根据当前课程（高等数学）生成相似题
                      </button>
                      <button onClick={() => {
                        setAiGenerating(true);
                        setTimeout(() => {
                          setAiGeneratedQuestions([
                            {
                              question: "TCP三次握手过程中，第二次握手时服务器发送的报文包含哪些标志位？",
                              options: ["SYN", "ACK", "SYN+ACK", "FIN"],
                              answer: 2,
                              explain: "第二次握手时服务器发送 SYN+ACK，表示同意建立连接并确认收到客户端的SYN。",
                            },
                            {
                              question: "HTTP状态码404表示什么含义？",
                              options: ["服务器内部错误", "请求成功", "资源未找到", "重定向"],
                              answer: 2,
                              explain: "404表示请求的资源未找到（Not Found）。",
                            },
                          ]);
                          setAiGenerating(false);
                        }, 2000);
                      }} className="w-full text-left px-3 py-2 border border-border rounded-md text-sm hover:bg-accent">
                        根据当前错题知识点生成相似题
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Student: Exam ─────────────────────────────────────────────────────────────
function StudentExamLegacy() {
  const [activeExam, setActiveExam] = useState<typeof mockExams[0] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [apiExams, setApiExams] = useState<ExamPaper[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    getPendingExams().then(data => setApiExams(data || [])).catch(() => {}).finally(() => setLoadingExams(false));
  }, []);

  const savedCourseId = localStorage.getItem("selectedCourseId");
  const initialCourseId = savedCourseId ? parseInt(savedCourseId) : studentCourses[0].id;
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId) || studentCourses[0];

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem("selectedCourseId", courseId.toString());
  };

  // Use API data when available, fallback to mock
  const pendingExams = apiExams.length > 0
    ? apiExams.filter(e => e.status !== "CLOSED").map(e => ({
        id: e.id, name: e.paperName || "考试", course: e.courseName || selectedCourse.name,
        teacher: "", duration: 60, status: "pending", questions: [] as any[]
      }))
    : mockExams.filter(e => e.status === "pending" && e.course === selectedCourse.name);
  const completedExams = apiExams.length > 0
    ? apiExams.filter(e => e.status === "CLOSED").map(e => ({
        id: e.id, name: e.paperName || "考试", course: e.courseName || selectedCourse.name,
        teacher: "", duration: 60, status: "completed", questions: [] as any[]
      }))
    : mockExams.filter(e => e.status === "completed" && e.course === selectedCourse.name);

  const startExam = (exam: any) => {
    if (exam.questions && exam.questions.length > 0) {
      setActiveExam(exam);
    } else {
      // Fallback to mock exam data for question display
      const mockExam = mockExams.find(e => e.id === exam.id);
      setActiveExam(mockExam || exam);
    }
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft((exam.duration || 60) * 60);
    setSubmitted(false);
    setScore(null);
  };

  const submitExam = async () => {
    if (!activeExam) return;
    try {
      await submitExam(activeExam.id, answers);
    } catch {}
    let correctCount = 0;
    activeExam.questions.forEach((q, i) => {
      if (q.type !== "text" && answers[i] === q.answer) {
        correctCount++;
      }
    });
    setScore(Math.round((correctCount / (activeExam.questions.filter(q => q.type !== "text").length)) * 100));
    setSubmitted(true);
    setShowConfirmModal(false);
  };

  if (activeExam) {
    const question = activeExam.questions[currentQuestion];
    const totalQuestions = activeExam.questions.length;

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{activeExam.name}</h2>
              <p className="text-blue-100 text-xs mt-1">{activeExam.course} · {activeExam.teacher}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`font-mono text-xl font-bold ${timeLeft < 300 ? "text-red-300" : "text-white"}`}>
                  {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
                </p>
                <p className="text-blue-200 text-xs">剩余时间</p>
              </div>
              <button onClick={() => { setShowConfirmModal(true); }} className="px-4 py-2 bg-white text-primary rounded-md text-sm font-medium hover:bg-blue-50">
                提交试卷
              </button>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
              <Award size={40} className="text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">考试完成！</h3>
              <p className="text-sm text-muted-foreground mt-2">客观题已自动批改</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-5xl font-bold text-primary">{score}</span>
              <span className="text-muted-foreground text-lg">分</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="space-y-2">
                {activeExam.questions.map((q, i) => (
                  <div key={q.id} className={`flex items-start gap-3 p-3 rounded-md text-sm ${answers[i] === q.answer ? "bg-emerald-50" : "bg-red-50"}`}>
                    <span className={`font-mono text-xs ${answers[i] === q.answer ? "text-emerald-600" : "text-red-600"}`}>
                      {i + 1}. {q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "问答题"}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs">{q.question}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs">
                        <span className="text-red-600">我的答案：{q.type === "text" ? (answers[i] || "未作答") : q.options[answers[i] ?? -1] || "未作答"}</span>
                        <span className="text-emerald-600">正确答案：{q.type === "text" ? q.answer : q.options[q.answer]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setActiveExam(null)} className="px-6 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">
              返回列表
            </button>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-primary">{currentQuestion + 1}</span>
                  <span className="text-muted-foreground">/ {totalQuestions}</span>
                  <Tag color="blue">{question.type === "choice" ? "选择题" : question.type === "judge" ? "判断题" : "问答题"}</Tag>
                </div>
              </div>
              <p className="font-medium text-base mb-6">{question.question}</p>
              {question.type !== "text" ? (
                <div className="space-y-3">
                  {question.options.map((opt, i) => (
                    <button key={i} onClick={() => setAnswers(a => ({ ...a, [currentQuestion]: i }))}
                      className={`w-full text-left px-5 py-3.5 rounded-lg border transition-all text-sm ${
                        answers[currentQuestion] === i
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary hover:bg-accent/50"
                      }`}>
                      <span className={`inline-block w-6 h-6 rounded-full border mr-3 flex items-center justify-center text-xs ${
                        answers[currentQuestion] === i ? "border-primary bg-primary text-white" : "border-border"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea value={answers[currentQuestion] || ""} onChange={e => setAnswers(a => ({ ...a, [currentQuestion]: e.target.value }))}
                  placeholder="请输入答案..." className="w-full h-40 px-5 py-4 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <button onClick={() => currentQuestion > 0 && setCurrentQuestion(i => i - 1)} disabled={currentQuestion === 0}
                  className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                  上一题
                </button>
                <div className="flex items-center gap-2">
                  {activeExam.questions.map((_, i) => (
                    <button key={i} onClick={() => setCurrentQuestion(i)}
                      className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                        i === currentQuestion
                          ? "bg-primary text-white shadow-sm"
                          : answers[i] !== undefined
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={() => currentQuestion < totalQuestions - 1 && setCurrentQuestion(i => i + 1)} disabled={currentQuestion === totalQuestions - 1}
                  className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                  下一题
                </button>
              </div>
            </div>
          </>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <AlertCircle size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">确认提交</h3>
                  <p className="text-sm text-muted-foreground">提交后无法修改答案，确定提交吗？</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent">继续答题</button>
                <button onClick={submitExam} className="flex-1 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700">确认提交</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">在线考试</h2>
            <p className="text-blue-100 text-sm mt-1">{selectedCourse.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200">选择课程</span>
            <div className="relative">
              <select value={selectedCourseId} onChange={e => handleCourseChange(parseInt(e.target.value))}
                className="appearance-none bg-white/20 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
                {studentCourses.map(c => (
                  <option key={c.id} value={c.id} className="text-gray-900">
                    {c.name} · 进度 {c.progress}%
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-white pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-orange-500" />
              <h3 className="font-medium text-sm">待参加考试</h3>
              <Tag color="orange" className="ml-auto">{pendingExams.length}</Tag>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pendingExams.map(exam => (
              <div key={exam.id} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{exam.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.course} · {exam.teacher}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {exam.duration}分钟
                      </span>
                      <span className="text-xs text-orange-600">{exam.deadline} 截止</span>
                    </div>
                  </div>
                  <button onClick={() => startExam(exam)} className="ml-4 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
                    参加考试
                  </button>
                </div>
              </div>
            ))}
            {pendingExams.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">暂无待参加考试</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-green-500" />
              <h3 className="font-medium text-sm">已完成考试</h3>
              <Tag color="green" className="ml-auto">{completedExams.length}</Tag>
            </div>
          </div>
          <div className="divide-y divide-border">
            {completedExams.map(exam => (
              <div key={exam.id} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{exam.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.course} · {exam.teacher}</p>
                  </div>
                  <div className="text-center ml-4">
                    <p className="font-mono text-2xl font-bold text-primary">{exam.score}</p>
                    <p className="text-xs text-muted-foreground">得分</p>
                  </div>
                </div>
              </div>
            ))}
            {completedExams.length === 0 && (
              <div className="text-center py-12">
                <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">暂无已完成考试</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Teaching Assistant: Grading (考试批阅 · 真实接口) ────────────────────────────
function TA_Grading() {
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [items, setItems] = useState<GradingItemVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    getMyCourses().then(data => setCourses(data || [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!selectedCourseId) { setItems([]); setSelectedAnswerId(null); return; }
    setLoading(true);
    getGradingList(selectedCourseId)
      .then(data => { setItems(data || []); setSelectedAnswerId(null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const currentItem = items.find(i => i.answerId === selectedAnswerId) || null;

  const typeLabel = (t?: string) => {
    if (t === "SHORT") return "简答题";
    if (t === "COMPREHENSIVE") return "综合题";
    if (t === "FILL") return "填空题";
    return "主观题";
  };

  const handleSubmitGrade = async () => {
    if (!currentItem) return;
    if (score.trim() === "") { showToastMsg("请输入分数"); return; }
    const numScore = parseFloat(score);
    if (isNaN(numScore)) { showToastMsg("请输入有效分数"); return; }
    if (numScore < 0 || (currentItem.maxScore != null && numScore > currentItem.maxScore)) {
      showToastMsg(`分数需在 0 ~ ${currentItem.maxScore ?? "满分"} 之间`);
      return;
    }
    try {
      await submitGrade(currentItem.answerId, numScore, comment.trim() || undefined);
      showToastMsg("批阅完成");
      setItems(prev => prev.filter(i => i.answerId !== currentItem.answerId));
      setSelectedAnswerId(null);
      setScore("");
      setComment("");
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "批阅失败");
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground">选择课程</label>
        <select
          value={selectedCourseId ?? ""}
          onChange={e => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-background"
        >
          <option value="">请选择课程</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.courseName || c.className || `课程 ${c.id}`}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">待批阅主观题：<span className="font-semibold text-foreground">{items.length}</span> 道</span>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center">
          <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{selectedCourseId ? "该课程暂无待批阅的主观题" : "请先选择课程"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-2">
            {items.map(i => (
              <div
                key={i.answerId}
                onClick={() => { setSelectedAnswerId(i.answerId); setScore(""); setComment(""); }}
                className={`bg-card rounded-lg border p-3 cursor-pointer transition-colors ${selectedAnswerId === i.answerId ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{i.studentName || `学生${i.studentId}`}</span>
                  <Tag color="gray">第{i.questionNo}题</Tag>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{i.paperName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{i.questionStem}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
            {!currentItem ? (
              <div className="text-center py-16 text-sm text-muted-foreground">请选择左侧一道待批阅题目</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">批阅 · {currentItem.studentName || `学生${currentItem.studentId}`} · 第{currentItem.questionNo}题</h3>
                  <Tag color="blue">{typeLabel(currentItem.questionType)}</Tag>
                </div>
                <div className="space-y-3">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">题目</p>
                    <p className="text-sm whitespace-pre-wrap">{currentItem.questionStem || "（无题干）"}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">学生答案</p>
                    <p className="text-sm whitespace-pre-wrap">{currentItem.studentAnswer || "（未作答）"}</p>
                  </div>
                  {currentItem.correctAnswer && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">参考答案</p>
                      <p className="text-sm whitespace-pre-wrap">{currentItem.correctAnswer}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <label className="text-sm font-medium">得分</label>
                  <input
                    type="number"
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    placeholder={`满分 ${currentItem.maxScore ?? "—"}`}
                    className="w-28 px-3 py-2 border border-border rounded-md text-sm"
                  />
                  <span className="text-xs text-muted-foreground">/ {currentItem.maxScore ?? "—"} 分</span>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">评语（可选）</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="给学生的批注…"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
                  />
                </div>
                <button
                  onClick={handleSubmitGrade}
                  className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90"
                >
                  提交批阅
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher: Exam Management (考试管理 · 真实接口) ──────────────────────────────
interface EditableExamQuestion {
  questionId: number;
  questionType: string;
  score: number;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
  analysis: string;
  knowledgePoints?: string;
}

function TeacherExamManagement({ selectedQuizQuestions, setSelectedQuizQuestions }: {
  selectedQuizQuestions: number[];
  setSelectedQuizQuestions: (ids: number[]) => void;
}) {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);

  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [examInfo, setExamInfo] = useState({ name: "", courseId: null as number | null, startTime: "", endTime: "" });
  const [courses, setCourses] = useState<ClassVO[]>([]);
  const [myClasses, setMyClasses] = useState<ClsVO[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [bankQuestions, setBankQuestions] = useState<QuestionBank[]>([]);
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgePoint[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Step 2 筛选条件
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null); // "AI" | "MANUAL"
  const [filterKnowledge, setFilterKnowledge] = useState<string | null>(null);

  // Step 3 可编辑题目快照
  const [editable, setEditable] = useState<EditableExamQuestion[]>([]);

  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [results, setResults] = useState<ExamResultDTO | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const loadPapers = () => {
    setLoadingPapers(true);
    getExamPapers(1, 100)
      .then(data => setPapers(data.records || []))
      .catch(() => setPapers([]))
      .finally(() => setLoadingPapers(false));
  };

  useEffect(loadPapers, []);
  useEffect(() => { getMyCourses().then(data => setCourses(data || [])).catch(() => setCourses([])); }, []);
  useEffect(() => { getMyClasses().then(data => setMyClasses(data || [])).catch(() => setMyClasses([])); }, []);

  useEffect(() => {
    if (!examInfo.courseId) { setBankQuestions([]); setKnowledgeTree([]); return; }
    setLoadingQuestions(true);
    getQuestionList(1, 500, examInfo.courseId)
      .then(data => setBankQuestions(data.records || []))
      .catch(() => setBankQuestions([]))
      .finally(() => setLoadingQuestions(false));
    getKnowledgeTree(examInfo.courseId)
      .then(data => setKnowledgeTree(data || []))
      .catch(() => setKnowledgeTree([]));
  }, [examInfo.courseId]);

  const stemOf = (q: QuestionBank): string => {
    try {
      const raw = (q as any).content || (q as any).questionContent || "";
      const c = JSON.parse(raw);
      return c.stem || c.question || c.title || raw;
    } catch {
      return (q as any).content || (q as any).questionContent || "";
    }
  };

  const parseContent = (raw?: string): { stem: string; options: { label: string; text: string }[]; answer: string; analysis: string } => {
    const fallback = { stem: raw || "", options: [] as { label: string; text: string }[], answer: "", analysis: "" };
    if (!raw) return fallback;
    try {
      const c = JSON.parse(raw);
      let options: { label: string; text: string }[] = [];
      if (Array.isArray(c.options)) {
        options = c.options.map((o: any) => ({ label: String(o?.label ?? ""), text: String(o?.text ?? o ?? "") }));
      } else if (c.options && typeof c.options === "object") {
        options = Object.entries(c.options).map(([label, text]) => ({ label, text: String(text ?? "") }));
      }
      const answer = Array.isArray(c.answer) ? c.answer.join(",") : (c.answer != null ? String(c.answer) : "");
      return {
        stem: c.stem != null ? String(c.stem) : (c.question != null ? String(c.question) : ""),
        options,
        answer,
        analysis: c.analysis != null ? String(c.analysis) : "",
      };
    } catch {
      return fallback;
    }
  };

  const flattenKnowledge = (nodes: KnowledgePoint[]): string[] => {
    const out: string[] = [];
    const walk = (list: KnowledgePoint[]) => {
      for (const n of list) { out.push(n.name); if (n.children) walk(n.children); }
    };
    walk(nodes);
    return out;
  };
  const knowledgeOptions = flattenKnowledge(knowledgeTree);

  const questionTypes = [
    { value: "SINGLE", label: "单选" },
    { value: "MULTI", label: "多选" },
    { value: "FILL", label: "填空" },
    { value: "SHORT", label: "简答" },
    { value: "COMPREHENSIVE", label: "综合" },
    { value: "TRUE_FALSE", label: "判断" },
  ];
  const difficulties = [
    { value: "EASY", label: "简单" },
    { value: "MEDIUM", label: "中等" },
    { value: "HARD", label: "困难" },
  ];

  const filteredQuestions = bankQuestions.filter(q => {
    if (filterType && q.questionType !== filterType) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    if (filterSource) {
      const ai = q.aiGenerated === 1 ? 1 : 0;
      if (filterSource === "AI" && ai !== 1) return false;
      if (filterSource === "MANUAL" && ai !== 0) return false;
    }
    if (filterKnowledge) {
      const kps = (q.knowledgePoints || "").split(/[,，、]/).map(s => s.trim()).filter(Boolean);
      if (!kps.includes(filterKnowledge)) return false;
    }
    return true;
  });

  const toggleClass = (id: number) => {
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const buildEditable = (ids: number[]) => {
    const list = ids
      .map(id => {
        const q = bankQuestions.find(b => b.id === id);
        if (!q) return null;
        const c = parseContent((q as any).content);
        return {
          questionId: q.id,
          questionType: q.questionType || "",
          score: 10,
          stem: c.stem,
          options: c.options,
          answer: c.answer,
          analysis: c.analysis,
          knowledgePoints: q.knowledgePoints,
        } as EditableExamQuestion;
      })
      .filter((x): x is EditableExamQuestion => x !== null);
    setEditable(list);
  };

  const updateEditable = (idx: number, patch: Partial<EditableExamQuestion>) => {
    setEditable(prev => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const moveEditable = (idx: number, dir: -1 | 1) => {
    setEditable(prev => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setEditable(prev => prev.map((q, i) => (i === qIdx
      ? { ...q, options: q.options.map((o, j) => (j === optIdx ? { ...o, text } : o)) }
      : q)));
  };

  const typeLabel = (t?: string) => {
    const map: Record<string, string> = { SINGLE: "单选", MULTI: "多选", FILL: "填空", SHORT: "简答", COMPREHENSIVE: "综合", TRUE_FALSE: "判断" };
    return map[t || ""] || t || "未知";
  };

  const diffTag = (d?: string) => {
    if (d === "EASY") return <Tag color="green">简单</Tag>;
    if (d === "HARD") return <Tag color="red">困难</Tag>;
    return <Tag color="yellow">中等</Tag>;
  };

  const statusTag = (s?: string) => {
    if (s === "PUBLISHED") return <Tag color="green">已发布</Tag>;
    if (s === "CLOSED") return <Tag color="gray">已结束</Tag>;
    return <Tag color="yellow">草稿</Tag>;
  };

  const toggleQuestion = (id: number) => {
    setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openWizard = () => {
    setSelectedQuestionIds([...selectedQuizQuestions]);
    setSelectedClassIds([]);
    setFilterType(null);
    setFilterDifficulty(null);
    setFilterSource(null);
    setFilterKnowledge(null);
    setEditable([]);
    setShowCreateWizard(true);
    setCreateStep(1);
  };

  const resetWizard = () => {
    setShowCreateWizard(false);
    setCreateStep(1);
    setExamInfo({ name: "", courseId: null, startTime: "", endTime: "" });
    setSelectedQuestionIds([]);
    setSelectedClassIds([]);
    setFilterType(null);
    setFilterDifficulty(null);
    setFilterSource(null);
    setFilterKnowledge(null);
    setEditable([]);
    setBankQuestions([]);
    setKnowledgeTree([]);
    setSelectedQuizQuestions([]);
  };

  const goNext = () => {
    if (createStep === 1) {
      if (!examInfo.name.trim()) { showToastMsg("请输入试卷名称"); return; }
      if (!examInfo.courseId) { showToastMsg("请选择课程"); return; }
      if (!examInfo.startTime || !examInfo.endTime) { showToastMsg("请设置开始与结束时间"); return; }
      setCreateStep(2);
    } else if (createStep === 2) {
      if (selectedQuestionIds.length === 0) { showToastMsg("请至少选择一道题目"); return; }
      buildEditable(selectedQuestionIds);
      setCreateStep(3);
    }
  };

  const handleCreateExam = async () => {
    if (!examInfo.name.trim()) { showToastMsg("请输入试卷名称"); return; }
    if (!examInfo.courseId) { showToastMsg("请选择课程"); return; }
    if (!examInfo.startTime || !examInfo.endTime) { showToastMsg("请设置开始与结束时间"); return; }
    if (editable.length === 0) { showToastMsg("请至少选择一道题目"); return; }
    const start = new Date(examInfo.startTime).getTime();
    const end = new Date(examInfo.endTime).getTime();
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));
    const totalScore = editable.reduce((sum, q) => sum + (q.score || 0), 0);
    const targetClasses = selectedClassIds
      .map(id => myClasses.find(c => c.id === id)?.className)
      .filter(Boolean)
      .join(",");
    const questions = editable.map((q, idx) => {
      const contentObj: Record<string, unknown> = { stem: q.stem };
      if (q.options.length > 0) contentObj.options = q.options.map(o => ({ label: o.label, text: o.text }));
      contentObj.answer = q.answer;
      if (q.analysis) contentObj.analysis = q.analysis;
      return {
        questionId: q.questionId,
        questionNo: idx + 1,
        score: q.score || 0,
        content: JSON.stringify(contentObj),
      };
    });
    try {
      await createExamPaper({
        paperName: examInfo.name.trim(),
        courseId: examInfo.courseId,
        totalScore,
        durationMinutes,
        startTime: examInfo.startTime,
        endTime: examInfo.endTime,
        targetClasses: targetClasses || undefined,
        questions,
      });
      showToastMsg("试卷创建成功");
      resetWizard();
      loadPapers();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "创建失败");
    }
  };

  const openResults = (id: number) => {
    setSelectedExam(id);
    setResults(null);
    setLoadingResults(true);
    getExamResults(id)
      .then(data => setResults(data))
      .catch(e => { showToastMsg(e instanceof Error ? e.message : "加载结果失败"); setSelectedExam(null); })
      .finally(() => setLoadingResults(false));
  };

  const handlePublish = async (id: number) => {
    try { await publishExamPaper(id); showToastMsg("考试已发布"); loadPapers(); }
    catch (e) { showToastMsg(e instanceof Error ? e.message : "发布失败"); }
  };
  const handleClose = async (id: number) => {
    try { await closeExamPaper(id); showToastMsg("考试已结束"); loadPapers(); }
    catch (e) { showToastMsg(e instanceof Error ? e.message : "操作失败"); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该试卷？")) return;
    try { await deleteExamPaper(id); showToastMsg("试卷已删除"); loadPapers(); }
    catch (e) { showToastMsg(e instanceof Error ? e.message : "删除失败"); }
  };

  const fmtTime = (t?: string) => (t ? t.replace("T", " ").slice(0, 16) : "—");

  // ===== 结果视图 =====
  if (selectedExam !== null) {
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}
        <button onClick={() => setSelectedExam(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> 返回试卷列表
        </button>
        {loadingResults ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载结果中…</div>
        ) : !results ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">暂无结果</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard count={results.totalStudents ?? 0} label="应考人数" icon={Users} color="blue" />
              <StatCard count={results.submittedCount ?? 0} label="已交卷" icon={FileText} color="green" />
              <StatCard count={results.averageScore ?? 0} label="平均分" icon={BarChart2} color="orange" />
              <StatCard count={results.maxScore ?? 0} label="最高分" icon={TrendingUp} color="purple" />
              <StatCard count={`${results.passRate ?? 0}%`} label="及格率" icon={CheckCircle} color="green" />
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">学号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">总分</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">交卷时间</th>
                  </tr>
                </thead>
                <tbody>
                  {(results.studentScores || []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">暂无学生交卷</td></tr>
                  ) : (
                    (results.studentScores || []).map(s => (
                      <tr key={s.studentId} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{s.studentNo || "—"}</td>
                        <td className="px-4 py-3 font-medium">{s.name || `学生${s.studentId}`}</td>
                        <td className="px-4 py-3 font-mono">{s.totalScore ?? "—"}</td>
                        <td className="px-4 py-3">{s.submitStatus === "SUBMITTED" ? <Tag color="green">已交卷</Tag> : <Tag color="gray">未交卷</Tag>}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtTime(s.submitTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  // ===== 列表 + 建卷视图 =====
  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">考试管理</h2>
        <button onClick={openWizard} className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">
          <Plus size={16} /> 创建考试
        </button>
      </div>

      {showCreateWizard && (
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            {["基本信息", "选择题目", "确认发布"].map((label, idx) => {
              const step = idx + 1;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${createStep >= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{step}</div>
                  <span className={`text-sm ${createStep >= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                  {step < 3 && <div className="w-8 h-px bg-border" />}
                </div>
              );
            })}
          </div>

          {createStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1">试卷名称</label>
                <input value={examInfo.name} onChange={e => setExamInfo({ ...examInfo, name: e.target.value })} placeholder="如：第1章 单元测验" className="w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">选择课程</label>
                <select value={examInfo.courseId ?? ""} onChange={e => setExamInfo({ ...examInfo, courseId: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                  <option value="">请选择课程</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.courseName || c.className || `课程 ${c.id}`}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">开始时间</label>
                  <input type="datetime-local" value={examInfo.startTime} onChange={e => setExamInfo({ ...examInfo, startTime: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">结束时间</label>
                  <input type="datetime-local" value={examInfo.endTime} onChange={e => setExamInfo({ ...examInfo, endTime: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1">选择班级（多选）</label>
                <div className="border border-border rounded-md p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                  {myClasses.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full py-2 text-center">暂无班级数据</p>
                  ) : (
                    myClasses.map(c => {
                      const checked = selectedClassIds.includes(c.id);
                      return (
                        <label key={c.id} className={`flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1.5 transition-colors ${checked ? "bg-primary/5" : "hover:bg-accent/40"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleClass(c.id)} />
                          <span>{c.className}</span>
                          {c.courseName && <span className="text-xs text-muted-foreground truncate">({c.courseName})</span>}
                        </label>
                      );
                    })
                  )}
                </div>
                {selectedClassIds.length > 0 && <p className="text-xs text-muted-foreground mt-1">已选 {selectedClassIds.length} 个班级</p>}
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">题型筛选</label>
                  <div className="flex flex-wrap gap-1">
                    {questionTypes.map(t => (
                      <button key={t.value} onClick={() => setFilterType(filterType === t.value ? null : t.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${filterType === t.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">难度筛选</label>
                  <div className="flex flex-wrap gap-1">
                    {difficulties.map(d => (
                      <button key={d.value} onClick={() => setFilterDifficulty(filterDifficulty === d.value ? null : d.value)} className={`px-2 py-1 text-xs rounded-full transition-colors ${filterDifficulty === d.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">来源筛选</label>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setFilterSource(filterSource === "AI" ? null : "AI")} className={`px-2 py-1 text-xs rounded-full transition-colors ${filterSource === "AI" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>AI生成</button>
                    <button onClick={() => setFilterSource(filterSource === "MANUAL" ? null : "MANUAL")} className={`px-2 py-1 text-xs rounded-full transition-colors ${filterSource === "MANUAL" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>手动录入</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">知识点筛选</label>
                  <select value={filterKnowledge ?? ""} onChange={e => setFilterKnowledge(e.target.value || null)} className="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background">
                    <option value="">全部知识点</option>
                    {knowledgeOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              {loadingQuestions ? (
                <p className="text-sm text-muted-foreground py-8 text-center">加载题库中…</p>
              ) : bankQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">该课程暂无题目，请先在题库中添加题目</p>
              ) : filteredQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">没有符合条件的题目，请调整筛选条件</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredQuestions.map(q => {
                    const checked = selectedQuestionIds.includes(q.id);
                    const order = selectedQuestionIds.indexOf(q.id);
                    const c = parseContent((q as any).content);
                    return (
                      <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`border rounded-md p-3 cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={checked} readOnly className="mt-1" />
                          {checked && <span className="mt-0.5 text-xs font-semibold text-primary whitespace-nowrap">第{order + 1}题</span>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                              {diffTag(q.difficulty)}
                              <Tag color={q.aiGenerated === 1 ? "blue" : "orange"}>{q.aiGenerated === 1 ? "AI生成" : "手动录入"}</Tag>
                              {(q.knowledgePoints || "").split(/[,，、]/).filter(Boolean).slice(0, 2).map(k => <span key={k} className="text-xs text-muted-foreground">#{k.trim()}</span>)}
                            </div>
                            <p className="text-sm mt-1 line-clamp-2">{c.stem || stemOf(q)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="text-sm text-muted-foreground">已选 {selectedQuestionIds.length} 道题目（按勾选顺序自动编号）</div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">试卷：</span>{examInfo.name}</p>
                <p><span className="text-muted-foreground">课程：</span>{courses.find(c => c.id === examInfo.courseId)?.courseName || courses.find(c => c.id === examInfo.courseId)?.className || `课程 ${examInfo.courseId}`}</p>
                <p><span className="text-muted-foreground">班级：</span>{selectedClassIds.length > 0 ? selectedClassIds.map(id => myClasses.find(c => c.id === id)?.className).filter(Boolean).join("、") : "未选择"}</p>
                <p><span className="text-muted-foreground">时间：</span>{fmtTime(examInfo.startTime)} ~ {fmtTime(examInfo.endTime)}</p>
                <p><span className="text-muted-foreground">题目：</span>{editable.length} 道，共 {editable.reduce((s, q) => s + (q.score || 0), 0)} 分</p>
              </div>

              {editable.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无题目</p>
              ) : (
                editable.map((q, idx) => (
                  <div key={q.questionId} className="border border-border rounded-md p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">第 {idx + 1} 题</span>
                      <Tag color="blue">{typeLabel(q.questionType)}</Tag>
                      <span className="text-xs text-muted-foreground">#{q.questionId}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button onClick={() => moveEditable(idx, -1)} disabled={idx === 0} className="p-1 border border-border rounded hover:bg-accent disabled:opacity-30"><ChevronUp size={14} /></button>
                        <button onClick={() => moveEditable(idx, 1)} disabled={idx === editable.length - 1} className="p-1 border border-border rounded hover:bg-accent disabled:opacity-30"><ChevronDown size={14} /></button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">分值</label>
                      <input type="number" value={q.score} onChange={e => updateEditable(idx, { score: Number(e.target.value) || 0 })} className="w-20 px-2 py-1 border border-border rounded-md text-sm" />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">题干</label>
                      <textarea value={q.stem} onChange={e => updateEditable(idx, { stem: e.target.value })} rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none" />
                    </div>

                    {q.options.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground block mb-1">选项</label>
                        {q.options.map((o, oi) => (
                          <div key={o.label} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-5 text-center">{o.label}.</span>
                            <input value={o.text} onChange={e => updateOptionText(idx, oi, e.target.value)} className="flex-1 px-2 py-1 border border-border rounded-md text-sm" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">答案</label>
                      <input value={q.answer} onChange={e => updateEditable(idx, { answer: e.target.value })} placeholder={q.questionType === "MULTI" ? "多选答案，如 A,C" : "参考答案"} className="w-full px-2 py-1 border border-border rounded-md text-sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-border">
            <button onClick={() => { if (createStep === 1) resetWizard(); else setCreateStep(s => s - 1); }} className="px-3 py-2 rounded-md text-sm border border-border hover:bg-accent/50">
              {createStep === 1 ? "取消" : "上一步"}
            </button>
            {createStep < 3 ? (
              <button onClick={goNext} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">下一步</button>
            ) : (
              <button onClick={handleCreateExam} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">创建并发布</button>
            )}
          </div>
        </div>
      )}

      {loadingPapers ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : papers.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center">
          <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">暂无试卷，点击右上角「创建考试」</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">试卷名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">课程</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">起止时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.paperName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.courseName || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtTime(p.startTime)} ~ {fmtTime(p.endTime)}</td>
                  <td className="px-4 py-3">{statusTag(p.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openResults(p.id)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Eye size={14} />结果</button>
                      {p.status !== "PUBLISHED" && (
                        <button onClick={() => handlePublish(p.id)} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"><Play size={14} />发布</button>
                      )}
                      {p.status === "PUBLISHED" && (
                        <button onClick={() => handleClose(p.id)} className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"><Clock size={14} />结束</button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"><Trash2 size={14} />删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Student: Exam (在线考试 · 真实接口) ──────────────────────────────────────────
function StudentExam() {
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [pendingExams, setPendingExams] = useState<ExamPaper[]>([]);
  const [records, setRecords] = useState<StudentExamRecordVO[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeExam, setActiveExam] = useState<StudentExamVO | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<SubmitExamResultDTO | null>(null);

  const [reviewResult, setReviewResult] = useState<StudentExamResultVO | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToastMsg = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2000); };

  const load = () => {
    setLoading(true);
    Promise.all([getPendingExams(), getMyExamRecords()])
      .then(([p, r]) => { setPendingExams(p || []); setRecords(r || []); })
      .catch(() => { setPendingExams([]); setRecords([]); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!activeExam) return;
    const timer = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [activeExam]);

  const startExam = async (paper: ExamPaper) => {
    try {
      const vo = await getStudentExam(paper.id);
      setActiveExam(vo);
      setCurrentQuestion(0);
      setAnswers({});
      setSubmittedResult(null);
      setReviewResult(null);
      setTimeLeft((vo.durationMinutes || 60) * 60);
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "无法开始考试");
    }
  };

  const exitExam = () => {
    setActiveExam(null);
    setSubmittedResult(null);
    setReviewResult(null);
    setShowConfirmModal(false);
    load();
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    try {
      const result = await submitExam(activeExam.paperId, answers);
      setSubmittedResult(result);
      setShowConfirmModal(false);
      load();
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "交卷失败");
    }
  };

  const openReview = async (record: StudentExamRecordVO) => {
    try {
      const r = await getMyExamResult(record.paperId);
      setReviewResult(r);
    } catch (e) {
      showToastMsg(e instanceof Error ? e.message : "无法加载作答详情");
    }
  };

  const q = activeExam?.questions[currentQuestion];
  const qType = q?.questionType || "";
  const isMulti = qType === "MULTI";
  const hasOptions = !!q?.options && q.options.length > 0;

  const setOptionAnswer = (questionId: number, label: string) => {
    setAnswers(prev => {
      if (!isMulti) return { ...prev, [questionId]: label };
      const cur = (prev[questionId] || "").split(",").filter(Boolean);
      const idx = cur.indexOf(label);
      if (idx >= 0) cur.splice(idx, 1); else cur.push(label);
      return { ...prev, [questionId]: cur.join(",") };
    });
  };

  const typeLabel = (t?: string) => {
    const map: Record<string, string> = { SINGLE: "单选题", MULTI: "多选题", FILL: "填空题", SHORT: "简答题", COMPREHENSIVE: "综合题", TRUE_FALSE: "判断题" };
    return map[t || ""] || "题目";
  };

  const isObjective = (t?: string) => ["SINGLE", "MULTI", "FILL", "TRUE_FALSE"].includes(t || "");

  const fmtDate = (t?: string) => (t ? t.replace("T", " ").slice(0, 16) : "—");
  const fmtClock = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // ===== 回看结果 =====
  if (reviewResult) {
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}
        <button onClick={() => setReviewResult(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> 返回
        </button>
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">{reviewResult.paperName}</h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <span>客观题得分：<span className="font-semibold">{reviewResult.objectiveScore ?? 0}</span></span>
            <span>主观题待批：<span className="font-semibold">{reviewResult.subjectivePending ?? 0}</span> 题</span>
            <span>总分：<span className="font-semibold">{reviewResult.myScore ?? 0}</span> / {reviewResult.totalScore ?? "—"}</span>
            <span className="text-muted-foreground">交卷时间：{fmtDate(reviewResult.submitTime)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {reviewResult.answers.map(a => (
            <div key={a.questionNo} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">第{a.questionNo}题 · {typeLabel(a.questionType)}</span>
                {isObjective(a.questionType) ? (
                  a.isCorrect === 1 ? <Tag color="green">回答正确</Tag> : <Tag color="red">回答错误</Tag>
                ) : (
                  a.graded === 1 ? <Tag color="green">已批阅</Tag> : <Tag color="yellow">待批阅</Tag>
                )}
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{a.stem}</p>
              {a.options && a.options.length > 0 && (
                <div className="mt-2 space-y-1">
                  {a.options.map(o => <p key={o.label} className="text-sm text-muted-foreground">{o.label}. {o.text}</p>)}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">我的答案</p>
                  <p className="text-sm whitespace-pre-wrap">{a.studentAnswer || "（未作答）"}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">正确答案</p>
                  <p className="text-sm whitespace-pre-wrap">{a.correctAnswer || "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span>得分：<span className="font-semibold">{a.score ?? 0}</span> / {a.maxScore ?? "—"}</span>
                {!isObjective(a.questionType) && a.comment && (
                  <span className="text-muted-foreground">评语：{a.comment}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== 交卷结果 =====
  if (submittedResult) {
    return (
      <div className="space-y-5">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
          <h2 className="text-xl font-semibold text-foreground">交卷成功</h2>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div>
              <p className="text-3xl font-semibold text-primary">{submittedResult.objectiveScore ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">客观题得分</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-3xl font-semibold text-foreground">{submittedResult.subjectiveCount ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">主观题待批阅</p>
            </div>
          </div>
          <button onClick={exitExam} className="mt-6 px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">返回列表</button>
        </div>
      </div>
    );
  }

  // ===== 考试作答 =====
  if (activeExam) {
    const total = activeExam.questions.length;
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
          </div>
        )}
        <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">{activeExam.paperName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">共 {total} 题 · 满分 {activeExam.totalScore ?? "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-semibold text-primary">{fmtClock(timeLeft)}</span>
            <button onClick={() => setShowConfirmModal(true)} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">交卷</button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>第 {currentQuestion + 1} / {total} 题</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${total ? ((currentQuestion + 1) / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <Tag color="blue">{typeLabel(q?.questionType)}</Tag>
            <span className="text-sm text-muted-foreground">本题 {q?.score ?? "—"} 分</span>
          </div>
          <p className="text-base whitespace-pre-wrap">{q?.stem}</p>

          <div className="mt-4 space-y-2">
            {hasOptions ? (
              q!.options!.map(o => {
                const selected = isMulti
                  ? (answers[q!.questionId] || "").split(",").filter(Boolean).includes(o.label)
                  : answers[q!.questionId] === o.label;
                return (
                  <button
                    key={o.label}
                    onClick={() => setOptionAnswer(q!.questionId, o.label)}
                    className={`w-full text-left px-4 py-2.5 rounded-md border text-sm transition-colors ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/50"}`}
                  >
                    <span className="font-medium mr-2">{o.label}.</span>{o.text}
                  </button>
                );
              })
            ) : qType === "TRUE_FALSE" ? (
              <div className="grid grid-cols-2 gap-3">
                {["TRUE", "FALSE"].map(v => {
                  const selected = answers[q!.questionId] === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setAnswers(prev => ({ ...prev, [q!.questionId]: v }))}
                      className={`px-4 py-2.5 rounded-md border text-sm transition-colors ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/50"}`}
                    >
                      {v === "TRUE" ? "正确" : "错误"}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[q!.questionId] || ""}
                onChange={e => setAnswers(prev => ({ ...prev, [q!.questionId]: e.target.value }))}
                rows={5}
                placeholder="请输入你的答案…"
                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none"
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentQuestion(i => Math.max(0, i - 1))} disabled={currentQuestion === 0} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent/50 disabled:opacity-40">上一题</button>
          <button onClick={() => setCurrentQuestion(i => Math.min(total - 1, i + 1))} disabled={currentQuestion >= total - 1} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent/50 disabled:opacity-40">下一题</button>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg border border-border p-6 w-full max-w-sm space-y-4">
              <h3 className="font-semibold text-foreground">确认交卷？</h3>
              <p className="text-sm text-muted-foreground">已作答 {Object.keys(answers).length} / {total} 题，交卷后无法修改。</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent/50">再检查一下</button>
                <button onClick={handleSubmitExam} className="px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">确认交卷</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== 列表视图 =====
  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-primary text-white text-sm rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2"><CheckCircle size={14} />{toast}</div>
        </div>
      )}

      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        <button onClick={() => setTab("pending")} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>待考</button>
        <button onClick={() => setTab("completed")} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "completed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>已完成</button>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">加载中…</div>
      ) : tab === "pending" ? (
        pendingExams.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无待考考试</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingExams.map(p => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-5">
                <h3 className="font-semibold text-foreground">{p.paperName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.courseName}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>满分 {p.totalScore ?? "—"}</span>
                  <span>时长 {p.durationMinutes ?? "—"} 分钟</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">截止：{fmtDate(p.endTime)}</p>
                <button onClick={() => startExam(p)} className="mt-4 w-full px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">开始考试</button>
              </div>
            ))}
          </div>
        )
      ) : (
        records.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无已完成考试</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">试卷</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">课程</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">得分</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">交卷时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.recordId} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.paperName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.courseName || "—"}</td>
                    <td className="px-4 py-3 font-mono">{r.myScore ?? 0} / {r.totalScore ?? "—"}</td>
                    <td className="px-4 py-3">{r.subjectivePending && r.subjectivePending > 0 ? <Tag color="yellow">待批阅</Tag> : <Tag color="green">已出分</Tag>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtDate(r.submitTime)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openReview(r)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Eye size={14} />查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ─── Page title map ───────────────────────────────────────────────────────────
const pageMeta: Record<Page, { breadcrumb: string[] }> = {
  login: { breadcrumb: [] },
  "admin-dashboard": { breadcrumb: ["管理员", "系统总览"] },
  "admin-teachers": { breadcrumb: ["管理员", "教师账号管理"] },
  "admin-ai-ops": { breadcrumb: ["管理员", "AI运维中心"] },
  "admin-audit": { breadcrumb: ["管理员", "系统审计日志"] },
  "admin-config": { breadcrumb: ["管理员", "系统配置"] },
  "teacher-dashboard": { breadcrumb: ["教师端", "教学驾驶舱"] },
  "teacher-class": { breadcrumb: ["教师端", "班级管理"] },
  "teacher-import": { breadcrumb: ["教师端", "数据导入"] },
  "teacher-profile": { breadcrumb: ["教师端", "学生画像"] },
  "teacher-ai-quiz": { breadcrumb: ["教师端", "题库管理", "AI出题组卷"] },
  "teacher-bank": { breadcrumb: ["教师端", "题库管理"] },
  "teacher-exam": { breadcrumb: ["教师端", "考试管理"] },
  "teacher-notification": { breadcrumb: ["教师端", "通知中心"] },
  "teacher-logs": { breadcrumb: ["教师端", "操作日志"] },
  "ta-dashboard": { breadcrumb: ["助教端", "教学驾驶舱"] },
  "ta-import": { breadcrumb: ["助教端", "数据导入"] },
  "ta-profile": { breadcrumb: ["助教端", "学生画像"] },
  "ta-grading": { breadcrumb: ["助教端", "考试批阅"] },
  "student-dashboard": { breadcrumb: ["学生端", "个人学习中心"] },
  "student-profile": { breadcrumb: ["学生端", "我的画像"] },
  "student-score-trend": { breadcrumb: ["学生端", "成绩趋势"] },
  "student-wrong-book": { breadcrumb: ["学生端", "错题本"] },
  "student-exam": { breadcrumb: ["学生端", "在线考试"] },
};

// ─── Global AI Assistant (全局悬浮AI助手) ──────────────────────────────────────
function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; files?: File[] }[]>([
    { role: "ai", content: "您好！我是您的AI智能助手，有什么可以帮您的吗？\n\n您可以：\n• 提问教学相关问题\n• 上传文件进行分析\n• 获取学习建议" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const baseHeight = 500;
  const expandedHeight = baseHeight + 150;
  const windowHeight = files.length > 0 ? (isMaximized ? Math.min(window.innerHeight * 0.8, 800) : expandedHeight) : (isMaximized ? Math.min(window.innerHeight * 0.8, 800) : baseHeight);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    setMessages(prev => [...prev, { role: "user", content: message, files: [...files] }]);
    setMessage("");
    setFiles([]);
    setIsTyping(true);

    console.log("Sending message:", {
      text: message,
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsTyping(false);
    setMessages(prev => [...prev, {
      role: "ai",
      content: files.length > 0 
        ? `收到您上传的 ${files.length} 个文件：${files.map(f => f.name).join('、')}\n\n我已经分析了这些文件的内容，以下是我的分析结果：\n\n1. 文件内容摘要\n2. 关键信息提取\n3. 相关建议\n\n如果您需要更详细的分析，请告诉我！`
        : `感谢您的提问！关于"${message}"，我的回答如下：\n\n这是一个很好的问题。根据我的分析：\n\n1. 核心要点一\n2. 核心要点二\n3. 核心要点三\n\n希望这个回答对您有帮助！`
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`fixed right-5 bottom-5 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center cursor-pointer z-[9999] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{
          animation: !isOpen ? "breathe 3s ease-in-out infinite" : "none"
        }}
      >
        <Brain size={28} className="text-white" />
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
        }
      `}</style>

      <div 
        className={`fixed right-5 bottom-5 bg-card rounded-2xl shadow-2xl border border-border z-[9999] transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4 pointer-events-none"
        }`}
        style={{
          width: isMaximized ? Math.min(window.innerWidth * 0.8, 800) : 380,
          height: windowHeight,
        }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-white" />
            <span className="text-sm font-medium text-white">AI智能助手</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === "user" 
                  ? "bg-blue-500 text-white rounded-br-md" 
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.files && msg.files.length > 0 && (
                <div className={`mt-2 space-y-1 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {msg.files.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg text-xs">
                      <FileText size={14} className="text-muted-foreground" />
                      <span className="max-w-[200px] truncate">{f.name}</span>
                      <span className="text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start">
              <div className="bg-muted rounded-xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="px-4 py-2 bg-accent/50 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">已选择 {files.length} 个文件</span>
              <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:text-red-600">清空全部</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-card rounded-lg px-3 py-2">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-xs flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => removeFile(i)} className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3 bg-card border-t border-border">
          <div className="flex items-end gap-2">
            <div className="relative flex-shrink-0">
              <button className="p-2.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors">
                <Paperclip size={18} />
              </button>
              <input 
                type="file" 
                multiple 
                accept="image/*,.pdf,.doc,.docx,.txt" 
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题...（Shift+Enter换行）"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={2}
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={!message.trim() && files.length === 0}
              className="flex-shrink-0 p-2.5 bg-primary text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [role, setRole] = useState<Role>("student");
  const [dark, setDark] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(1);
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState<number[]>([]);
  const [filterSourceType, setFilterSourceType] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  // 检查是否已登录
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      const frontendRole = mapRole(savedUser.role);
      setRole(frontendRole);
      setUser(savedUser);
      setPage(frontendRole === "admin" ? "admin-dashboard" : frontendRole === "teacher" ? "teacher-dashboard" : frontendRole === "teaching-assistant" ? "ta-dashboard" : "student-dashboard");
    }
  }, []);

  const handleLogin = useCallback((r: Role, userData: any) => {
    setRole(r);
    setUser(userData);
    setPage(r === "admin" ? "admin-dashboard" : r === "teacher" || r === "teaching-assistant" ? "teacher-dashboard" : "student-dashboard");
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
        dark={dark} onToggleDark={toggleDark} breadcrumb={breadcrumb}>
        {/* Admin pages */}
        {page === "admin-dashboard" && <AdminDashboard />}
        {page === "admin-teachers" && <AdminTeacherManagement />}
        {page === "admin-ai-ops" && <AdminAIOpsCenter />}
        {page === "admin-audit" && <AdminAuditLogs />}
        {page === "admin-config" && <AdminConfig />}
        {/* Teacher pages */}
        {page === "teacher-dashboard" && <TeacherDashboard onNav={setPage} setSelectedStudentId={setSelectedStudentId} setSelectedCourseId={setSelectedCourseId} />}
        {page === "teacher-class" && <TeacherClassManagement onNav={setPage} setSelectedStudentId={setSelectedStudentId} setSelectedCourseId={setSelectedCourseId} />}
        {page === "teacher-import" && <TeacherDataImport />}
        {page === "teacher-profile" && <TeacherStudentProfile onNav={setPage} initialStudentId={selectedStudentId} initialCourseId={selectedCourseId} />}
        {page === "teacher-ai-quiz" && <TeacherAIQuiz onNav={setPage} />}
        {page === "teacher-bank" && <TeacherQuestionBank onNav={setPage} setSelectedQuizQuestions={setSelectedQuizQuestions} filterSourceType={filterSourceType} setFilterSourceType={setFilterSourceType} />}
        {page === "teacher-exam" && <TeacherExamManagement selectedQuizQuestions={selectedQuizQuestions} setSelectedQuizQuestions={setSelectedQuizQuestions} />}
        {page === "teacher-notification" && <TeacherNotification />}
        {page === "teacher-logs" && <TeacherOperationLogs />}
        {/* Teaching Assistant pages (复用教师端组件，后端已做权限控制) */}
        {page === "ta-dashboard" && <TeacherDashboard onNav={setPage} setSelectedStudentId={setSelectedStudentId} setSelectedCourseId={setSelectedCourseId} />}
        {page === "ta-import" && <TeacherDataImport />}
        {page === "ta-profile" && <TeacherStudentProfile onNav={setPage} initialStudentId={selectedStudentId} initialCourseId={selectedCourseId} />}
        {page === "ta-grading" && <TA_Grading />}
        {/* Student pages */}
        {page === "student-dashboard" && <StudentDashboard onNav={setPage} />}
        {page === "student-profile" && <StudentProfile />}
        {page === "student-score-trend" && <StudentScoreTrend />}
        {page === "student-wrong-book" && <StudentWrongBook />}
        {page === "student-exam" && <StudentExam />}
      </AppShell>
      <AIAssistant />
    </>
  );
}
