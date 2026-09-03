package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 实验报告实体
 */
@Data
@TableName("t_experiment")
public class Experiment {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 课程ID */
    private Long courseId;

    /** 学生ID */
    private Long studentId;

    /** 实验名称 */
    private String experimentName;

    /** 第X次实验 */
    private Integer experimentNo;

    /** 分数 */
    private BigDecimal score;

    /** 提交时间 */
    private LocalDateTime submitTime;

    /** 关联知识点ID列表（逗号分隔） */
    private String knowledgePointIds;

    /** 学期 */
    private String semester;

    /** 评语/备注 */
    private String remark;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
