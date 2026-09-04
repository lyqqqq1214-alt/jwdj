package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.entity.NotificationRecipient;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.User;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.CourseStudentMapper;
import com.example.aitaes.mapper.NotificationMapper;
import com.example.aitaes.mapper.NotificationRecipientMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.UserMapper;
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
    @Mock private UserMapper userMapper;
    @Mock private StudentMapper studentMapper;
    @Mock private CourseStudentMapper courseStudentMapper;
    @Mock private CourseMapper courseMapper;
    @InjectMocks private NotificationServiceImpl notificationService;

    @Nested
    @DisplayName("send — 发送通知")
    class Send {

        @Test
        @DisplayName("NT-01: STUDENTS 范围应为每个指定接收者创建记录")
        void shouldCreateNotificationAndRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenAnswer(inv -> {
                Notification n = inv.getArgument(0);
                n.setId(1L);
                return 1;
            });

            Notification result = notificationService.send(1L, "张老师", "测试标题",
                    "测试内容", "STUDENTS", null, List.of(100L, 101L));

            assertNotNull(result);
            // 发送者 1L 不在接收列表中，应为 100/101 各插一行
            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02: ALL 范围无用户时应仅创建通知不产生接收者")
        void shouldCreateNotificationOnly_WhenNoRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenReturn(1);
            when(userMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            notificationService.send(1L, "管理员", "标题", "内容", "ALL", null, null);

            verify(notificationRecipientMapper, never()).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02b: COURSE 范围应展开为选课学生的 userId")
        void shouldExpandCourseRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenAnswer(inv -> {
                inv.getArgument(0, Notification.class).setId(2L);
                return 1;
            });
            CourseStudent link1 = new CourseStudent();
            link1.setStudentId(10L);
            CourseStudent link2 = new CourseStudent();
            link2.setStudentId(11L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link1, link2));
            Student s1 = new Student();
            s1.setId(10L);
            s1.setUserId(100L);
            Student s2 = new Student();
            s2.setId(11L);
            s2.setUserId(101L);
            when(studentMapper.selectBatchIds(anyCollection())).thenReturn(List.of(s1, s2));

            notificationService.send(1L, "张老师", "标题", "内容", "COURSE", 3L, null);

            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02c: TEACHERS 范围应展开为教师/助教用户")
        void shouldExpandTeachersRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenAnswer(inv -> {
                inv.getArgument(0, Notification.class).setId(3L);
                return 1;
            });
            User t1 = new User();
            t1.setId(200L);
            when(userMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(t1));

            notificationService.send(1L, "管理员", "标题", "内容", "TEACHERS", null, null);

            verify(notificationRecipientMapper, times(1)).insert(any(NotificationRecipient.class));
        }
    }

    @Nested
    @DisplayName("myNotifications — 我的通知")
    class MyNotifications {

        @Test
        @DisplayName("NT-03: 有通知时应返回列表并填充 isRead")
        void shouldReturnNotifications() {
            NotificationRecipient nr = new NotificationRecipient();
            nr.setNotificationId(1L);
            nr.setIsRead(0);
            when(notificationRecipientMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(nr));
            Notification n = new Notification();
            n.setId(1L);
            n.setSenderId(2L);
            // 第一次 selectList 查"我发送的"（返回空），第二次查"我收到的"（返回 n）
            when(notificationMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of())
                    .thenReturn(List.of(n));

            IPage<Notification> result = notificationService.myNotifications(100L, 1, 10);

            assertNotNull(result);
            assertEquals(1, result.getTotal());
            assertEquals(0, result.getRecords().get(0).getIsRead());
        }

        @Test
        @DisplayName("NT-04: 无通知时应返回空页")
        void shouldReturnEmpty_WhenNoNotifications() {
            when(notificationRecipientMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            when(notificationMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            IPage<Notification> result = notificationService.myNotifications(100L, 1, 10);

            assertEquals(0, result.getTotal());
        }

        @Test
        @DisplayName("NT-04b: 自己发送的通知应出现在列表且视为已读")
        void shouldIncludeSentNotifications() {
            when(notificationRecipientMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
            Notification sent = new Notification();
            sent.setId(9L);
            sent.setSenderId(100L);
            when(notificationMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(sent));

            IPage<Notification> result = notificationService.myNotifications(100L, 1, 10);

            assertEquals(1, result.getTotal());
            assertEquals(1, result.getRecords().get(0).getIsRead());
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
