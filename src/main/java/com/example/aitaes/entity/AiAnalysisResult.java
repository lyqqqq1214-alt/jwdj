package com.example.aitaes.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * AI 分析结果 - 存储AI引擎的分析输出
 */
@Data
@TableName("t_ai_analysis_result")
public class AiAnalysisResult {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 分析类型：TEXT_ANALYSIS / SENTIMENT / TREND / SUGGESTION */
    private String analysisType;

    /** 分析目标ID（教师/课程/报告等） */
    private Long targetId;

    /** 目标类型：TEACHER / COURSE / REPORT */
    private String targetType;

    /** AI分析结果（JSON） */
    private String resultData;

    /** AI模型名称 */
    private String modelName;

    /** 分析时间 */
    private LocalDateTime analysisTime;

    /** 逻辑删除（0=正常, 1=删除） */
    private Integer deleted;
}
