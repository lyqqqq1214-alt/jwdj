import api from './api';

export interface AiQuestionGenerateRequest {
  knowledgePoints: string[];
  questionType: string;
  count: number;
  difficulty: string;
  socraticMode: boolean;
}

export interface AiGeneratedQuestion {
  questionType: string;
  stem: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
  knowledgeTags: string[];
  socraticQuestions: string[];
}

export async function generateQuestions(params: AiQuestionGenerateRequest) {
  const res = await api.post('/quiz/generate', params);
  return res.data as AiGeneratedQuestion[];
}