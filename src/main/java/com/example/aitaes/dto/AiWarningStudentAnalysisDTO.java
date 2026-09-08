package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 预警学生深度分析DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiWarningStudentAnalysisDTO {

    /**
     * 学生ID
     */
    private Long studentId;

    /**
     * 学生姓名
     */
    private String studentName;

    /**
     * 学号
     */
    private String studentNo;

    /**
     * 当前成绩
     */
    private BigDecimal score;

    /**
     * 出勤率
     */
    private BigDecimal attendanceRate;

    /**
     * 预警原因
     */
    private String warningReason;

    /**
     * AI问题分析
     */
    private String aiProblemAnalysis;

    /**
     * AI建议的干预方案列表
     */
    private List<String> interventionPlans;

    /**
     * 预计恢复时间
     */
    private String estimatedRecovery;
}
