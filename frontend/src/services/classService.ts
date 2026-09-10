import api from './api';

export interface ClassVO {
  id: number;
  className: string;
  courseNo?: string;
  courseName?: string;
  semester?: string;
  studentCount?: number;
  credit?: number;
  courseType?: string;
}

export interface StudentVO {
  id: number;
  studentId: number;
  studentNo: string;
  name: string;
  gender?: string;
  college?: string;
  major?: string;
  className?: string;
  email?: string;
}

export interface ClassCreateParams {
  name: string;
  courseName?: string;
  semester?: string;
}

export interface StudentAddParams {
  studentNo: string;
  name: string;
  password?: string;
  gender?: string;
  college?: string;
  major?: string;
  className?: string;
  email?: string;
}

export async function getMyClasses() {
  const res = await api.get('/classes');
  return res.data as ClassVO[];
}

export async function createClass(params: ClassCreateParams) {
  const res = await api.post('/classes', params);
  return res.data as ClassVO;
}

export async function updateClass(id: number, params: ClassCreateParams) {
  const res = await api.put(`/classes/${id}`, params);
  return res.data as ClassVO;
}

export async function deleteClass(id: number) {
  await api.delete(`/classes/${id}`);
}

export async function getClassStudents(classId: number, className?: string, keyword?: string) {
  const res = await api.get(`/classes/${classId}/students`, { params: { className: className || undefined, keyword } });
  return res.data as StudentVO[];
}

export async function addStudentToClass(classId: number, params: StudentAddParams) {
  const res = await api.post(`/classes/${classId}/students`, params);
  return res.data as StudentVO;
}

export async function removeStudentFromClass(classId: number, studentId: number) {
  await api.delete(`/classes/${classId}/students/${studentId}`);
}