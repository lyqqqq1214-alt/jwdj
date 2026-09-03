import api from './api';

export interface Notification {
  id: number;
  title: string;
  content: string;
  senderName?: string;
  isRead?: number;
  createTime?: string;
}

export interface NotificationPage {
  records: Notification[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface SendNotificationParams {
  title: string;
  content: string;
  recipientScope?: string;
  courseId?: number;
  studentIds?: number[];
}

export async function getMyNotifications(pageNum: number, pageSize: number) {
  const res = await api.get('/notifications', { params: { pageNum, pageSize } });
  return res.data as NotificationPage;
}

export async function getUnreadCount() {
  const res = await api.get('/notifications/unread-count');
  return res.data as number;
}

export async function sendNotification(params: SendNotificationParams) {
  const res = await api.post('/notifications', params);
  return res.data as Notification;
}

export async function markNotificationRead(id: number) {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.put('/notifications/read-all');
}