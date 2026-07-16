import api from './api';

export interface AiQuestionGenerateRequest {
  courseId?: number;
  topic?: string;
  questionType?: string;
  difficulty?: string;
  count?: number;
}

export interface AiGeneratedQuestion {
  questionContent?: string;
  options?: string;
  answer?: string;
  questionType?: string;
  difficulty?: string;
  topic?: string;
}

export async function generateQuestions(params: AiQuestionGenerateRequest) {
  const res = await api.post('/quiz/generate', params);
  return res.data as AiGeneratedQuestion[];
}