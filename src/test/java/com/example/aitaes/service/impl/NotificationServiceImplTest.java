package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.entity.NotificationRecipient;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.mapper.NotificationMapper;
import com.example.aitaes.mapper.NotificationRecipientMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService 单元测试")
class NotificationServiceImplTest {

    @Mock private NotificationMapper notificationMapper;
    @Mock private NotificationRecipientMapper notificationRecipientMapper;
    @InjectMocks private NotificationServiceImpl notificationService;

    @Nested
    @DisplayName("send — 发送通知")
    class Send {

        @Test
        @DisplayName("NT-01: 应创建通知并添加接收者")
        void shouldCreateNotificationAndRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(1L);
                return 1;
            });

            Notification result = notificationService.send(1L, "张老师", "测试标题",
                    "测试内容", "COURSE", 1L, List.of(100L, 101L));

            assertNotNull(result);
            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02: 无接收者时应仅创建通知")
        void shouldCreateNotificationOnly_WhenNoRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenReturn(1);

            notificationService.send(1L, "张老师", "标题", "内容", "ALL", null, null);

            verify(notificationRecipientMapper, never()).insert(any(NotificationRecipient.class));
        }
    }

    @Nested
    @DisplayName("myNotifications — 我的通知")
    class MyNotifications {

        @Test
        @DisplayName("NT-03: 有通知时应返回列表")
        void shouldReturnNotifications() {
            NotificationRecipient nr = new NotificationRecipient();
            nr.setNotificationId(1L);
            when(notificationRecipientMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(nr));
            Page<Notification> nPage = new Page<>(1, 10);
            nPage.setRecords(List.of(new Notification()));
            when(notificationMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(nPage);

            IPage<Notification> result = notificationService.myNotifications(100L, 1, 10);

            assertNotNull(result);
        }

        @Test
        @DisplayName("NT-04: 无通知时应返回空页")
        void shouldReturnEmpty_WhenNoNotifications() {
            when(notificationRecipientMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            IPage<Notification> result = notificationService.myNotifications(100L, 1, 10);

            assertEquals(0, result.getTotal());
        }
    }

    @Nested
    @DisplayName("unreadCount — 未读数量")
    class UnreadCount {

        @Test
        @DisplayName("NT-05: 应返回未读数量")
        void shouldReturnUnreadCount() {
            when(notificationRecipientMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(5L);
            assertEquals(5, notificationService.unreadCount(100L));
        }
    }

    @Nested
    @DisplayName("markRead — 标记已读")
    class MarkRead {

        @Test
        @DisplayName("NT-06: 找到记录应更新已读状态")
        void shouldMarkAsRead() {
            NotificationRecipient nr = new NotificationRecipient();
            nr.setId(1L);
            when(notificationRecipientMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(nr);

            notificationService.markRead(1L, 100L);

            verify(notificationRecipientMapper).updateById(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-07: 未找到记录应静默处理")
        void shouldIgnore_WhenRecipientNotFound() {
            when(notificationRecipientMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
            assertDoesNotThrow(() -> notificationService.markRead(1L, 100L));
            verify(notificationRecipientMapper, never()).updateById(any(NotificationRecipient.class));
        }
    }
}
