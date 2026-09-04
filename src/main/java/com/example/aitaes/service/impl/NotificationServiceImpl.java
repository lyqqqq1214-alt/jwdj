package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.entity.NotificationRecipient;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.CourseStudentMapper;
import com.example.aitaes.mapper.NotificationMapper;
import com.example.aitaes.mapper.NotificationRecipientMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.UserMapper;
import com.example.aitaes.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 通知服务实现
 * <p>
 * 发送时按 recipientScope 展开具体接收人（t_notification_recipient 一人一行）：
 * <ul>
 *   <li>ALL：全体用户（管理员广播，师生均可见）</li>
 *   <li>TEACHERS：全体教师+助教（管理员发通知给教师）</li>
 *   <li>COURSE + courseId：该课程全部选课学生（教师发通知给学生）；courseId 为空时取发送者名下全部课程</li>
 *   <li>STUDENTS + studentIds：指定用户ID列表</li>
 * </ul>
 * 我的通知列表 = 我接收的通知 ∪ 我发送的通知（发送历史），并按接收记录填充 isRead。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationRecipientMapper notificationRecipientMapper;
    private final UserMapper userMapper;
    private final StudentMapper studentMapper;
    private final CourseStudentMapper courseStudentMapper;
    private final CourseMapper courseMapper;

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
        notification.setRecipientScope(recipientScope != null ? recipientScope : "COURSE");
        notification.setCourseId(courseId);
        notificationMapper.insert(notification);

        // 展开接收人为具体用户ID（t_user.id）
        Set<Long> recipientIds = resolveRecipients(notification.getRecipientScope(), courseId, studentIds, senderId);
        for (Long recipientId : recipientIds) {
            NotificationRecipient recipient = new NotificationRecipient();
            recipient.setNotificationId(notification.getId());
            recipient.setRecipientId(recipientId);
            recipient.setIsRead(0);
            notificationRecipientMapper.insert(recipient);
        }

        log.info("发送通知: id={}, title={}, scope={}, recipients={}",
                notification.getId(), title, notification.getRecipientScope(), recipientIds.size());
        return notification;
    }

    /**
     * 按接收范围展开接收人用户ID（自动排除发送者自己，避免给自己发未读）
     */
    private Set<Long> resolveRecipients(String scope, Long courseId, List<Long> studentIds, Long senderId) {
        Set<Long> ids = switch (scope) {
            case "ALL" -> userMapper.selectList(
                            new LambdaQueryWrapper<User>().eq(User::getDeleted, 0))
                    .stream().map(User::getId).collect(Collectors.toSet());
            case "TEACHERS" -> userMapper.selectList(
                            new LambdaQueryWrapper<User>()
                                    .eq(User::getDeleted, 0)
                                    .in(User::getRole, List.of("TEACHER", "ASSISTANT")))
                    .stream().map(User::getId).collect(Collectors.toSet());
            case "STUDENTS" -> studentIds != null ? new HashSet<>(studentIds) : Collections.emptySet();
            default -> resolveCourseStudents(courseId, senderId); // COURSE
        };
        ids.remove(senderId);
        return ids;
    }

    /**
     * 课程范围：courseId 为空时取发送者（教师）名下全部课程的选课学生
     */
    private Set<Long> resolveCourseStudents(Long courseId, Long senderId) {
        List<Long> courseIds;
        if (courseId != null) {
            courseIds = List.of(courseId);
        } else {
            courseIds = courseMapper.selectList(
                            new LambdaQueryWrapper<Course>().eq(Course::getTeacherId, senderId))
                    .stream().map(Course::getId).toList();
        }
        if (courseIds.isEmpty()) {
            return Collections.emptySet();
        }
        List<CourseStudent> links = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().in(CourseStudent::getCourseId, courseIds));
        Set<Long> studentEntityIds = links.stream()
                .map(CourseStudent::getStudentId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (studentEntityIds.isEmpty()) {
            return Collections.emptySet();
        }
        return studentMapper.selectBatchIds(studentEntityIds).stream()
                .map(Student::getUserId).filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    @Override
    public IPage<Notification> myNotifications(Long userId, int pageNum, int pageSize) {
        // 我接收的通知
        List<NotificationRecipient> recipients = notificationRecipientMapper.selectList(
                new LambdaQueryWrapper<NotificationRecipient>().eq(NotificationRecipient::getRecipientId, userId));
        Set<Long> receivedIds = recipients.stream()
                .map(NotificationRecipient::getNotificationId).collect(Collectors.toSet());
        // 我发送的通知（发送历史，让发送者也能在列表看到）
        Set<Long> sentIds = notificationMapper.selectList(
                        new LambdaQueryWrapper<Notification>().eq(Notification::getSenderId, userId))
                .stream().map(Notification::getId).collect(Collectors.toSet());

        Set<Long> allIds = new HashSet<>();
        allIds.addAll(receivedIds);
        allIds.addAll(sentIds);
        if (allIds.isEmpty()) {
            return new Page<>(pageNum, pageSize);
        }

        Map<Long, Integer> readMap = recipients.stream().collect(Collectors.toMap(
                NotificationRecipient::getNotificationId,
                r -> r.getIsRead() != null ? r.getIsRead() : 0,
                (a, b) -> a));

        // 单用户通知数据量小，查询全量后内存分页（避免 IN 条件下 count 查询 total=0 的问题）
        List<Notification> all = notificationMapper.selectList(
                new LambdaQueryWrapper<Notification>()
                        .in(Notification::getId, allIds)
                        .orderByDesc(Notification::getCreateTime));
        for (Notification n : all) {
            // 自己发送的视为已读；接收的按接收记录填充
            n.setIsRead(sentIds.contains(n.getId()) ? 1 : readMap.getOrDefault(n.getId(), 0));
        }
        Page<Notification> page = new Page<>(pageNum, pageSize);
        page.setTotal(all.size());
        int from = Math.min((pageNum - 1) * pageSize, all.size());
        int to = Math.min(from + pageSize, all.size());
        page.setRecords(all.subList(from, to));
        return page;
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
