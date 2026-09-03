package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 学生考核成绩记录实体
 * <p>
 * 每个学生对每次考核的总成绩记录。与 {@link RecordKpDeduction} 是一对多关系。
 */
@Data
@TableName("t_assessment_record")
public class AssessmentRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 考核ID */
    private Long assessmentId;

    /** 学生ID */
    private Long studentId;

    /** 总成绩 */
    private BigDecimal totalScore;

    /** 提交状态：ON_TIME(按时) / LATE(迟交) / ABSENT(缺考/未交) */
    private String submitStatus;

    /** 最薄弱知识点 */
    private String weakestKp;

    /** 最薄弱方面（如"计算能力"/"概念理解"） */
    private String weakestAspect;

    /** 提交时间 */
    private LocalDateTime submitTime;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
