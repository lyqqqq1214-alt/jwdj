package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知接收者实体
 * <p>
 * 记录每个接收者对每条通知的已读状态。学生端未读红点数字 = COUNT(is_read=0)。
 */
@Data
@TableName("t_notification_recipient")
public class NotificationRecipient {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 通知ID */
    private Long notificationId;

    /** 接收者 t_user.id */
    private Long recipientId;

    /** 是否已读 */
    private Integer isRead;

    /** 阅读时间 */
    private LocalDateTime readTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
