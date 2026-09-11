package com.example.aitaes.controller;

import com.example.aitaes.annotation.RequireRole;
import com.example.aitaes.common.Result;
import com.example.aitaes.dto.AiAnalysisReportDTO;
import com.example.aitaes.dto.AiAnalysisTrendDTO;
import com.example.aitaes.dto.QuestionBankAuditDTO;
import com.example.aitaes.service.AiAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * AI 智能分析引擎控制器（教师/助教）
 * <p>
 * 一键生成课程智能分析报告（模块化：到课率短板 / 知识点再讲 / 学生综合预警 /
 * 成绩分析 / 评价反馈）与题库整理判断，无需问答交互。
 */
@Slf4j
@RestController
@RequestMapping("/api/ai-analysis")
@RequiredArgsConstructor
@RequireRole({"TEACHER", "ASSISTANT"})
public class AiAnalysisController {

    private final AiAnalysisService aiAnalysisService;

    /**
     * 生成课程智能分析报告
     */
    @GetMapping("/report")
    public Result<AiAnalysisReportDTO> report(@RequestParam Long courseId) {
        return Result.success(aiAnalysisService.generateReport(courseId));
    }

    /**
     * 题库整理判断
     */
    @GetMapping("/question-bank-audit")
    public Result<QuestionBankAuditDTO> questionBankAudit(@RequestParam Long courseId) {
        return Result.success(aiAnalysisService.auditQuestionBank(courseId));
    }

    /**
     * 分析数据变化趋势（对比最近两次报告，让教师看到数据更新的变化）
     */
    @GetMapping("/trend")
    public Result<AiAnalysisTrendDTO> trend(@RequestParam Long courseId) {
        return Result.success(aiAnalysisService.getTrend(courseId));
    }
}
