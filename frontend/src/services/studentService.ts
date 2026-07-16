import api from './api';

export interface StudentOverview {
  currentScore: number;
  attendanceRate: number;
  homeworkRate: number;
  pendingExams: number;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface StudentWrongQuestion {
  id: number;
  questionContent: string;
  studentAnswer?: string;
  correctAnswer?: string;
  knowledgePoint?: string;
  courseName?: string;
  createTime?: string;
}

export async function getStudentOverview(courseId: number) {
  const res = await api.get('/student/overview', { params: { courseId } });
  return res.data as StudentOverview;
}

export async function getStudentPortrait(courseId: number) {
  const res = await api.get('/student/portrait', { params: { courseId } });
  return res.data as Record<string, any>;
}

export async function getStudentTrends(courseId: number) {
  const res = await api.get('/student/trends', { params: { courseId } });
  return res.data as ChartItem[];
}

export async function getStudentWrongQuestions(courseId: number) {
  const res = await api.get('/student/wrong-questions', { params: { courseId } });
  return res.data as StudentWrongQuestion[];
}

export async function getStudentWrongQuestionDetail(id: number) {
  const res = await api.get(`/student/wrong-questions/${id}`);
  return res.data as StudentWrongQuestion;
}