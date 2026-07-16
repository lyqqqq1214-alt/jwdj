import api from './api';

export interface ImportResult {
  status: string;
  successRows: number;
  failRows: number;
  skippedRows?: number;
  totalRows?: number;
  errors?: string[];
  warnings?: string[];
}

export interface ImportLog {
  id: number;
  fileName?: string;
  importType?: string;
  status?: string;
  successRows?: number;
  failRows?: number;
  createTime?: string;
}

export interface ImportLogPage {
  records: ImportLog[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface UploadOptions {
  sourceId?: number;
  /** 归属课程 ID（成绩/考勤/实验/学生名单导入必填） */
  courseId?: number;
  /** 考核名称（作业/测验/期中期末成绩导入必填） */
  assessmentName?: string;
  /** 考核类型（仅期中/期末成绩：MIDTERM / FINAL） */
  assessmentType?: string;
}

export async function uploadFile(file: File, importType: string, options: UploadOptions = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('importType', importType);
  if (options.sourceId) {
    formData.append('sourceId', options.sourceId.toString());
  }
  if (options.courseId) {
    formData.append('courseId', options.courseId.toString());
  }
  if (options.assessmentName) {
    formData.append('assessmentName', options.assessmentName);
  }
  if (options.assessmentType) {
    formData.append('assessmentType', options.assessmentType);
  }
  const res = await api.post('/import/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000  // 上传+后端解析耗时较长，覆盖全局 10s 超时
  });
  return res.data as ImportResult;
}

export async function getImportHistory(pageNum: number, pageSize: number, importType?: string) {
  const res = await api.get('/import/history', {
    params: { pageNum, pageSize, importType }
  });
  return res.data as ImportLogPage;
}

/** 带鉴权下载导入模板（返回 Blob，由调用方触发浏览器下载） */
export async function downloadTemplate(importType: string): Promise<Blob> {
  const res = await api.get(`/import/template/${importType}`, {
    responseType: 'blob',
    timeout: 30000
  });
  return res.data as Blob;
}

export function getTemplateUrl(importType: string) {
  return `/api/import/template/${importType}`;
}
