package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 预警记录实体
 */
@Data
@TableName("t_warning_record")
public class WarningRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 学生ID */
    private Long studentId;

    /** 课程ID */
    private Long courseId;

    /** 触发规则ID */
    private Long ruleId;

    /** 预警类型 */
    private String warningType;

    /** 严重程度：HIGH/MEDIUM/LOW */
    private String severity;

    /** 预警消息 */
    private String warningMsg;

    /** 是否已解除 */
    private Integer isResolved;

    /** 触发时间 */
    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
