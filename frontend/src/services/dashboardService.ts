import api from './api';

export interface DashboardOverview {
  studentCount?: number;
  averageScore?: number;
  attendanceRate?: number;
  homeworkRate?: number;
  warningCount?: number;
}

export interface ChartItem {
  name: string;
  value: number;
  color?: string;
}

export interface HomeworkStat {
  homeworkName: string;
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
}

export interface DashboardCharts {
  scoreDistribution: ChartItem[];
  scoreTrend: ChartItem[];
  attendanceStats: ChartItem[];
  homeworkStats: HomeworkStat[];
  knowledgeRadar: ChartItem[];
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
  avgScore?: number;
  attendanceRate?: number;
  homeworkRate?: number;
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