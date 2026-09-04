package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.dto.NotificationSendDTO;
import com.example.aitaes.dto.RecipientStudentVO;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.ExamPaper;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.entity.NotificationRecipient;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.CourseStudentMapper;
import com.example.aitaes.mapper.NotificationMapper;
import com.example.aitaes.mapper.NotificationRecipientMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.TeachingAssistantMapper;
import com.example.aitaes.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;

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
    @Mock private TeacherMapper teacherMapper;
    @Mock private TeachingAssistantMapper teachingAssistantMapper;
    @InjectMocks private NotificationServiceImpl notificationService;

    // ===== helpers =====

    private NotificationSendDTO dto(String scope, Long courseId, List<String> classNames, List<Long> studentIds) {
        NotificationSendDTO d = new NotificationSendDTO();
        d.setTitle("标题");
        d.setContent("内容");
        d.setRecipientScope(scope);
        d.setCourseId(courseId);
        d.setClassNames(classNames);
        d.setStudentIds(studentIds);
        return d;
    }

    private void stubNotificationInsert(Long id) {
        when(notificationMapper.insert(any(Notification.class))).thenAnswer(inv -> {
            inv.getArgument(0, Notification.class).setId(id);
            return 1;
        });
    }

    /** resolveTeacherId(userId) 返回 teacherId（TEACHER 角色） */
    private void stubTeacher(Long userId, Long teacherId) {
        User u = new User();
        u.setId(userId);
        u.setRole("TEACHER");
        when(userMapper.selectById(userId)).thenReturn(u);
        Teacher t = new Teacher();
        t.setId(teacherId);
        when(teacherMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(t);
    }

    private void stubCourse(Long courseId, Long teacherId) {
        Course c = new Course();
        c.setId(courseId);
        c.setTeacherId(teacherId);
        when(courseMapper.selectById(courseId)).thenReturn(c);
    }

    private CourseStudent link(Long studentId, String className) {
        CourseStudent cs = new CourseStudent();
        cs.setStudentId(studentId);
        cs.setClassName(className);
        return cs;
    }

    private Student student(Long id, Long userId) {
        Student s = new Student();
        s.setId(id);
        s.setUserId(userId);
        return s;
    }

    /** selectBatchIds 按传入的 id 集合返回对应学生（模拟 DB 过滤） */
    private void stubStudents(Map<Long, Long> idToUserId) {
        when(studentMapper.selectBatchIds(anyCollection())).thenAnswer(inv -> {
            @SuppressWarnings("unchecked")
            Collection<Long> ids = inv.getArgument(0);
            return ids.stream()
                    .filter(idToUserId::containsKey)
                    .map(id -> student(id, idToUserId.get(id)))
                    .toList();
        });
    }

    private ExamPaper examPaper(Long courseId, Long teacherId, String paperName, String targetStudents) {
        ExamPaper p = new ExamPaper();
        p.setId(1L);
        p.setCourseId(courseId);
        p.setTeacherId(teacherId);
        p.setPaperName(paperName);
        p.setTargetStudents(targetStudents);
        p.setStartTime(LocalDateTime.of(2026, 9, 10, 9, 0));
        p.setEndTime(LocalDateTime.of(2026, 9, 10, 11, 0));
        return p;
    }

    @Nested
    @DisplayName("send — 发送通知")
    class Send {

        @Test
        @DisplayName("NT-01: STUDENTS 范围应为每个指定接收者创建记录")
        void shouldCreateNotificationAndRecipients() {
            stubNotificationInsert(1L);

            notificationService.send(1L, "张老师",
                    dto("STUDENTS", null, null, List.of(100L, 101L)));

            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02: ALL 范围无用户时应仅创建通知不产生接收者")
        void shouldCreateNotificationOnly_WhenNoRecipients() {
            when(notificationMapper.insert(any(Notification.class))).thenReturn(1);
            when(userMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

            notificationService.send(1L, "管理员", dto("ALL", null, null, null));

            verify(notificationRecipientMapper, never()).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02b: COURSE 范围应展开为选课学生的 userId（默认全量）")
        void shouldExpandCourseRecipients() {
            stubNotificationInsert(2L);
            stubTeacher(1L, 90L);
            stubCourse(3L, 90L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link(10L, "计科2401"), link(11L, "应数2401")));
            stubStudents(Map.of(10L, 100L, 11L, 101L));

            notificationService.send(1L, "张老师", dto("COURSE", 3L, null, null));

            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02c: TEACHERS 范围应展开为教师/助教用户")
        void shouldExpandTeachersRecipients() {
            stubNotificationInsert(3L);
            User t1 = new User();
            t1.setId(200L);
            when(userMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(t1));

            notificationService.send(1L, "管理员", dto("TEACHERS", null, null, null));

            verify(notificationRecipientMapper, times(1)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02d: COURSE 按班级过滤应只发给该班学生")
        void shouldFilterByClassNames() {
            stubNotificationInsert(4L);
            stubTeacher(1L, 90L);
            stubCourse(3L, 90L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link(10L, "计科2401"), link(11L, "应数2401")));
            stubStudents(Map.of(10L, 100L, 11L, 101L));

            notificationService.send(1L, "张老师", dto("COURSE", 3L, List.of("计科2401"), null));

            ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
            verify(notificationRecipientMapper, times(1)).insert(captor.capture());
            assertEquals(100L, captor.getValue().getRecipientId());
        }

        @Test
        @DisplayName("NT-02e: COURSE 按学生过滤应只发给指定学生")
        void shouldFilterByStudentIds() {
            stubNotificationInsert(5L);
            stubTeacher(1L, 90L);
            stubCourse(3L, 90L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link(10L, "计科2401"), link(11L, "应数2401")));
            stubStudents(Map.of(10L, 100L, 11L, 101L));

            notificationService.send(1L, "张老师", dto("COURSE", 3L, null, List.of(11L)));

            ArgumentCaptor<NotificationRecipient> captor = ArgumentCaptor.forClass(NotificationRecipient.class);
            verify(notificationRecipientMapper, times(1)).insert(captor.capture());
            assertEquals(101L, captor.getValue().getRecipientId());
        }

        @Test
        @DisplayName("NT-02f: COURSE 班级+学生同时过滤应取交集")
        void shouldFilterByBoth() {
            stubNotificationInsert(6L);
            stubTeacher(1L, 90L);
            stubCourse(3L, 90L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link(10L, "计科2401"), link(11L, "应数2401")));

            // 计科2401 对应学生 10，但 studentIds 只要 11 → 交集为空
            notificationService.send(1L, "张老师", dto("COURSE", 3L, List.of("计科2401"), List.of(11L)));

            verify(notificationRecipientMapper, never()).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-02g: 向他人课程发送应抛 FORBIDDEN")
        void shouldRejectOtherTeachersCourse() {
            when(notificationMapper.insert(any(Notification.class))).thenReturn(1);
            stubTeacher(1L, 90L);
            stubCourse(3L, 999L);

            assertThrows(BusinessException.class,
                    () -> notificationService.send(1L, "张老师", dto("COURSE", 3L, null, null)));

            verify(notificationRecipientMapper, never()).insert(any(NotificationRecipient.class));
        }
    }

    @Nested
    @DisplayName("listCourseStudents — 课程学生名单")
    class ListCourseStudents {

        @Test
        @DisplayName("NT-08: 应返回课程学生并带行政班名")
        void shouldListStudentsWithClassName() {
            stubTeacher(1L, 90L);
            stubCourse(3L, 90L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link(10L, "计科2401"), link(11L, "应数2401")));
            Student s10 = student(10L, 100L);
            s10.setStudentNo("2024001");
            s10.setName("张三");
            Student s11 = student(11L, 101L);
            s11.setStudentNo("2024002");
            s11.setName("李四");
            when(studentMapper.selectBatchIds(anyCollection())).thenReturn(List.of(s10, s11));

            List<RecipientStudentVO> result = notificationService.listCourseStudents(3L, 1L);

            assertEquals(2, result.size());
            RecipientStudentVO zhang = result.stream()
                    .filter(v -> v.getStudentId() == 10L).findFirst().orElseThrow();
            assertEquals("计科2401", zhang.getClassName());
            assertEquals("2024001", zhang.getStudentNo());
            assertEquals("张三", zhang.getName());
        }

        @Test
        @DisplayName("NT-09: 查看他人课程名单应抛 FORBIDDEN")
        void shouldRejectOtherTeachersCourse() {
            stubTeacher(1L, 90L);
            stubCourse(3L, 999L);

            assertThrows(BusinessException.class, () -> notificationService.listCourseStudents(3L, 1L));
        }
    }

    @Nested
    @DisplayName("notifyExamPublished — 考试发布自动通知")
    class NotifyExamPublished {

        @Test
        @DisplayName("NT-10: 指定目标学生时应发送通知并含试卷/课程/时间")
        void shouldNotifyExplicitTargetStudents() {
            stubNotificationInsert(1L);
            Teacher t = new Teacher();
            t.setId(90L);
            t.setName("张老师");
            when(teacherMapper.selectById(90L)).thenReturn(t);
            Course c = new Course();
            c.setId(3L);
            c.setCourseName("数据结构");
            when(courseMapper.selectById(3L)).thenReturn(c);
            when(studentMapper.selectBatchIds(anyCollection())).thenReturn(
                    List.of(student(100L, 1000L), student(101L, 1001L)));

            notificationService.notifyExamPublished(examPaper(3L, 90L, "期中考试", "100,101"));

            ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationMapper).insert(notifCaptor.capture());
            Notification n = notifCaptor.getValue();
            assertEquals("EXAM_REMIND", n.getNotificationType());
            assertNull(n.getSenderId());
            assertEquals("张老师", n.getSenderName());
            assertEquals("考试通知：期中考试", n.getTitle());
            assertEquals("试卷：期中考试\n课程：数据结构\n时间：2026-09-10 09:00 至 2026-09-10 11:00", n.getContent());
            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-11: 未指定学生时应按课程选课学生发送通知")
        void shouldNotifyCourseStudents() {
            stubNotificationInsert(2L);
            when(courseStudentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(link(10L, "计科2401"), link(11L, "应数2401")));
            when(studentMapper.selectBatchIds(anyCollection())).thenReturn(
                    List.of(student(10L, 100L), student(11L, 101L)));

            notificationService.notifyExamPublished(examPaper(3L, 90L, "期中考试", null));

            verify(notificationRecipientMapper, times(2)).insert(any(NotificationRecipient.class));
        }

        @Test
        @DisplayName("NT-12: 无目标学生且无课程时应跳过通知")
        void shouldSkipWhenNoTargets() {
            notificationService.notifyExamPublished(examPaper(null, 90L, "期中考试", null));

            verify(notificationMapper, never()).insert(any(Notification.class));
            verify(notificationRecipientMapper, never()).insert(any(NotificationRecipient.class));
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
