import api from './api';

// ===== 类型 =====

export interface ExamPaper {
  id: number;
  paperName?: string;
  courseId?: number;
  courseName?: string;
  teacherId?: number;
  totalScore?: number;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  targetClasses?: string;
  targetStudents?: string;
  status?: string;
  createTime?: string;
  ungradedCount?: number;
}

export interface ExamPage {
  records: ExamPaper[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface ExamPaperCreateDTO {
  paperName: string;
  courseId: number;
  totalScore?: number;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  targetClasses?: string;
  targetStudents?: string;
  questions?: { questionId: number; questionNo: number; score: number; content?: string }[];
}

export interface ExamResultDTO {
  averageScore?: number;
  maxScore?: number;
  minScore?: number;
  passRate?: number;
  totalStudents?: number;
  submittedCount?: number;
  scoreDistribution?: { name: string; value: number }[];
  questionStats?: {
    questionId: number; questionNo: number; correctRate?: number; questionType: string;
    questionStem?: string; knowledgePoints?: string; answerCount?: number;
    correctCount?: number; wrongCount?: number;
  }[];
  studentScores?: {
    studentId: number;
    studentNo?: string;
    name?: string;
    totalScore?: number;
    submitStatus?: string;
    submitTime?: string;
  }[];
}

export interface GradingItemVO {
  answerId: number;
  recordId: number;
  paperId: number;
  paperName?: string;
  studentId: number;
  studentNo?: string;
  studentName?: string;
  questionNo: number;
  questionType?: string;
  questionStem?: string;
  studentAnswer?: string;
  correctAnswer?: string;
  maxScore?: number;
  score?: number;
  submitTime?: string;
}

export interface StudentExamVO {
  paperId: number;
  paperName?: string;
  courseId?: number;
  totalScore?: number;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  status?: string;
  questions: {
    questionId: number;
    questionNo: number;
    questionType?: string;
    score?: number;
    stem?: string;
    options?: { label: string; text: string }[];
    knowledgePoints?: string;
  }[];
}

export interface SubmitExamResultDTO {
  objectiveScore?: number;
  totalScore?: number;
  objectiveCount?: number;
  subjectiveCount?: number;
}

export interface StudentExamRecordVO {
  recordId: number;
  paperId: number;
  paperName?: string;
  courseId?: number;
  courseName?: string;
  totalScore?: number;
  myScore?: number;
  objectiveScore?: number;
  subjectivePending?: number;
  submitTime?: string;
  status?: string;
}

export interface StudentExamResultVO {
  paperId: number;
  paperName?: string;
  totalScore?: number;
  myScore?: number;
  objectiveScore?: number;
  subjectivePending?: number;
  submitTime?: string;
  answers: {
    questionNo: number;
    questionType?: string;
    stem?: string;
    options?: { label: string; text: string }[];
    studentAnswer?: string;
    correctAnswer?: string;
    score?: number;
    maxScore?: number;
    isCorrect?: number;
    graded?: number;
    comment?: string;
  }[];
}

export interface PaperGradingQuestionItem {
  answerId: number;
  questionId: number;
  questionNo: number;
  questionType?: string;
  stem?: string;
  options?: { label: string; text: string }[];
  studentAnswer?: string;
  correctAnswer?: string;
  maxScore?: number;
  score?: number;
  graded?: number;
  comment?: string;
}

export interface PaperGradingStudentItem {
  recordId: number;
  studentId: number;
  studentNo?: string;
  studentName?: string;
  submitTime?: string;
  objectiveScore?: number;
  totalScore?: number;
  pendingCount?: number;
  questions: PaperGradingQuestionItem[];
}

export interface PaperGradingVO {
  paperId: number;
  paperName?: string;
  totalScore?: number;
  students: PaperGradingStudentItem[];
}

export interface PaperQuestionEditVO {
  questionId: number;
  questionNo: number;
  questionType?: string;
  score?: number;
  stem?: string;
  options?: { label: string; text: string }[];
  answer?: string;
  analysis?: string;
  knowledgePoints?: string;
}

export interface StudentGradeItem {
  answerId: number;
  score: number;
  comment?: string;
}

// ===== 教师端：试卷管理 =====

export async function getExamPapers(pageNum: number, pageSize: number, courseId?: number) {
  const res = await api.get('/exams/papers', { params: { pageNum, pageSize, courseId } });
  return res.data as ExamPage;
}

export async function getExamPaperById(id: number) {
  const res = await api.get(`/exams/papers/${id}`);
  return res.data as ExamPaper;
}

export async function createExamPaper(params: ExamPaperCreateDTO) {
  const res = await api.post('/exams/papers', params);
  return res.data as ExamPaper;
}

export async function updateExamPaper(id: number, params: ExamPaperCreateDTO) {
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

// ===== 教师端：结果与批阅 =====

export async function getExamResults(paperId: number) {
  const res = await api.get(`/exams/papers/${paperId}/results`);
  return res.data as ExamResultDTO;
}

export async function getGradingList(courseId: number, paperId?: number) {
  const res = await api.get('/exams/grading/list', { params: { courseId, paperId } });
  return res.data as GradingItemVO[];
}

export async function submitGrade(answerId: number, score: number, comment?: string) {
  await api.put(`/exams/grading/${answerId}`, { score, comment });
}

export interface AiGradeSuggestion {
  suggestedScore: number;
  comment: string;
}

export async function getAiGradeSuggestion(answerId: number) {
  const res = await api.post(`/exams/grading/${answerId}/ai-suggestion`);
  return res.data as AiGradeSuggestion;
}

export async function getPaperQuestions(paperId: number) {
  const res = await api.get(`/exams/papers/${paperId}/questions`);
  return res.data as PaperQuestionEditVO[];
}

export async function getPaperGrading(paperId: number) {
  const res = await api.get(`/exams/papers/${paperId}/grading`);
  return res.data as PaperGradingVO;
}

export async function submitStudentGrade(recordId: number, grades: StudentGradeItem[]) {
  const res = await api.put(`/exams/grading/student/${recordId}`, { grades });
  return res.data as number;
}

// ===== 学生端：在线考试 =====

export async function getPendingExams() {
  const res = await api.get('/exams/student/pending');
  return res.data as ExamPaper[];
}

export async function getStudentExam(paperId: number) {
  const res = await api.get(`/exams/student/${paperId}`);
  return res.data as StudentExamVO;
}

export async function submitExam(paperId: number, answers: Record<number, string>) {
  const res = await api.post(`/exams/student/${paperId}/submit`, answers);
  return res.data as SubmitExamResultDTO;
}

export async function getMyExamRecords() {
  const res = await api.get('/exams/student/records');
  return res.data as StudentExamRecordVO[];
}

export async function getMyExamResult(paperId: number) {
  const res = await api.get(`/exams/student/records/${paperId}`);
  return res.data as StudentExamResultVO;
}
