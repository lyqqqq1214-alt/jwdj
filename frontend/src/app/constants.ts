import {
  LayoutDashboard, GraduationCap, Brain, FileSearch, Bell, Settings,
  Sparkles, Users, Upload, BookOpen, FileText, History, User, TrendingUp, Clock,
} from "lucide-react";
import type { Role, Page } from "./types";

// ─── 图表颜色 ────────────────────────────────────────────────────────────────
export const PIE_COLORS = ["#969BE7", "#A9C3EF", "#8FD0B8", "#F5D5A8", "#B8B8CE"];

// ─── 导航配置 ─────────────────────────────────────────────────────────────────
export const navItems: Record<Role, { icon: any; label: string; page?: Page; children?: { label: string; page: Page }[] }[]> = {
  admin: [
    { icon: LayoutDashboard, label: "系统总览", page: "admin-dashboard" },
    { icon: GraduationCap, label: "教师账号管理", page: "admin-teachers" },
    { icon: Brain, label: "AI运维中心", page: "admin-ai-ops" },
    { icon: FileSearch, label: "系统审计日志", page: "admin-audit" },
    { icon: Bell, label: "通知中心", page: "admin-notification" },
    { icon: Settings, label: "系统配置", page: "admin-config" },
  ],
  teacher: [
    { icon: Sparkles, label: "AI 智能分析", page: "teacher-ai-analysis" },
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
    { icon: Bell, label: "通知中心", page: "teacher-notification" },
  ],
  student: [
    { icon: LayoutDashboard, label: "个人学习中心", page: "student-dashboard" },
    { icon: User, label: "我的画像", page: "student-profile" },
    { icon: TrendingUp, label: "成绩趋势", page: "student-score-trend" },
    { icon: BookOpen, label: "错题本", page: "student-wrong-book" },
    { icon: Clock, label: "在线考试", page: "student-exam" },
    { icon: Bell, label: "通知中心", page: "student-notification" },
  ],
};

// ─── 页面元数据（面包屑） ─────────────────────────────────────────────────────
export const pageMeta: Record<Page, { breadcrumb: string[] }> = {
  login: { breadcrumb: [] },
  "admin-dashboard": { breadcrumb: ["管理员", "系统总览"] },
  "admin-teachers": { breadcrumb: ["管理员", "教师账号管理"] },
  "admin-ai-ops": { breadcrumb: ["管理员", "AI运维中心"] },
  "admin-audit": { breadcrumb: ["管理员", "系统审计日志"] },
  "admin-config": { breadcrumb: ["管理员", "系统配置"] },
  "teacher-ai-analysis": { breadcrumb: ["教师端", "AI 智能分析"] },
  "teacher-dashboard": { breadcrumb: ["教师端", "教学驾驶舱"] },
  "teacher-class": { breadcrumb: ["教师端", "班级管理"] },
  "teacher-import": { breadcrumb: ["教师端", "数据导入"] },
  "teacher-profile": { breadcrumb: ["教师端", "学生画像"] },
  "teacher-ai-quiz": { breadcrumb: ["教师端", "题库管理", "AI出题组卷"] },
  "teacher-bank": { breadcrumb: ["教师端", "题库管理"] },
  "teacher-exam": { breadcrumb: ["教师端", "考试管理"] },
  "teacher-notification": { breadcrumb: ["教师端", "通知中心"] },
  "admin-notification": { breadcrumb: ["管理员端", "通知中心"] },
  "student-notification": { breadcrumb: ["学生端", "通知中心"] },
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

// ─── Mock 数据 ───────────────────────────────────────────────────────────────
export const loginTrend = [
  { day: "周一", count: 342 }, { day: "周二", count: 418 }, { day: "周三", count: 389 },
  { day: "周四", count: 512 }, { day: "周五", count: 476 }, { day: "周六", count: 198 },
  { day: "周日", count: 156 },
];

export const collegePie = [
  { name: "计算机学院", value: 38 }, { name: "数学学院", value: 22 },
  { name: "物理学院", value: 18 }, { name: "经管学院", value: 14 }, { name: "其他", value: 8 },
];

export const mockUsers = [
  { id: 1, uid: "2024001", name: "张伟", role: "student", college: "计算机学院", class: "2024级1班", status: "active", created: "2024-09-01 08:00" },
  { id: 2, uid: "2024002", name: "李娜", role: "student", college: "数学学院", class: "2024级2班", status: "active", created: "2024-09-01 08:05" },
  { id: 3, uid: "T2021001", name: "王建国", role: "teacher", college: "计算机学院", class: "—", status: "active", created: "2021-07-15 09:00" },
  { id: 4, uid: "T2019002", name: "刘晓红", role: "teacher", college: "数学学院", class: "—", status: "active", created: "2019-09-01 09:00" },
  { id: 5, uid: "A0001", name: "陈系统", role: "admin", college: "信息中心", class: "—", status: "active", created: "2018-01-01 00:00" },
  { id: 6, uid: "2024003", name: "赵磊", role: "student", college: "物理学院", class: "2024级3班", status: "inactive", created: "2024-09-01 08:10" },
];

export const mockTeachers = [
  { id: 1, staffId: "T2021001", name: "王建国", account: "T2021001", status: "active", createdAt: "2021-07-15", lastLogin: "2025-03-12 14:30" },
  { id: 2, staffId: "T2019002", name: "刘晓红", account: "T2019002", status: "active", createdAt: "2019-09-01", lastLogin: "2025-03-12 16:45" },
  { id: 3, staffId: "T2020003", name: "张明远", account: "T2020003", status: "active", createdAt: "2020-03-15", lastLogin: "2025-03-11 09:20" },
  { id: 4, staffId: "T2022004", name: "陈志强", account: "T2022004", status: "inactive", createdAt: "2022-08-20", lastLogin: "2024-12-20 10:15" },
  { id: 5, staffId: "T2018005", name: "王丽华", account: "T2018005", status: "active", createdAt: "2018-06-10", lastLogin: "2025-03-12 08:00" },
  { id: 6, staffId: "T2023006", name: "刘鹏飞", account: "T2023006", status: "active", createdAt: "2023-09-01", lastLogin: "2025-03-10 15:30" },
];

export const mockCourses = [
  { id: 1, code: "CS101", name: "高等数学A", teacher: "刘晓红", college: "数学学院", semester: "2024-2025第二学期", students: 48, status: "active" },
  { id: 2, code: "CS201", name: "线性代数", teacher: "刘晓红", college: "数学学院", semester: "2024-2025第二学期", students: 52, status: "active" },
  { id: 3, code: "CS301", name: "数据结构", teacher: "王建国", college: "计算机学院", semester: "2024-2025第二学期", students: 45, status: "active" },
  { id: 4, code: "CS401", name: "操作系统", teacher: "王建国", college: "计算机学院", semester: "2024-2025第一学期", students: 40, status: "ended" },
];

export const classDashboardData: Record<number, {
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
      { status: "出勤", count: 145 }, { status: "迟到", count: 10 },
      { status: "请假", count: 6 }, { status: "缺勤", count: 4 },
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
      { status: "出勤", count: 135 }, { status: "迟到", count: 15 },
      { status: "请假", count: 10 }, { status: "缺勤", count: 10 },
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
      { status: "出勤", count: 155 }, { status: "迟到", count: 3 },
      { status: "请假", count: 2 }, { status: "缺勤", count: 0 },
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

export const attendanceTrend = [
  { week: "第1周", rate: 98 }, { week: "第2周", rate: 96 }, { week: "第3周", rate: 94 },
  { week: "第4周", rate: 91 }, { week: "第5周", rate: 95 }, { week: "第6周", rate: 93 },
  { week: "第7周", rate: 88 }, { week: "第8周", rate: 90 },
];

export const knowledgeData = [
  { subject: "微积分", value: 82 }, { subject: "线性代数", value: 74 },
  { subject: "概率统计", value: 65 }, { subject: "微分方程", value: 38 },
  { subject: "级数理论", value: 55 },
];

export const mockExams = [
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

export const scoreTrendWithClass = [
  { exam: "第1次测验", score: 72, classAvg: 75 },
  { exam: "第2次测验", score: 68, classAvg: 72 },
  { exam: "期中考试", score: 75, classAvg: 78 },
  { exam: "第3次测验", score: 80, classAvg: 76 },
  { exam: "第4次测验", score: 77, classAvg: 74 },
  { exam: "期末考试", score: 82, classAvg: 79 },
];

// ─── 教师端 Mock 数据 ────────────────────────────────────────────────────────
export const quizItems = [
  { id: 1, course: "高等数学A", preview: "设函数f(x)在x=a处可导，则lim...", topic: "微分方程", difficulty: "中等", status: "pending", answer: "B" },
  { id: 2, course: "线性代数", preview: "设A为n阶方阵，若A的行列式不为零...", topic: "行列式", difficulty: "困难", status: "approved", answer: "A" },
  { id: 3, course: "高等数学A", preview: "求不定积分∫x²e^x dx = ?", topic: "积分学", difficulty: "简单", status: "rejected", answer: "C" },
  { id: 4, course: "数据结构", preview: "以下哪种排序算法的最坏时间复杂度为O(n²)?", topic: "排序算法", difficulty: "中等", status: "pending", answer: "D" },
];

export const teacherOperationLogs = [
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

// ─── AI 出题相关 Mock 数据 ───────────────────────────────────────────────────
export const questionCategories = [
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

export const aiGeneratedQuestions = [
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
