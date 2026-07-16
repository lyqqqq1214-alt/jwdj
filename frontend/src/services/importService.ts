import api from './api';

export interface ImportResult {
  status: string;
  successRows: number;
  failRows: number;
  totalRows?: number;
  errors?: string[];
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

export async function uploadFile(file: File, importType: string, sourceId?: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('importType', importType);
  if (sourceId) {
    formData.append('sourceId', sourceId.toString());
  }
  const res = await api.post('/import/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data as ImportResult;
}

export async function getImportHistory(pageNum: number, pageSize: number, importType?: string) {
  const res = await api.get('/import/history', {
    params: { pageNum, pageSize, importType }
  });
  return res.data as ImportLogPage;
}

export function getTemplateUrl(importType: string) {
  return `/api/import/template/${importType}`;
}