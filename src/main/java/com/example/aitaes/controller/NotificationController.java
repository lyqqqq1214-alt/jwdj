package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.NotificationSendDTO;
import com.example.aitaes.dto.RecipientStudentVO;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 通知中心控制器 (UC15+UC16)
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 发送通知（教师/助教/管理员可发送，学生仅接收）
     */
    @PostMapping
    @RequireRole({"TEACHER", "ASSISTANT", "ADMIN"})
    public Result<Notification> send(@RequestAttribute("userId") Long userId,
                                      @RequestAttribute("username") String username,
                                      @RequestBody NotificationSendDTO dto) {
        return Result.success("通知已发送", notificationService.send(userId, username, dto));
    }

    /**
     * 课程学生名单（收件人三级联动：课程→班级→人，返回行政班名）
     */
    @GetMapping("/courses/{courseId}/students")
    @RequireRole({"TEACHER", "ASSISTANT"})
    public Result<List<RecipientStudentVO>> listCourseStudents(@PathVariable Long courseId,
                                                                @RequestAttribute("userId") Long userId) {
        return Result.success(notificationService.listCourseStudents(courseId, userId));
    }

    /**
     * 我的通知列表
     */
    @GetMapping
    public Result<IPage<Notification>> myNotifications(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(notificationService.myNotifications(userId, pageNum, pageSize));
    }

    /**
     * 未读数量
     */
    @GetMapping("/unread-count")
    public Result<Integer> unreadCount(@RequestAttribute("userId") Long userId) {
        return Result.success(notificationService.unreadCount(userId));
    }

    /**
     * 标记已读
     */
    @PutMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id,
                                  @RequestAttribute("userId") Long userId) {
        notificationService.markRead(id, userId);
        return Result.success("已标记为已读", null);
    }

    /**
     * 全部已读
     */
    @PutMapping("/read-all")
    public Result<Void> markAllRead(@RequestAttribute("userId") Long userId) {
        notificationService.markAllRead(userId);
        return Result.success("全部标记为已读", null);
    }
}
