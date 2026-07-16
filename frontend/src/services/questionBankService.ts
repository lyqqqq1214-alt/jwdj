import api from './api';

export interface QuestionBank {
  id: number;
  courseId?: number;
  questionType?: string;
  questionContent?: string;
  options?: string;
  answer?: string;
  difficulty?: string;
  topic?: string;
  sourceType?: string;
  isPostgraduate?: number;
  createTime?: string;
}

export interface QuestionPage {
  records: QuestionBank[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface KnowledgePoint {
  id: number;
  name: string;
  parentId?: number;
  children?: KnowledgePoint[];
}

export async function getQuestionList(
  pageNum: number,
  pageSize: number,
  courseId?: number,
  questionType?: string,
  difficulty?: string,
  keyword?: string
) {
  const res = await api.get('/question-bank', {
    params: { pageNum, pageSize, courseId, questionType, difficulty, keyword }
  });
  return res.data as QuestionPage;
}

export async function getQuestionById(id: number) {
  const res = await api.get(`/question-bank/${id}`);
  return res.data as QuestionBank;
}

export async function createQuestion(params: Partial<QuestionBank>) {
  const res = await api.post('/question-bank', params);
  return res.data as QuestionBank;
}

export async function updateQuestion(id: number, params: Partial<QuestionBank>) {
  const res = await api.put(`/question-bank/${id}`, params);
  return res.data as QuestionBank;
}

export async function deleteQuestion(id: number) {
  await api.delete(`/question-bank/${id}`);
}

export async function getKnowledgeTree(courseId: number) {
  const res = await api.get('/question-bank/knowledge-tree', { params: { courseId } });
  return res.data as KnowledgePoint[];
}