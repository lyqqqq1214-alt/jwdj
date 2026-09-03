import api from './api';

// ─── AI 智能分析报告 ──────────────────────────────────────────────────────────
export interface StudentAttendance {
  studentId: number;
  studentNo?: string;
  name?: string;
  presentCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
  attendanceRate: number;
  level: string; // 正常 / 关注 / 预警
}

export interface AttendanceModule {
  classAvgRate: number; // 参考项：班级平均到课率
  students: StudentAttendance[];
}

export interface KpAdvice {
  kpName: string;
  classAvgRate: number;
  studentCount: number;
  weakStudentCount: number;
  suggestion: 'RETEACH' | 'REINFORCE' | 'OK';
}

export interface StudentRisk {
  studentId: number;
  studentNo?: string;
  name?: string;
  attendanceRate: number;
  homeworkAvg?: number | null;
  examAvg?: number | null;
  riskLevel: 'HIGH' | 'MEDIUM';
  reasons: string[];
}

export interface AssessmentStat {
  assessmentId: number;
  assessmentName: string;
  assessmentType: string; // HOMEWORK/QUIZ/EXPERIMENT/MIDTERM/FINAL
  totalScore: number;
  avgScore: number;
  scoreRate: number; // 得分率（参考项）
  absentCount: number;
  lowScoreCount: number;
}

export interface KpFeedback {
  kpName: string;
  count: number;
  aspect?: string | null;
}

export interface AiAnalysisReport {
  courseId: number;
  courseName?: string;
  semester?: string;
  generatedAt: string;
  aiSummary: string;
  aiAvailable: boolean;
  attendance: AttendanceModule;
  knowledge: KpAdvice[];
  alerts: StudentRisk[];
  scores: AssessmentStat[];
  feedback: KpFeedback[];
}

// ─── 题库整理判断 ─────────────────────────────────────────────────────────────
export interface TypeStat {
  questionType: string;
  count: number;
}

export interface KpCoverage {
  kpName: string;
  questionCount: number;
}

export interface DuplicateGroup {
  stem: string;
  questionIds: number[];
}

export interface QuestionBankAudit {
  courseId: number;
  total: number;
  aiGenerated: number;
  pendingReview: number;
  typeDistribution: TypeStat[];
  kpCoverage: KpCoverage[];
  uncoveredKps: string[];
  duplicates: DuplicateGroup[];
  avgClarity?: number | null;
  avgDifficultyMatch?: number | null;
  avgAmbiguity?: number | null;
  avgKpCoverage?: number | null;
  suggestions: string[];
  aiJudgment: string;
  aiAvailable: boolean;
}

const typeLabels: Record<string, string> = {
  SINGLE: '单选题', MULTI: '多选题', FILL: '填空题', SHORT: '简答题', COMPREHENSIVE: '综合题',
  HOMEWORK: '作业', QUIZ: '测验', EXPERIMENT: '实验', MIDTERM: '期中', FINAL: '期末',
};

export const assessmentTypeLabel = (t: string) => typeLabels[t] || t;
export const questionTypeLabel = (t: string) => typeLabels[t] || t;

export async function getAiAnalysisReport(courseId: number) {
  const res = await api.get('/ai-analysis/report', { params: { courseId } });
  return res.data as AiAnalysisReport;
}

export async function getQuestionBankAudit(courseId: number) {
  const res = await api.get('/ai-analysis/question-bank-audit', { params: { courseId } });
  return res.data as QuestionBankAudit;
}
