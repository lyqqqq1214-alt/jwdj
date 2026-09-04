package com.example.aitaes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aitaes.common.BusinessException;
import com.example.aitaes.common.ResultCode;
import com.example.aitaes.dto.NotificationSendDTO;
import com.example.aitaes.dto.RecipientStudentVO;
import com.example.aitaes.entity.Course;
import com.example.aitaes.entity.CourseStudent;
import com.example.aitaes.entity.ExamPaper;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.entity.NotificationRecipient;
import com.example.aitaes.entity.Student;
import com.example.aitaes.entity.Teacher;
import com.example.aitaes.entity.TeachingAssistant;
import com.example.aitaes.entity.User;
import com.example.aitaes.mapper.CourseMapper;
import com.example.aitaes.mapper.CourseStudentMapper;
import com.example.aitaes.mapper.NotificationMapper;
import com.example.aitaes.mapper.NotificationRecipientMapper;
import com.example.aitaes.mapper.StudentMapper;
import com.example.aitaes.mapper.TeacherMapper;
import com.example.aitaes.mapper.TeachingAssistantMapper;
import com.example.aitaes.mapper.UserMapper;
import com.example.aitaes.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
 *   <li>COURSE + courseId：该课程选课学生（教师发通知给学生）；可再按 classNames/studentIds 过滤</li>
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
    private final TeacherMapper teacherMapper;
    private final TeachingAssistantMapper teachingAssistantMapper;

    @Override
    @Transactional
    public Notification send(Long senderId, String senderName, NotificationSendDTO dto) {
        Notification notification = new Notification();
        notification.setSenderId(senderId);
        notification.setSenderName(senderName);
        notification.setTitle(dto.getTitle());
        notification.setContent(dto.getContent());
        notification.setNotificationType("MANUAL");
        notification.setRecipientScope(dto.getRecipientScope() != null ? dto.getRecipientScope() : "COURSE");
        notification.setCourseId(dto.getCourseId());
        notificationMapper.insert(notification);

        // 展开接收人为具体用户ID（t_user.id）
        Set<Long> recipientIds = resolveRecipients(notification.getRecipientScope(), dto, senderId);
        for (Long recipientId : recipientIds) {
            NotificationRecipient recipient = new NotificationRecipient();
            recipient.setNotificationId(notification.getId());
            recipient.setRecipientId(recipientId);
            recipient.setIsRead(0);
            notificationRecipientMapper.insert(recipient);
        }

        log.info("发送通知: id={}, title={}, scope={}, recipients={}",
                notification.getId(), dto.getTitle(), notification.getRecipientScope(), recipientIds.size());
        return notification;
    }

    /**
     * 按接收范围展开接收人用户ID（自动排除发送者自己，避免给自己发未读）
     */
    private Set<Long> resolveRecipients(String scope, NotificationSendDTO dto, Long senderId) {
        Set<Long> ids = switch (scope) {
            case "ALL" -> userMapper.selectList(
                            new LambdaQueryWrapper<User>().eq(User::getDeleted, 0))
                    .stream().map(User::getId).collect(Collectors.toSet());
            case "TEACHERS" -> userMapper.selectList(
                            new LambdaQueryWrapper<User>()
                                    .eq(User::getDeleted, 0)
                                    .in(User::getRole, List.of("TEACHER", "ASSISTANT")))
                    .stream().map(User::getId).collect(Collectors.toSet());
            case "STUDENTS" -> dto.getStudentIds() != null
                    ? new HashSet<>(dto.getStudentIds()) : Collections.emptySet();
            default -> resolveCourseStudents(dto.getCourseId(), senderId,
                    dto.getClassNames(), dto.getStudentIds()); // COURSE
        };
        ids.remove(senderId);
        return ids;
    }

    /**
     * 课程范围：courseId 为空时取发送者（教师）名下全部课程的选课学生；
     * 可再按行政班名（classNames）与学生（studentIds，t_student.id）过滤，空=不过滤（全量）。
     */
    private Set<Long> resolveCourseStudents(Long courseId, Long senderId,
                                            List<String> classNames, List<Long> studentIds) {
        Long teacherId = resolveTeacherId(senderId);

        List<Long> courseIds;
        if (courseId != null) {
            Course course = courseMapper.selectById(courseId);
            if (course == null || !Objects.equals(course.getTeacherId(), teacherId)) {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权向该课程发送通知");
            }
            courseIds = List.of(courseId);
        } else {
            courseIds = courseMapper.selectList(
                            new LambdaQueryWrapper<Course>().eq(Course::getTeacherId, teacherId))
                    .stream().map(Course::getId).toList();
        }
        if (courseIds.isEmpty()) {
            return Collections.emptySet();
        }

        List<CourseStudent> links = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().in(CourseStudent::getCourseId, courseIds));

        Set<String> classFilter = classNames == null || classNames.isEmpty() ? null : new HashSet<>(classNames);
        Set<Long> studentFilter = studentIds == null || studentIds.isEmpty() ? null : new HashSet<>(studentIds);

        Set<Long> studentEntityIds = links.stream()
                .filter(l -> classFilter == null || (l.getClassName() != null && classFilter.contains(l.getClassName())))
                .filter(l -> studentFilter == null || (l.getStudentId() != null && studentFilter.contains(l.getStudentId())))
                .map(CourseStudent::getStudentId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (studentEntityIds.isEmpty()) {
            return Collections.emptySet();
        }
        return studentMapper.selectBatchIds(studentEntityIds).stream()
                .map(Student::getUserId).filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /**
     * 将 t_user.id 解析为 t_teacher.id（教师返回自身，助教返回所属教师）
     */
    private Long resolveTeacherId(Long userId) {
        User user = userMapper.selectById(userId);
        if (user != null) {
            if ("TEACHER".equals(user.getRole())) {
                Teacher teacher = teacherMapper.selectOne(
                        new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, userId));
                if (teacher == null) {
                    throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
                }
                return teacher.getId();
            } else if ("ASSISTANT".equals(user.getRole())) {
                TeachingAssistant ta = teachingAssistantMapper.selectOne(
                        new LambdaQueryWrapper<TeachingAssistant>().eq(TeachingAssistant::getUserId, userId));
                if (ta == null) {
                    throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "助教不存在");
                }
                return ta.getTeacherId();
            } else {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "角色不支持");
            }
        }
        Teacher teacher = teacherMapper.selectOne(
                new LambdaQueryWrapper<Teacher>().eq(Teacher::getUserId, userId));
        if (teacher == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "教师不存在");
        }
        return teacher.getId();
    }

    @Override
    public List<RecipientStudentVO> listCourseStudents(Long courseId, Long userId) {
        Long teacherId = resolveTeacherId(userId);
        Course course = courseMapper.selectById(courseId);
        if (course == null || !Objects.equals(course.getTeacherId(), teacherId)) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "无权查看该课程名单");
        }

        List<CourseStudent> links = courseStudentMapper.selectList(
                new LambdaQueryWrapper<CourseStudent>().eq(CourseStudent::getCourseId, courseId));
        if (links.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> studentEntityIds = links.stream()
                .map(CourseStudent::getStudentId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, String> classNameByStudent = links.stream()
                .filter(l -> l.getStudentId() != null)
                .collect(Collectors.toMap(CourseStudent::getStudentId, CourseStudent::getClassName, (a, b) -> a));

        return studentMapper.selectBatchIds(studentEntityIds).stream()
                .map(s -> RecipientStudentVO.builder()
                        .studentId(s.getId())
                        .studentNo(s.getStudentNo())
                        .name(s.getName())
                        .className(classNameByStudent.get(s.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void notifyExamPublished(ExamPaper paper) {
        Set<Long> studentEntityIds = resolveExamTargetStudents(paper);
        if (studentEntityIds.isEmpty()) {
            log.info("发布考试通知跳过: paperId={}, 无目标学生", paper.getId());
            return;
        }
        Set<Long> recipientUserIds = studentMapper.selectBatchIds(studentEntityIds).stream()
                .map(Student::getUserId).filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (recipientUserIds.isEmpty()) {
            log.info("发布考试通知跳过: paperId={}, 无有效接收用户", paper.getId());
            return;
        }

        Notification notification = new Notification();
        notification.setSenderId(null); // 系统自动
        notification.setSenderName(resolveTeacherName(paper.getTeacherId()));
        notification.setTitle("考试通知：" + paper.getPaperName());
        notification.setContent(buildExamContent(paper, resolveCourseName(paper.getCourseId())));
        notification.setNotificationType("EXAM_REMIND");
        notification.setRecipientScope("COURSE");
        notification.setCourseId(paper.getCourseId());
        notificationMapper.insert(notification);

        for (Long recipientId : recipientUserIds) {
            NotificationRecipient recipient = new NotificationRecipient();
            recipient.setNotificationId(notification.getId());
            recipient.setRecipientId(recipientId);
            recipient.setIsRead(0);
            notificationRecipientMapper.insert(recipient);
        }
        log.info("发布考试通知: paperId={}, notificationId={}, recipients={}",
                paper.getId(), notification.getId(), recipientUserIds.size());
    }

    /** 解析考试目标学生（t_student.id）：优先 targetStudents，否则取 targetClasses/课程下的选课学生 */
    private Set<Long> resolveExamTargetStudents(ExamPaper paper) {
        Set<Long> explicit = parseIdSet(paper.getTargetStudents());
        if (!explicit.isEmpty()) {
            return explicit;
        }
        Set<Long> courseIds = parseIdSet(paper.getTargetClasses());
        if (courseIds.isEmpty() && paper.getCourseId() != null) {
            courseIds = new HashSet<>();
            courseIds.add(paper.getCourseId());
        }
        if (courseIds.isEmpty()) {
            return Collections.emptySet();
        }
        return courseStudentMapper.selectList(
                        new LambdaQueryWrapper<CourseStudent>().in(CourseStudent::getCourseId, courseIds))
                .stream().map(CourseStudent::getStudentId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    /** 逗号分隔的 ID 字符串解析为 Long 集合（忽略空/非数字段） */
    private Set<Long> parseIdSet(String csv) {
        if (csv == null || csv.isBlank()) {
            return Collections.emptySet();
        }
        Set<Long> ids = new HashSet<>();
        for (String s : csv.split(",")) {
            String t = s.trim();
            if (t.isEmpty()) {
                continue;
            }
            try {
                ids.add(Long.parseLong(t));
            } catch (NumberFormatException ignored) {
                // 忽略非数字段
            }
        }
        return ids;
    }

    private String resolveCourseName(Long courseId) {
        if (courseId == null) {
            return null;
        }
        Course course = courseMapper.selectById(courseId);
        return course != null ? course.getCourseName() : null;
    }

    private String resolveTeacherName(Long teacherId) {
        if (teacherId == null) {
            return "系统";
        }
        Teacher teacher = teacherMapper.selectById(teacherId);
        return (teacher != null && teacher.getName() != null) ? teacher.getName() : "系统";
    }

    private String buildExamContent(ExamPaper paper, String courseName) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String start = paper.getStartTime() != null ? paper.getStartTime().format(fmt) : "未定";
        String end = paper.getEndTime() != null ? paper.getEndTime().format(fmt) : "未定";
        StringBuilder sb = new StringBuilder();
        sb.append("试卷：").append(paper.getPaperName()).append('\n');
        if (courseName != null) {
            sb.append("课程：").append(courseName).append('\n');
        }
        sb.append("时间：").append(start).append(" 至 ").append(end);
        return sb.toString();
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
