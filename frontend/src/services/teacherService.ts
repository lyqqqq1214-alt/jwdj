import api from './api';

export interface TeacherVO {
  id: number;
  teacherNo: string;
  name: string;
  gender?: string;
  college?: string;
  department?: string;
  title?: string;
  email?: string;
  status: string;
  userId?: number;
  createTime?: string;
  lastLoginTime?: string;
}

export interface TeacherPage {
  records: TeacherVO[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface TeacherCreateParams {
  teacherNo: string;
  name: string;
  password?: string;
  gender?: string;
  college?: string;
  department?: string;
  title?: string;
  email?: string;
}

export interface TeacherUpdateParams {
  name?: string;
  gender?: string;
  college?: string;
  department?: string;
  title?: string;
  email?: string;
}

export async function getTeacherList(pageNum: number, pageSize: number, keyword?: string) {
  const res = await api.get('/admin/teachers', { params: { pageNum, pageSize, keyword } });
  return res.data as TeacherPage;
}

export async function getTeacherById(id: number) {
  const res = await api.get(`/admin/teachers/${id}`);
  return res.data as TeacherVO;
}

export async function createTeacher(params: TeacherCreateParams) {
  const res = await api.post('/admin/teachers', params);
  return res.data as TeacherVO;
}

export async function updateTeacher(id: number, params: TeacherUpdateParams) {
  const res = await api.put(`/admin/teachers/${id}`, params);
  return res.data as TeacherVO;
}

export async function deleteTeacher(id: number) {
  await api.delete(`/admin/teachers/${id}`);
}

export async function updateTeacherStatus(id: number, status: string) {
  await api.put(`/admin/teachers/${id}/status`, { status });
}

export async function resetTeacherPassword(id: number) {
  const res = await api.put(`/admin/teachers/${id}/reset-password`);
  return res.data as { newPassword: string };
}