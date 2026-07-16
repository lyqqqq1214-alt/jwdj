import api from './api';

export interface ExamPaper {
  id: number;
  paperName?: string;
  courseId?: number;
  courseName?: string;
  status?: string;
  totalScore?: number;
  createTime?: string;
}

export interface ExamPage {
  records: ExamPaper[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export async function getExamPapers(pageNum: number, pageSize: number, courseId?: number) {
  const res = await api.get('/exams/papers', { params: { pageNum, pageSize, courseId } });
  return res.data as ExamPage;
}

export async function getExamPaperById(id: number) {
  const res = await api.get(`/exams/papers/${id}`);
  return res.data as ExamPaper;
}

export async function createExamPaper(params: any) {
  const res = await api.post('/exams/papers', params);
  return res.data as ExamPaper;
}

export async function updateExamPaper(id: number, params: any) {
  const res = await api.put(`/exams/papers/${id}`, params);
  return res.data as ExamPaper;
}

export async function deleteExamPaper(id: number) {
  await api.delete(`/exams/papers/${id}`);
}

export async function publishExamPaper(id: number) {
  await api.put(`/exams/papers/${id}/publish`);
}

export async function closeExamPaper(id: number) {
  await api.put(`/exams/papers/${id}/close`);
}

export async function getExamResults(paperId: number) {
  const res = await api.get(`/exams/papers/${paperId}/results`);
  return res.data;
}

export async function getPendingExams() {
  const res = await api.get('/exams/student/pending');
  return res.data as ExamPaper[];
}

export async function getStudentExam(paperId: number) {
  const res = await api.get(`/exams/student/${paperId}`);
  return res.data as ExamPaper;
}

export async function submitExam(paperId: number, answers: Record<number, string>) {
  await api.post(`/exams/student/${paperId}/submit`, answers);
}