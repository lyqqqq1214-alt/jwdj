package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知主表实体
 * <p>
 * 教师手动发送或系统自动生成。接收者通过 t_notification_recipient 跟踪每人已读状态。
 */
@Data
@TableName("t_notification")
public class Notification {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 发送者 t_user.id（NULL=系统自动） */
    private Long senderId;

    /** 发送者姓名（冗余） */
    private String senderName;

    /** 通知标题 */
    private String title;

    /** 通知内容 */
    private String content;

    /** 通知类型：MANUAL/WARNING/EXAM_REMIND/SYSTEM */
    private String notificationType;

    /** 接收范围：ALL/COURSE/STUDENTS */
    private String recipientScope;

    /** 关联课程ID（recipientScope=COURSE时使用） */
    private Long courseId;

    /** 发送时间 */
    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
