package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 预警规则配置实体
 */
@Data
@TableName("t_warning_rule")
public class WarningRule {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 规则名称 */
    private String ruleName;

    /** 规则类型：ATTENDANCE/SCORE_DROP/HOMEWORK_MISS/KP_WEAK */
    private String ruleType;

    /** 阈值表达式（如"缺勤≥3次"） */
    private String threshold;

    /** 是否启用 */
    private Integer isActive;

    /** 规则说明 */
    private String description;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
