package com.example.aitaes.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.aitaes.common.Result;
import com.example.aitaes.entity.Notification;
import com.example.aitaes.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
     * 发送通知
     */
    @PostMapping
    public Result<Notification> send(@RequestAttribute("userId") Long userId,
                                      @RequestAttribute("username") String username,
                                      @RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        String recipientScope = (String) body.getOrDefault("recipientScope", "COURSE");
        Long courseId = body.get("courseId") != null
                ? Long.valueOf(body.get("courseId").toString()) : null;
        @SuppressWarnings("unchecked")
        List<Long> studentIds = body.get("studentIds") instanceof List
                ? ((List<?>) body.get("studentIds")).stream()
                        .map(o -> Long.valueOf(o.toString())).toList()
                : null;

        return Result.success("通知已发送",
                notificationService.send(userId, username, title, content,
                        recipientScope, courseId, studentIds));
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
