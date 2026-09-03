package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.entity.NotificationRecipient;
import com.example.aitaes.mapper.NotificationMapper;
import com.example.aitaes.mapper.NotificationRecipientMapper;
import com.example.aitaes.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 通知服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationRecipientMapper notificationRecipientMapper;

    @Override
    @Transactional
    public Notification send(Long senderId, String senderName, String title, String content,
                              String recipientScope, Long courseId, List<Long> studentIds) {
        Notification notification = new Notification();
        notification.setSenderId(senderId);
        notification.setSenderName(senderName);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setNotificationType("MANUAL");
        notification.setRecipientScope(recipientScope);
        notification.setCourseId(courseId);
        notificationMapper.insert(notification);

        // 为每个接收者创建已读记录
        if (studentIds != null && !studentIds.isEmpty()) {
            for (Long studentId : studentIds) {
                NotificationRecipient recipient = new NotificationRecipient();
                recipient.setNotificationId(notification.getId());
                recipient.setRecipientId(studentId);
                notificationRecipientMapper.insert(recipient);
            }
        }

        log.info("发送通知: title={}, recipients={}", title,
                studentIds != null ? studentIds.size() : 0);
        return notification;
    }

    @Override
    public IPage<Notification> myNotifications(Long userId, int pageNum, int pageSize) {
        // 查询所有发送给我的通知
        LambdaQueryWrapper<NotificationRecipient> recipientWrapper = new LambdaQueryWrapper<>();
        recipientWrapper.eq(NotificationRecipient::getRecipientId, userId);
        List<NotificationRecipient> recipients = notificationRecipientMapper.selectList(recipientWrapper);

        if (recipients.isEmpty()) {
            return new Page<>(pageNum, pageSize);
        }

        List<Long> notificationIds = recipients.stream()
                .map(NotificationRecipient::getNotificationId).toList();

        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Notification::getId, notificationIds)
                .orderByDesc(Notification::getCreateTime);
        return notificationMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public int unreadCount(Long userId) {
        LambdaQueryWrapper<NotificationRecipient> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NotificationRecipient::getRecipientId, userId)
                .eq(NotificationRecipient::getIsRead, 0);
        Long count = notificationRecipientMapper.selectCount(wrapper);
        return count != null ? count.intValue() : 0;
    }

    @Override
    public void markRead(Long notificationId, Long userId) {
        NotificationRecipient recipient = notificationRecipientMapper.selectOne(
                new LambdaQueryWrapper<NotificationRecipient>()
                        .eq(NotificationRecipient::getNotificationId, notificationId)
                        .eq(NotificationRecipient::getRecipientId, userId));
        if (recipient != null) {
            recipient.setIsRead(1);
            recipient.setReadTime(LocalDateTime.now());
            notificationRecipientMapper.updateById(recipient);
        }
    }

    @Override
    public void markAllRead(Long userId) {
        List<NotificationRecipient> recipients = notificationRecipientMapper.selectList(
                new LambdaQueryWrapper<NotificationRecipient>()
                        .eq(NotificationRecipient::getRecipientId, userId)
                        .eq(NotificationRecipient::getIsRead, 0));
        for (NotificationRecipient r : recipients) {
            r.setIsRead(1);
            r.setReadTime(LocalDateTime.now());
            notificationRecipientMapper.updateById(r);
        }
    }
}
