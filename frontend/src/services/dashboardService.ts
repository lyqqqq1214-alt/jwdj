import api from './api';

export interface DashboardOverview {
  avgScore: string;
  attendanceRate: string;
  homeworkRate: string;
  studentCount?: number;
}

export interface DashboardCharts {
  scoreDist: { range: string; count: number }[];
  scoreTrend: { exam: string; score: number; type: string }[];
  attendanceStats: { status: string; count: number }[];
  homeworkSubmitStats: { homework: string; onTime: number; late: number; notSubmit: number }[];
  attendanceTrend: { week: string; rate: number }[];
  knowledgeData: { subject: string; value: number }[];
}

export interface WarningStudent {
  studentId: number;
  studentName: string;
  studentNo: string;
  reason: string;
  score: number;
  attendanceRate: number;
}

export interface ClassVO {
  id: number;
  className: string;
  courseNo?: string;
  courseName?: string;
  semester?: string;
  studentCount?: number;
  credit?: number;
  courseType?: string;
}

export async function getDashboardFull(courseId: number) {
  const res = await api.get('/dashboard', { params: { courseId } });
  return res.data as { overview: DashboardOverview; charts: DashboardCharts; warnings: WarningStudent[] };
}

export async function getDashboardOverview(courseId: number) {
  const res = await api.get('/dashboard/overview', { params: { courseId } });
  return res.data as DashboardOverview;
}

export async function getDashboardCharts(courseId: number) {
  const res = await api.get('/dashboard/charts', { params: { courseId } });
  return res.data as DashboardCharts;
}

export async function getDashboardWarnings(courseId: number) {
  const res = await api.get('/dashboard/warnings', { params: { courseId } });
  return res.data as WarningStudent[];
}

export async function getMyCourses() {
  const res = await api.get('/dashboard/courses');
  return res.data as ClassVO[];
}