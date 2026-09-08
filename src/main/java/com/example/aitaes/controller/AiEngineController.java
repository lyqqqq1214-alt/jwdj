package com.example.aitaes.controller;

import com.example.aitaes.common.Result;
import com.example.aitaes.dto.*;
import com.example.aitaes.service.AiEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI教学分析控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/ai-engine")
@RequiredArgsConstructor
public class AiEngineController {

    private final AiEngineService aiEngineService;

    /**
     * 获取预警雷达数据
     */
    @GetMapping("/warning-radar/{courseId}")
    public Result<AiWarningRadarDTO> getWarningRadar(@PathVariable Long courseId) {
        log.info("获取预警雷达数据: courseId={}", courseId);
        AiWarningRadarDTO radar = aiEngineService.getWarningRadar(courseId);
        return Result.success(radar);
    }

    /**
     * 获取教学建议
     */
    @GetMapping("/suggestions/{courseId}")
    public Result<AiSuggestionDTO> getSuggestions(@PathVariable Long courseId) {
        log.info("获取教学建议: courseId={}", courseId);
        AiSuggestionDTO suggestions = aiEngineService.getSuggestions(courseId);
        return Result.success(suggestions);
    }

    /**
     * 获取趋势预测数据
     */
    @GetMapping("/trend/{courseId}")
    public Result<AiTrendPredictionDTO> getTrendPrediction(@PathVariable Long courseId) {
        log.info("获取趋势预测: courseId={}", courseId);
        AiTrendPredictionDTO trend = aiEngineService.getTrendPrediction(courseId);
        return Result.success(trend);
    }

    /**
     * 获取AI智能诊断报告
     */
    @GetMapping("/diagnosis/{courseId}")
    public Result<AiDiagnosisDTO> getAiDiagnosis(@PathVariable Long courseId) {
        log.info("获取AI智能诊断: courseId={}", courseId);
        AiDiagnosisDTO diagnosis = aiEngineService.getAiDiagnosis(courseId);
        return Result.success(diagnosis);
    }

    /**
     * 获取预警学生深度分析
     */
    @GetMapping("/warning-students/{courseId}")
    public Result<List<AiWarningStudentAnalysisDTO>> getWarningStudentAnalysis(@PathVariable Long courseId) {
        log.info("获取预警学生深度分析: courseId={}", courseId);
        List<AiWarningStudentAnalysisDTO> analyses = aiEngineService.getWarningStudentAnalysis(courseId);
        return Result.success(analyses);
    }

    /**
     * 获取AI知识点掌握预测
     */
    @GetMapping("/knowledge-prediction/{courseId}")
    public Result<AiKnowledgePredictionDTO> getKnowledgePrediction(@PathVariable Long courseId) {
        log.info("获取AI知识点预测: courseId={}", courseId);
        AiKnowledgePredictionDTO prediction = aiEngineService.getKnowledgePrediction(courseId);
        return Result.success(prediction);
    }
}
