package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 操作日志实体
 * <p>
 * 记录用户操作、AI调用、系统错误。需求要求保留至少30天。
 */
@Data
@TableName("t_operation_log")
public class OperationLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 日志类型：OPERATION/AI_CALL/ERROR */
    private String logType;

    /** 操作用户 t_user.id */
    private Long userId;

    /** 操作用户名（冗余） */
    private String username;

    /** 操作描述 */
    private String action;

    /** 操作目标类型 */
    private String targetType;

    /** 操作目标ID */
    private Long targetId;

    /** 详细信息（JSON） */
    private String detail;

    /** 操作IP */
    private String ipAddress;

    /** 日志时间 */
    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
