package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.entity.Notification;

/**
 * 通知服务接口
 */
public interface NotificationService {

    /**
     * 发送通知
     */
    Notification send(Long senderId, String senderName, String title, String content,
                      String recipientScope, Long courseId, java.util.List<Long> studentIds);

    /**
     * 我的通知列表
     */
    IPage<Notification> myNotifications(Long userId, int pageNum, int pageSize);

    /**
     * 未读数量
     */
    int unreadCount(Long userId);

    /**
     * 标记已读
     */
    void markRead(Long notificationId, Long userId);

    /**
     * 全部已读
     */
    void markAllRead(Long userId);
}
