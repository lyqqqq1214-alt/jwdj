import api from './api';

export interface AiChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface AiChatRequest {
  message: string;
  courseId?: number;
  studentId?: number; // 教师端查看特定学生时传入
  socraticMode?: boolean;
  history?: AiChatMessage[];
}

export interface AiChatResponse {
  answer: string;
  assistantMode: string;
  socraticQuestions?: string[];
  socraticMode?: boolean;
}

export interface AiInsightMetricComment {
  metricName: string;
  comment: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface AiInsight {
  broadcast: string;
  metricComments: AiInsightMetricComment[];
  urgency: 'URGENT' | 'IMPORTANT' | 'NORMAL';
}

/**
 * AI 对话助手服务
 */
export async function sendChatMessage(params: AiChatRequest): Promise<AiChatResponse> {
  const res = await api.post('/ai/chat', params);
  return res.data as AiChatResponse;
}

/**
 * 获取AI洞察播报（用于驾驶舱顶部播报和指标点评）
 */
export async function getAiInsight(courseId: number): Promise<AiInsight> {
  const res = await api.get(`/ai/insight/${courseId}`);
  return res.data as AiInsight;
}
