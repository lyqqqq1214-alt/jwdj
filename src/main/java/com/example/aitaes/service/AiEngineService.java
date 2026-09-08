package com.example.aitaes.service;

import com.example.aitaes.dto.*;

import java.util.List;

/**
 * AI教学分析服务接口
 */
public interface AiEngineService {

    /**
     * 获取预警雷达数据
     *
     * @param courseId 课程ID
     * @return 预警雷达数据
     */
    AiWarningRadarDTO getWarningRadar(Long courseId);

    /**
     * 获取教学建议
     *
     * @param courseId 课程ID
     * @return 教学建议
     */
    AiSuggestionDTO getSuggestions(Long courseId);

    /**
     * 获取趋势预测数据
     *
     * @param courseId 课程ID
     * @return 趋势预测数据
     */
    AiTrendPredictionDTO getTrendPrediction(Long courseId);

    /**
     * 获取AI智能诊断报告
     *
     * @param courseId 课程ID
     * @return AI诊断报告
     */
    AiDiagnosisDTO getAiDiagnosis(Long courseId);

    /**
     * 获取预警学生深度分析（AI生成个性化干预方案）
     *
     * @param courseId 课程ID
     * @return 预警学生分析列表
     */
    List<AiWarningStudentAnalysisDTO> getWarningStudentAnalysis(Long courseId);

    /**
     * 获取AI知识点掌握预测
     *
     * @param courseId 课程ID
     * @return 知识点预测分析
     */
    AiKnowledgePredictionDTO getKnowledgePrediction(Long courseId);
}
