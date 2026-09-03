package com.example.aitaes.service;

import com.example.aitaes.dto.AiAnalysisReportDTO;
import com.example.aitaes.dto.QuestionBankAuditDTO;

/**
 * AI 智能分析引擎服务接口
 * <p>
 * 面向教师的自动分析：无需问答交互，一键对课程数据做短板分析、
 * 提前预警与报告生成，并对题库做整理判断。
 */
public interface AiAnalysisService {

    /**
     * 生成课程智能分析报告（模块化）
     * <p>
     * 模块：到课率短板分析 / 知识点再讲建议 / 学生综合预警（整合考勤、作业、考试）/
     * 成绩分析 / 教学评价反馈。统计由本地规则计算，AI 总评可选增强（失败自动降级）。
     *
     * @param courseId 课程ID
     * @return 模块化分析报告
     */
    AiAnalysisReportDTO generateReport(Long courseId);

    /**
     * 题库整理判断
     * <p>
     * 统计题型分布、知识点覆盖、疑似重复题、质量评分，并给出整理建议。
     * 规则统计本地计算，AI 综合判断可选增强（失败自动降级）。
     *
     * @param courseId 课程ID
     * @return 题库体检结果
     */
    QuestionBankAuditDTO auditQuestionBank(Long courseId);
}
