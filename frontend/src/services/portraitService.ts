import api from './api';

export interface AttendanceItem {
  date?: string;
  status?: string;
  weekNo?: number;
  remark?: string;
}

export interface HomeworkItem {
  name?: string;
  score?: number;
  submitStatus?: string;
  submitTime?: string;
}

export interface ExperimentItem {
  name?: string;
  experimentNo?: number;
  score?: number;
  submitTime?: string;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface CategoryTrend {
  category: string;
  scores: number[];
}

export interface TrendDTO {
  semesters: string[];
  overallScores: number[];
  categoryTrends: CategoryTrend[];
}

export interface StudentProfile {
  studentId: number;
  studentNo: string;
  name: string;
  gender?: string;
  college?: string;
  major?: string;
  className?: string;
  grade?: string;
  avatar?: string;
  isFocus?: boolean;
  scoreTrendList?: TrendDTO[];
  attendanceList?: AttendanceItem[];
  attendanceRate?: number;
  absentCount?: number;
  lateCount?: number;
  leaveCount?: number;
  homeworkList?: HomeworkItem[];
  experimentList?: ExperimentItem[];
  knowledgeRadar?: ChartItem[];
  classAvgRadar?: ChartItem[];
  aiEvaluation?: string;
}

// 教师/助教端：获取学生画像
export async function getStudentProfile(studentId: number, courseId: number) {
  const res = await api.get(`/portrait/student/${studentId}`, { params: { courseId } });
  return res.data as StudentProfile;
}

// 教师/助教端：标记/取消重点关注
export async function toggleFocusStudent(studentId: number, courseId: number, focus: boolean) {
  await api.put(`/portrait/student/${studentId}/focus`, { focus }, { params: { courseId } });
}

// 教师/助教端：生成AI评价
export async function generateAiEvaluation(studentId: number, courseId: number) {
  const res = await api.post(`/portrait/student/${studentId}/ai-evaluation`, null, { params: { courseId } });
  return res.data as string;
}

// 学生端：获取个人画像
export async function getMyPortrait(courseId: number) {
  const res = await api.get('/student/portrait', { params: { courseId } });
  return res.data as StudentProfile;
}