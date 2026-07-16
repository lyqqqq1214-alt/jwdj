import api from './api';

export interface OperationLog {
  id: number;
  username?: string;
  logType?: string;
  action?: string;
  detail?: string;
  ip?: string;
  createTime?: string;
}

export interface LogPage {
  records: OperationLog[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export async function getOperationLogs(
  pageNum: number,
  pageSize: number,
  logType?: string,
  username?: string
) {
  const res = await api.get('/admin/logs', {
    params: { pageNum, pageSize, logType, username }
  });
  return res.data as LogPage;
}