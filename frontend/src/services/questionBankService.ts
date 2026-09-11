import api from './api';

export interface QuestionBank {
  id: number; courseId?: number; questionType?: string; content?: string; knowledgePoints?: string;
  aiGenerated?: number; difficulty?: string; status?: string; usageCount?: number; teacherId?: number; createTime?: string;
  questionContent?: string; options?: string; answer?: string; topic?: string; sourceType?: string; isPostgraduate?: number;
}
export interface QuestionPage { records: QuestionBank[]; total: number; size: number; current: number; pages: number; }
export interface KnowledgePoint { id: number; courseId?: number; kpName: string; kpCategory?: string; parentId?: number; level?: number; difficulty?: string; description?: string; sortOrder?: number; }

export async function getQuestionList(pageNum: number, pageSize: number, courseId?: number, questionType?: string, difficulty?: string, keyword?: string) {
  const res = await api.get('/question-bank', { params: { pageNum, pageSize, courseId, questionType, difficulty, keyword } });
  return res.data as QuestionPage;
}
export async function getQuestionById(id: number) { return (await api.get(`/question-bank/${id}`)).data as QuestionBank; }
export async function createQuestion(params: Partial<QuestionBank>) { return (await api.post('/question-bank', params)).data as QuestionBank; }
export async function updateQuestion(id: number, params: Partial<QuestionBank>) { return (await api.put(`/question-bank/${id}`, params)).data as QuestionBank; }
export async function deleteQuestion(id: number) { await api.delete(`/question-bank/${id}`); }
export async function getKnowledgeTree(courseId: number) { return (await api.get('/question-bank/knowledge-tree', { params: { courseId } })).data as KnowledgePoint[]; }

export interface AnalysisGenerateRequest { questionType?: string; difficulty?: string; knowledgePoints?: string; stem?: string; options?: Record<string, string>; answer?: string; }
export async function generateQuestionAnalysis(params: AnalysisGenerateRequest) { return (await api.post('/question-bank/analysis/generate', params)).data as string; }

export interface AnalysisPreviewItem { questionId: number; stem: string; answer: string; analysis: string; }
export interface BatchAnalysisResult { total: number; success: number; failed: number; failedIds: number[]; remaining: number; previewItems: AnalysisPreviewItem[]; }
export async function batchGenerateAnalysis(courseId: number, limit = 10) {
  return (await api.post('/question-bank/analysis/batch', null, { params: { courseId, limit } })).data as BatchAnalysisResult;
}
export async function confirmQuestionAnalyses(courseId: number, items: AnalysisPreviewItem[]) {
  return (await api.post('/question-bank/analysis/confirm', { items }, { params: { courseId } })).data as number;
}

export interface AiGeneratedQuestion { questionType: string; stem: string; options: Record<string, string>; answer: string; explanation: string; knowledgeTags: string[]; socraticQuestions: string[]; }
export interface AutoGenerateResult { uncoveredKpCount: number; generatedCount: number; uncoveredKpNames: string[]; failedKpNames: string[]; skippedKpNames: string[]; previewQuestions: AiGeneratedQuestion[]; }
export async function autoGenerateForUncoveredKps(courseId: number, countPerKp = 2, questionType = 'SINGLE', difficulty = 'MEDIUM', maxKnowledgePoints = 10) {
  return (await api.post('/question-bank/auto-generate', null, { params: { courseId, countPerKp, questionType, difficulty, maxKnowledgePoints } })).data as AutoGenerateResult;
}
export async function confirmGeneratedQuestions(courseId: number, difficulty: string, questions: AiGeneratedQuestion[]) {
  return (await api.post('/question-bank/auto-generate/confirm', { difficulty, questions }, { params: { courseId } })).data as number;
}
