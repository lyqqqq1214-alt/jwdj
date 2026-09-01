package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 试卷实体（AI组卷发布）
 */
@Data
@TableName("t_exam_paper")
public class ExamPaper {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属课程ID */
    private Long courseId;

    /** 组卷教师ID */
    private Long teacherId;

    /** 试卷名称 */
    private String paperName;

    /** 满分 */
    private BigDecimal totalScore;

    /** 考试时长（分钟） */
    private Integer durationMinutes;

    /** 考试开始时间 */
    private LocalDateTime startTime;

    /** 考试截止时间 */
    private LocalDateTime endTime;

    /** 参与班级（逗号分隔） */
    private String targetClasses;

    /** 参与学生（逗号分隔的学生ID） */
    private String targetStudents;

    /** 状态：DRAFT/PUBLISHED/ENDED */
    private String status;

    /** 未批阅份数（有主观题未批的学生试卷数，瞬态，不落库） */
    @TableField(exist = false)
    private Integer ungradedCount;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
