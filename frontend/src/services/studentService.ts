import api from './api';

export interface StudentOverview {
  currentScore: number;
  attendanceRate: number;
  homeworkRate: number;
  pendingExams: number;
}

export interface StudentCourse {
  id: number;
  courseNo: string;
  courseName: string;
  className: string;
  teacherName: string;
  semester: string;
  credit: number;
  courseType: string;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface ScoreTrendItem {
  name: string;
  score: number;
  classAvg: number;
}

export interface StudentWrongQuestion {
  id: number;
  questionContent: string;
  studentAnswer?: string;
  correctAnswer?: string;
  knowledgePoints?: string;
  analysis?: string;
  courseName?: string;
  createTime?: string;
}

export interface ManualWrongQuestionRequest {
  courseId?: number | null;
  question: string;
  options: string;
  correctAnswer: string;
  studentAnswer: string;
  knowledgePoints: string;
  remark?: string;
  source?: 'MANUAL' | 'AI_GENERATE';
}

export async function getStudentCourses() {
  const res = await api.get('/student/courses');
  return res.data as StudentCourse[];
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
  return res.data as ScoreTrendItem[];
}

export async function getStudentWrongQuestions(courseId?: number | null) {
  const res = await api.get('/student/wrong-questions', { params: { courseId } });
  return res.data as StudentWrongQuestion[];
}

export async function getStudentWrongQuestionDetail(id: number) {
  const res = await api.get(`/student/wrong-questions/${id}`);
  return res.data as StudentWrongQuestion;
}

export async function createStudentWrongQuestion(payload: ManualWrongQuestionRequest) {
  const res = await api.post('/student/wrong-questions', payload);
  return res.data as StudentWrongQuestion;
}

export async function analyzeWrongQuestion(id: number) {
  const res = await api.post(`/student/wrong-questions/${id}/analysis`);
  return res.data as string;
}

export async function generateSimilarQuestions(id: number, count = 3, difficulty = 'MEDIUM') {
  const res = await api.post(`/student/wrong-questions/${id}/similar-questions`, null,
    { params: { count, difficulty } });
  return res.data as any[];
}
