package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 考核实体（统一管理作业/测验/实验/期中/期末）
 */
@Data
@TableName("t_assessment")
public class Assessment {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属课程ID */
    private Long courseId;

    /** 关联试卷ID（在线考试，一张试卷对应一条考核） */
    private Long paperId;

    /** 考核名称（如"第3次作业-传输层"） */
    private String assessmentName;

    /** 考核类型：HOMEWORK/QUIZ/EXPERIMENT/MIDTERM/FINAL */
    private String assessmentType;

    /** 第X次 */
    private Integer assessmentNo;

    /** 满分 */
    private BigDecimal totalScore;

    /** 题目数量 */
    private Integer questionCount;

    /** 考核日期 */
    private LocalDate assessmentDate;

    /** 在线考试开始时间 */
    private LocalDateTime startTime;

    /** 在线考试截止时间 */
    private LocalDateTime endTime;

    /** 考试时长（分钟） */
    private Integer durationMinutes;

    /** 状态：DRAFT/PUBLISHED/ONGOING/ENDED */
    private String status;

    /** 学期 */
    private String semester;

    /** 说明/备注 */
    private String description;

    private LocalDateTime createTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
