package com.example.aitaes.service;

import com.example.aitaes.dto.AiAnalysisReportDTO;
import com.example.aitaes.dto.AiAnalysisTrendDTO;
import com.example.aitaes.dto.QuestionBankAuditDTO;

/**
 * AI 智能分析引擎服务接口
 * <p>
 * 面向教师的自动分析：无需问答交互，一键对课程数据做短板分析、
 * 提前预警与报告生成，并对题库做整理判断。
 */
public interface AiAnalysisService {

    /**
     * 生成课程智能分析报告（模块化），并持久化存储以便后续对比变化。
     */
    AiAnalysisReportDTO generateReport(Long courseId);

    /**
     * 题库整理判断
     */
    QuestionBankAuditDTO auditQuestionBank(Long courseId);

    /**
     * 获取课程分析数据的变化趋势（对比最近两次报告）
     * <p>
     * 教师可直观看到数据更新的变化：到课率、平均分、预警人数、
     * 需再讲知识点数的增减，以及知识点掌握率变化明细。
     *
     * @param courseId 课程ID
     * @return 变化对比结果；若无历史报告则 hasPrevious=false
     */
    AiAnalysisTrendDTO getTrend(Long courseId);
}
