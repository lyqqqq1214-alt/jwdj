package com.example.aitaes.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.dto.NotificationSendDTO;
import com.example.aitaes.dto.RecipientStudentVO;
import com.example.aitaes.entity.ExamPaper;
import com.example.aitaes.entity.Notification;

import java.util.List;

/**
 * 通知服务接口
 */
public interface NotificationService {

    /**
     * 发送通知
     */
    Notification send(Long senderId, String senderName, NotificationSendDTO dto);

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

    /**
     * 课程学生名单（收件人三级联动用，返回行政班名）
     */
    List<RecipientStudentVO> listCourseStudents(Long courseId, Long userId);

    /**
     * 考试发布自动通知：向试卷目标学生发送通知（内容含试卷名/课程/起止时间），
     * 无需教师手动发送。接收人为空时静默跳过。
     */
    void notifyExamPublished(ExamPaper paper);
}
