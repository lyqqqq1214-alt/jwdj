import api from './api';

export async function askTeacherAi(message: string): Promise<string> {
  const res = await api.post('/teacher/ai-chat', { message });
  return res.data?.answer || '';
}
