import api from './api';

// 登录请求参数
export interface LoginParams {
  username: string;
  password: string;
}

// 登录响应数据
export interface LoginResult {
  token: string;
  userId: number;
  username: string;
  role: string;
  firstLogin: boolean;
  displayName: string;
}

// 修改密码请求参数
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

/**
 * 用户登录
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  const response = await api.post<any, any>('/auth/login', params);
  return response.data;
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * 修改密码
 */
export async function changePassword(params: ChangePasswordParams): Promise<void> {
  await api.put('/auth/change-password', params);
}

/**
 * 获取当前用户信息（从 localStorage）
 */
export function getCurrentUser(): LoginResult | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * 保存用户信息到 localStorage
 */
export function saveUser(user: LoginResult): void {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', user.token);
}

/**
 * 清除用户信息
 */
export function clearUser(): void {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * 角色映射：后端角色 -> 前端角色
 */
export function mapRole(backendRole: string): 'admin' | 'teacher' | 'teaching-assistant' | 'student' {
  const roleMap: Record<string, 'admin' | 'teacher' | 'teaching-assistant' | 'student'> = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    ASSISTANT: 'teaching-assistant',
    STUDENT: 'student',
  };
  return roleMap[backendRole] || 'student';
}
