import api from './api';

export interface DataSourceVO {
  id: number;
  sourceName: string;
  sourceType: string;
  filePath: string;
  description: string;
  status: string;
  createTime: string;
  updateTime: string;
}

export interface DataSourcePage {
  records: DataSourceVO[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export async function getDataSourceList(pageNum: number, pageSize: number, sourceType?: string) {
  const res = await api.get('/datasource', {
    params: { pageNum, pageSize, sourceType }
  });
  return res.data as DataSourcePage;
}

export async function getDataSourceById(id: number) {
  const res = await api.get(`/datasource/${id}`);
  return res.data as DataSourceVO;
}

export async function createDataSource(data: Partial<DataSourceVO>) {
  const res = await api.post('/datasource', data);
  return res.data as DataSourceVO;
}

export async function updateDataSource(id: number, data: Partial<DataSourceVO>) {
  const res = await api.put(`/datasource/${id}`, data);
  return res.data as DataSourceVO;
}

export async function deleteDataSource(id: number) {
  await api.delete(`/datasource/${id}`);
}

export async function getActiveDataSources() {
  const res = await api.get('/datasource/active');
  return res.data as DataSourceVO[];
}