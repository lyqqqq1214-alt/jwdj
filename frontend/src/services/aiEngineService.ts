import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WarningDimension {
  dimension: string;
  riskValue: number;
  warningCount: number;
}

export interface AiWarningRadar {
  dimensions: WarningDimension[];
}

export interface AiSuggestion {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  content: string;
  expectedEffect: string;
}

export interface AiSuggestionList {
  suggestions: AiSuggestion[];
}

export interface TrendPoint {
  timePoint: string;
  value: number;
  dataType: string;
}

export interface AiTrendPrediction {
  historicalData: TrendPoint[];
  predictionData: TrendPoint[];
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  predictionAccuracy: number;
}

// ─── AI智能诊断 ───────────────────────────────────────────────────────────────

export interface AiDiagnosis {
  summary: string;
  keyFindings: string;
  improvementDirection: string;
  urgency: 'URGENT' | 'IMPORTANT' | 'NORMAL';
  diagnosedAt: string;
}

// ─── 预警学生深度分析 ─────────────────────────────────────────────────────────

export interface AiWarningStudentAnalysis {
  studentId: number;
  studentName: string;
  studentNo: string;
  score: number;
  attendanceRate: number;
  warningReason: string;
  aiProblemAnalysis: string;
  interventionPlans: string[];
  estimatedRecovery: string;
}

// ─── AI知识点掌握预测 ─────────────────────────────────────────────────────────

export interface KnowledgePredictionItem {
  name: string;
  currentMastery: number;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  aiAnalysis: string;
}

export interface AiKnowledgePrediction {
  difficultPoints: KnowledgePredictionItem[];
  aiTeachingSuggestion: string;
  suggestedExtraHours: number;
  predictedMasteryRate: number;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function getWarningRadar(courseId: number): Promise<AiWarningRadar> {
  const res = await api.get(`/ai-engine/warning-radar/${courseId}`);
  return res.data;
}

export async function getSuggestions(courseId: number): Promise<AiSuggestionList> {
  const res = await api.get(`/ai-engine/suggestions/${courseId}`);
  return res.data;
}

export async function getTrendPrediction(courseId: number): Promise<AiTrendPrediction> {
  const res = await api.get(`/ai-engine/trend/${courseId}`);
  return res.data;
}

export async function getAiDiagnosis(courseId: number): Promise<AiDiagnosis> {
  const res = await api.get(`/ai-engine/diagnosis/${courseId}`);
  return res.data;
}

export async function getWarningStudentAnalysis(courseId: number): Promise<AiWarningStudentAnalysis[]> {
  const res = await api.get(`/ai-engine/warning-students/${courseId}`);
  return res.data;
}

export async function getKnowledgePrediction(courseId: number): Promise<AiKnowledgePrediction> {
  const res = await api.get(`/ai-engine/knowledge-prediction/${courseId}`);
  return res.data;
}
