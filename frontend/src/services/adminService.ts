import api from "./api";

// ===== 类型 =====

export interface AdminStats {
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  adminCount: number;
  teacherUserCount: number;
  assistantCount: number;
  studentUserCount: number;
  activeUserCount: number;
}

export interface AdminCourse {
  id: number;
  courseNo?: string;
  courseName?: string;
  className?: string;
  semester?: string;
  credit?: number;
  courseType?: string;
  teacherId?: number;
  teacherName?: string;
  studentCount?: number;
}

export interface AdminStudent {
  id: number;
  studentNo?: string;
  name?: string;
  gender?: string;
  college?: string;
  major?: string;
  className?: string;
  grade?: string;
  teacherId?: number;
  createTime?: string;
  status?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "ASSISTANT" | "STUDENT";
  status: "ACTIVE" | "DISABLED";
  college?: string;
  major?: string;
  className?: string;
  grade?: string;
  createTime?: string;
  lastLoginTime?: string;
}

// ===== 管理员端接口 =====

/** 系统总览统计 */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get("/admin/dashboard/stats");
  return res.data as AdminStats;
}

/** 全部课程列表 */
export async function getAdminCourses(
  pageNum: number,
  pageSize: number,
  keyword?: string
): Promise<PageResult<AdminCourse>> {
  const res = await api.get("/admin/courses", { params: { pageNum, pageSize, keyword } });
  return res.data as PageResult<AdminCourse>;
}

/** 删除课程 */
export async function deleteAdminCourse(id: number) {
  await api.delete(`/admin/courses/${id}`);
}

export async function createAdminCourse(params: Partial<AdminCourse> & { courseNo: string; courseName: string; teacherId: number; semester: string }) {
  const res = await api.post("/admin/courses", params);
  return res.data as AdminCourse;
}

/** 全部学生列表 */
export async function getAdminStudents(
  pageNum: number,
  pageSize: number,
  keyword?: string
): Promise<PageResult<AdminStudent>> {
  const res = await api.get("/admin/students", { params: { pageNum, pageSize, keyword } });
  return res.data as PageResult<AdminStudent>;
}

/** 删除学生 */
export async function deleteAdminStudent(id: number) {
  await api.delete(`/admin/students/${id}`);
}

export async function getAdminUsers(pageNum = 1, pageSize = 200, keyword?: string, role?: string) {
  const res = await api.get("/admin/users", { params: { pageNum, pageSize, keyword, role } });
  return res.data as PageResult<AdminUser>;
}
export async function createAdminUser(params: Partial<AdminUser> & { username: string; password: string; role: string }) {
  const res = await api.post("/admin/users", params); return res.data as AdminUser;
}
export async function updateAdminUser(id: number, params: Partial<AdminUser>) {
  const res = await api.put(`/admin/users/${id}`, params); return res.data as AdminUser;
}
export async function updateAdminUserStatus(id: number, status: "ACTIVE" | "DISABLED") { await api.put(`/admin/users/${id}/status`, { status }); }
export async function resetAdminUserPassword(id: number) { const res = await api.put(`/admin/users/${id}/reset-password`); return res.data as { newPassword: string }; }
export async function deleteAdminUser(id: number) { await api.delete(`/admin/users/${id}`); }
