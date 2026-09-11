import api from './api';

export interface QuestionBank {
  id: number;
  courseId?: number;
  questionType?: string;
  /** 内容 JSON：{ stem, options, answer, analysis } */
  content?: string;
  knowledgePoints?: string;
  aiGenerated?: number;
  difficulty?: string;
  status?: string;
  usageCount?: number;
  teacherId?: number;
  createTime?: string;

  // 旧字段（保留兼容，已废弃）
  questionContent?: string;
  options?: string;
  answer?: string;
  topic?: string;
  sourceType?: string;
  isPostgraduate?: number;
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
  courseId?: number;
  kpName: string;
  kpCategory?: string;
  parentId?: number;
  level?: number;
  difficulty?: string;
  description?: string;
  sortOrder?: number;
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

export interface AnalysisGenerateRequest {
  questionType?: string;
  difficulty?: string;
  knowledgePoints?: string;
  stem?: string;
  options?: Record<string, string>;
  answer?: string;
}

export async function generateQuestionAnalysis(params: AnalysisGenerateRequest) {
  const res = await api.post('/question-bank/analysis/generate', params);
  return res.data as string;
}

export interface BatchAnalysisResult {
  total: number;
  success: number;
  failed: number;
  failedIds: number[];
}

export async function batchGenerateAnalysis(courseId: number) {
  const res = await api.post('/question-bank/analysis/batch', null, { params: { courseId } });
  return res.data as BatchAnalysisResult;
}

export interface AutoGenerateResult {
  uncoveredKpCount: number;
  generatedCount: number;
  uncoveredKpNames: string[];
  failedKpNames: string[];
}

export async function autoGenerateForUncoveredKps(courseId: number, countPerKp = 2) {
  const res = await api.post('/question-bank/auto-generate', null, { params: { courseId, countPerKp } });
  return res.data as AutoGenerateResult;
}
