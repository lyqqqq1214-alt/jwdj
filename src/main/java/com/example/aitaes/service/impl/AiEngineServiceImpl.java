package com.example.aitaes.service.impl;

import com.example.aitaes.dto.*;
import com.example.aitaes.mapper.*;
import com.example.aitaes.service.AiEngineService;
import com.example.aitaes.service.DashboardService;
import com.example.aitaes.service.OllamaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI教学分析服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiEngineServiceImpl implements AiEngineService {

    private final DashboardService dashboardService;
    private final OllamaService ollamaService;
    private final CourseStudentMapper courseStudentMapper;
    private final AssessmentMapper assessmentMapper;
    private final AssessmentRecordMapper assessmentRecordMapper;
    private final AttendanceMapper attendanceMapper;
    private final StudentKpMasteryMapper studentKpMasteryMapper;
    private final WarningRecordMapper warningRecordMapper;

    @Override
    public AiWarningRadarDTO getWarningRadar(Long courseId) {
        log.info("获取预警雷达数据: courseId={}", courseId);
        
        DashboardOverviewDTO overview = dashboardService.getOverview(courseId, null);
        List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
        
        // 计算各维度风险值
        List<AiWarningRadarDTO.WarningDimension> dimensions = new ArrayList<>();
        
        // 成绩维度
        int scoreRisk = calculateScoreRisk(overview.getAverageScore());
        long scoreWarningCount = warnings.stream()
                .filter(w -> w.getWarningType() != null && w.getWarningType().contains("成绩"))
                .count();
        dimensions.add(AiWarningRadarDTO.WarningDimension.builder()
                .dimension("成绩")
                .riskValue(scoreRisk)
                .warningCount((int) scoreWarningCount)
                .build());
        
        // 出勤维度
        int attendanceRisk = 100 - overview.getAttendanceRate().intValue();
        long attendanceWarningCount = warnings.stream()
                .filter(w -> w.getWarningType() != null && w.getWarningType().contains("出勤"))
                .count();
        dimensions.add(AiWarningRadarDTO.WarningDimension.builder()
                .dimension("出勤")
                .riskValue(attendanceRisk)
                .warningCount((int) attendanceWarningCount)
                .build());
        
        // 作业维度
        int homeworkRisk = 100 - overview.getHomeworkRate().intValue();
        long homeworkWarningCount = warnings.stream()
                .filter(w -> w.getWarningType() != null && w.getWarningType().contains("作业"))
                .count();
        dimensions.add(AiWarningRadarDTO.WarningDimension.builder()
                .dimension("作业")
                .riskValue(homeworkRisk)
                .warningCount((int) homeworkWarningCount)
                .build());
        
        // 课堂表现维度（模拟数据）
        int classPerformanceRisk = (int) (Math.random() * 30 + 20); // 20-50之间
        dimensions.add(AiWarningRadarDTO.WarningDimension.builder()
                .dimension("课堂表现")
                .riskValue(classPerformanceRisk)
                .warningCount(0)
                .build());
        
        return AiWarningRadarDTO.builder()
                .dimensions(dimensions)
                .build();
    }

    @Override
    public AiSuggestionDTO getSuggestions(Long courseId) {
        log.info("获取教学建议: courseId={}", courseId);
        
        DashboardOverviewDTO overview = dashboardService.getOverview(courseId, null);
        List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
        
        List<AiSuggestionDTO.Suggestion> suggestions = new ArrayList<>();
        
        // 根据数据生成建议
        if (overview.getAverageScore().compareTo(new BigDecimal(70)) < 0) {
            suggestions.add(AiSuggestionDTO.Suggestion.builder()
                    .type("教学方法")
                    .priority("HIGH")
                    .title("加强基础概念讲解")
                    .content("班级平均分偏低，建议增加基础概念的讲解时间，采用更多实例辅助理解")
                    .expectedEffect("预计可提升平均分5-10分")
                    .build());
        }
        
        if (overview.getAttendanceRate().compareTo(new BigDecimal(85)) < 0) {
            suggestions.add(AiSuggestionDTO.Suggestion.builder()
                    .type("课堂管理")
                    .priority("HIGH")
                    .title("提升课堂出勤率")
                    .content("出勤率低于85%，建议加强考勤管理，了解缺勤原因，必要时与家长沟通")
                    .expectedEffect("预计可提升出勤率10-15%")
                    .build());
        }
        
        if (overview.getHomeworkRate().compareTo(new BigDecimal(80)) < 0) {
            suggestions.add(AiSuggestionDTO.Suggestion.builder()
                    .type("学生辅导")
                    .priority("MEDIUM")
                    .title("关注作业提交情况")
                    .content("作业提交率偏低，建议了解学生困难，调整作业难度或提供辅导")
                    .expectedEffect("预计可提升作业提交率15-20%")
                    .build());
        }
        
        if (!warnings.isEmpty()) {
            suggestions.add(AiSuggestionDTO.Suggestion.builder()
                    .type("学生辅导")
                    .priority("HIGH")
                    .title("重点关注预警学生")
                    .content(String.format("有%d名学生处于预警状态，建议进行一对一辅导和关怀", warnings.size()))
                    .expectedEffect("帮助预警学生改善学习状态")
                    .build());
        }
        
        // 默认建议
        if (suggestions.isEmpty()) {
            suggestions.add(AiSuggestionDTO.Suggestion.builder()
                    .type("课程优化")
                    .priority("LOW")
                    .title("保持当前教学节奏")
                    .content("班级整体表现良好，建议继续保持当前教学节奏，可适当增加拓展内容")
                    .expectedEffect("维持良好学习状态")
                    .build());
        }
        
        return AiSuggestionDTO.builder()
                .suggestions(suggestions)
                .build();
    }

    @Override
    public AiTrendPredictionDTO getTrendPrediction(Long courseId) {
        log.info("获取趋势预测: courseId={}", courseId);
        
        DashboardChartsDTO charts = dashboardService.getCharts(courseId, null);
        
        // 历史数据
        List<AiTrendPredictionDTO.TrendPoint> historicalData = new ArrayList<>();
        if (charts.getScoreTrend() != null) {
            for (ChartItem item : charts.getScoreTrend()) {
                historicalData.add(AiTrendPredictionDTO.TrendPoint.builder()
                        .timePoint(item.getName())
                        .value(item.getValue().doubleValue())
                        .dataType("SCORE")
                        .build());
            }
        }
        
        // 预测数据（简单线性 extrapolation）
        List<AiTrendPredictionDTO.TrendPoint> predictionData = new ArrayList<>();
        if (!historicalData.isEmpty()) {
            double lastValue = historicalData.get(historicalData.size() - 1).getValue();
            double trend = 0;
            if (historicalData.size() >= 2) {
                double prevValue = historicalData.get(historicalData.size() - 2).getValue();
                trend = lastValue - prevValue;
            }
            
            // 预测未来3个时间点
            for (int i = 1; i <= 3; i++) {
                predictionData.add(AiTrendPredictionDTO.TrendPoint.builder()
                        .timePoint("第" + (historicalData.size() + i) + "周")
                        .value(lastValue + trend * i)
                        .dataType("SCORE")
                        .build());
            }
        }
        
        // 判断趋势方向
        String trendDirection = determineTrendDirection(historicalData);
        
        return AiTrendPredictionDTO.builder()
                .historicalData(historicalData)
                .predictionData(predictionData)
                .trendDirection(trendDirection)
                .predictionAccuracy(75) // 模拟准确率
                .build();
    }

    // 辅助方法
    private int calculateScoreRisk(BigDecimal averageScore) {
        if (averageScore == null) return 50;
        return Math.max(0, 100 - averageScore.intValue());
    }

    private String determineTrendDirection(List<AiTrendPredictionDTO.TrendPoint> historicalData) {
        if (historicalData.size() < 2) return "STABLE";
        
        double last = historicalData.get(historicalData.size() - 1).getValue();
        double first = historicalData.get(0).getValue();
        double change = last - first;
        
        if (change > 5) return "UP";
        if (change < -5) return "DOWN";
        return "STABLE";
    }

    @Override
    public AiDiagnosisDTO getAiDiagnosis(Long courseId) {
        log.info("生成AI智能诊断报告: courseId={}", courseId);
        
        try {
            DashboardOverviewDTO overview = dashboardService.getOverview(courseId, null);
            DashboardChartsDTO charts = dashboardService.getCharts(courseId, null);
            List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
            
            // 构建AI诊断提示
            String prompt = buildDiagnosisPrompt(overview, charts, warnings);
            
            // 调用AI生成诊断
            String aiResponse = ollamaService.generate(prompt);
            
            // 解析AI响应
            return parseDiagnosisResponse(aiResponse, overview, warnings);
        } catch (Exception e) {
            log.error("AI诊断生成失败: {}", e.getMessage(), e);
            // 降级处理：返回基础诊断
            return buildFallbackDiagnosis(courseId);
        }
    }

    @Override
    public List<AiWarningStudentAnalysisDTO> getWarningStudentAnalysis(Long courseId) {
        log.info("生成预警学生深度分析: courseId={}", courseId);
        
        try {
            List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
            
            if (warnings.isEmpty()) {
                return Collections.emptyList();
            }
            
            List<AiWarningStudentAnalysisDTO> analyses = new ArrayList<>();
            
            for (WarningStudentDTO warning : warnings) {
                // 为每个学生构建分析提示
                String prompt = buildStudentAnalysisPrompt(warning);
                
                // 调用AI生成分析
                String aiResponse = ollamaService.generate(prompt);
                
                // 解析并构建分析结果
                analyses.add(parseStudentAnalysisResponse(warning, aiResponse));
            }
            
            return analyses;
        } catch (Exception e) {
            log.error("预警学生分析生成失败: {}", e.getMessage(), e);
            // 降级处理
            return buildFallbackWarningAnalysis(courseId);
        }
    }

    @Override
    public AiKnowledgePredictionDTO getKnowledgePrediction(Long courseId) {
        log.info("生成AI知识点掌握预测: courseId={}", courseId);
        
        try {
            DashboardChartsDTO charts = dashboardService.getCharts(courseId, null);
            
            if (charts.getKnowledgeRadar() == null || charts.getKnowledgeRadar().isEmpty()) {
                return buildEmptyKnowledgePrediction();
            }
            
            // 构建知识点分析提示
            String prompt = buildKnowledgePredictionPrompt(charts.getKnowledgeRadar());
            
            // 调用AI生成预测
            String aiResponse = ollamaService.generate(prompt);
            
            // 解析AI响应
            return parseKnowledgePredictionResponse(aiResponse, charts.getKnowledgeRadar());
        } catch (Exception e) {
            log.error("知识点预测生成失败: {}", e.getMessage(), e);
            // 降级处理
            return buildFallbackKnowledgePrediction(courseId);
        }
    }

    // ========== AI提示词构建方法 ==========

    private String buildDiagnosisPrompt(DashboardOverviewDTO overview, DashboardChartsDTO charts, List<WarningStudentDTO> warnings) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位资深的教学分析专家。请基于以下教学数据进行诊断分析：\n\n");
        
        prompt.append("【教学数据】\n");
        prompt.append(String.format("- 班级人数: %d人\n", overview.getStudentCount()));
        prompt.append(String.format("- 平均分: %.1f分\n", overview.getAverageScore()));
        prompt.append(String.format("- 出勤率: %.1f%%\n", overview.getAttendanceRate()));
        prompt.append(String.format("- 作业提交率: %.1f%%\n", overview.getHomeworkRate()));
        prompt.append(String.format("- 预警人数: %d人\n\n", warnings.size()));
        
        if (!warnings.isEmpty()) {
            prompt.append("【预警学生情况】\n");
            for (WarningStudentDTO w : warnings) {
                prompt.append(String.format("- %s: %s\n", w.getName(), w.getWarningMsg()));
            }
            prompt.append("\n");
        }
        
        prompt.append("请提供以下分析（用JSON格式返回）：\n");
        prompt.append("{\n");
        prompt.append("  \"summary\": \"诊断摘要（50字以内）\",\n");
        prompt.append("  \"keyFindings\": \"核心问题发现（100字以内）\",\n");
        prompt.append("  \"improvementDirection\": \"教学改进方向（100字以内）\",\n");
        prompt.append("  \"urgency\": \"URGENT/IMPORTANT/NORMAL\"\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }

    private String buildStudentAnalysisPrompt(WarningStudentDTO warning) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位学生辅导专家。请分析以下预警学生情况：\n\n");
        
        prompt.append(String.format("学生姓名: %s\n", warning.getName()));
        prompt.append(String.format("预警原因: %s\n", warning.getWarningMsg()));
        prompt.append(String.format("预警类型: %s\n\n", warning.getWarningType()));
        
        prompt.append("请提供以下分析（用JSON格式返回）：\n");
        prompt.append("{\n");
        prompt.append("  \"problemAnalysis\": \"问题分析（80字以内）\",\n");
        prompt.append("  \"interventionPlans\": [\"干预方案1\", \"干预方案2\", \"干预方案3\"],\n");
        prompt.append("  \"estimatedRecovery\": \"预计恢复时间（如：2-3周）\"\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }

    private String buildKnowledgePredictionPrompt(List<ChartItem> knowledgeRadar) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位教学知识点分析专家。请基于以下知识点掌握数据进行分析：\n\n");
        
        prompt.append("【知识点掌握情况】\n");
        for (ChartItem item : knowledgeRadar) {
            prompt.append(String.format("- %s: 掌握度 %d%%\n", item.getName(), item.getValue().intValue()));
        }
        prompt.append("\n");
        
        prompt.append("请提供以下分析（用JSON格式返回）：\n");
        prompt.append("{\n");
        prompt.append("  \"difficultPoints\": [\n");
        prompt.append("    {\"name\": \"知识点名称\", \"difficultyLevel\": \"EASY/MEDIUM/HARD/VERY_HARD\", \"aiAnalysis\": \"分析原因（50字以内）\"}\n");
        prompt.append("  ],\n");
        prompt.append("  \"aiTeachingSuggestion\": \"教学建议（100字以内）\",\n");
        prompt.append("  \"suggestedExtraHours\": 建议增加的教学时长（整数）,\n");
        prompt.append("  \"predictedMasteryRate\": 预测掌握率（整数，0-100）\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }

    // ========== AI响应解析方法 ==========

    private AiDiagnosisDTO parseDiagnosisResponse(String aiResponse, DashboardOverviewDTO overview, List<WarningStudentDTO> warnings) {
        try {
            // 简单的JSON解析（实际项目中建议使用Jackson）
            String summary = extractJsonField(aiResponse, "summary");
            String keyFindings = extractJsonField(aiResponse, "keyFindings");
            String improvementDirection = extractJsonField(aiResponse, "improvementDirection");
            String urgency = extractJsonField(aiResponse, "urgency");
            
            return AiDiagnosisDTO.builder()
                    .summary(summary != null ? summary : "AI诊断生成中...")
                    .keyFindings(keyFindings != null ? keyFindings : "正在分析教学数据...")
                    .improvementDirection(improvementDirection != null ? improvementDirection : "请稍候...")
                    .urgency(urgency != null ? urgency : "NORMAL")
                    .diagnosedAt(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .build();
        } catch (Exception e) {
            log.error("解析AI诊断响应失败: {}", e.getMessage());
            return buildFallbackDiagnosis(null);
        }
    }

    private AiWarningStudentAnalysisDTO parseStudentAnalysisResponse(WarningStudentDTO warning, String aiResponse) {
        try {
            String problemAnalysis = extractJsonField(aiResponse, "problemAnalysis");
            String estimatedRecovery = extractJsonField(aiResponse, "estimatedRecovery");
            List<String> interventionPlans = extractJsonArray(aiResponse, "interventionPlans");
            
            return AiWarningStudentAnalysisDTO.builder()
                    .studentId(warning.getStudentId())
                    .studentName(warning.getName())
                    .studentNo(warning.getStudentNo())
                    .warningReason(warning.getWarningMsg())
                    .aiProblemAnalysis(problemAnalysis != null ? problemAnalysis : "AI分析中...")
                    .interventionPlans(interventionPlans != null ? interventionPlans : Arrays.asList("建议一", "建议二", "建议三"))
                    .estimatedRecovery(estimatedRecovery != null ? estimatedRecovery : "待定")
                    .build();
        } catch (Exception e) {
            log.error("解析学生分析响应失败: {}", e.getMessage());
            return buildFallbackStudentAnalysis(warning);
        }
    }

    private AiKnowledgePredictionDTO parseKnowledgePredictionResponse(String aiResponse, List<ChartItem> knowledgeRadar) {
        try {
            String aiTeachingSuggestion = extractJsonField(aiResponse, "aiTeachingSuggestion");
            Integer suggestedExtraHours = extractJsonInt(aiResponse, "suggestedExtraHours");
            Integer predictedMasteryRate = extractJsonInt(aiResponse, "predictedMasteryRate");
            
            List<AiKnowledgePredictionDTO.KnowledgePredictionItem> difficultPoints = new ArrayList<>();
            // 简化处理：取掌握度最低的3个知识点
            knowledgeRadar.stream()
                    .sorted(Comparator.comparing(ChartItem::getValue))
                    .limit(3)
                    .forEach(item -> {
                        difficultPoints.add(AiKnowledgePredictionDTO.KnowledgePredictionItem.builder()
                                .name(item.getName())
                                .currentMastery(item.getValue().intValue())
                                .difficultyLevel(item.getValue().intValue() < 50 ? "VERY_HARD" : item.getValue().intValue() < 70 ? "HARD" : "MEDIUM")
                                .aiAnalysis("需要加强练习和辅导")
                                .build());
                    });
            
            return AiKnowledgePredictionDTO.builder()
                    .difficultPoints(difficultPoints)
                    .aiTeachingSuggestion(aiTeachingSuggestion != null ? aiTeachingSuggestion : "建议针对薄弱知识点进行专项训练")
                    .suggestedExtraHours(suggestedExtraHours != null ? suggestedExtraHours : 2)
                    .predictedMasteryRate(predictedMasteryRate != null ? predictedMasteryRate : 70)
                    .build();
        } catch (Exception e) {
            log.error("解析知识点预测响应失败: {}", e.getMessage());
            return buildFallbackKnowledgePrediction(null);
        }
    }

    // ========== JSON解析辅助方法 ==========

    private String extractJsonField(String json, String field) {
        try {
            String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]*)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            log.debug("JSON字段提取失败: {}", field);
        }
        return null;
    }

    private Integer extractJsonInt(String json, String field) {
        try {
            String pattern = "\"" + field + "\"\\s*:\\s*(\\d+)";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return Integer.parseInt(m.group(1));
            }
        } catch (Exception e) {
            log.debug("JSON整数字段提取失败: {}", field);
        }
        return null;
    }

    private List<String> extractJsonArray(String json, String field) {
        try {
            String pattern = "\"" + field + "\"\\s*:\\s*\\[(.*?)\\]";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern, java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                String arrayContent = m.group(1);
                List<String> result = new ArrayList<>();
                java.util.regex.Pattern itemPattern = java.util.regex.Pattern.compile("\"([^\"]*)\"");
                java.util.regex.Matcher itemMatcher = itemPattern.matcher(arrayContent);
                while (itemMatcher.find()) {
                    result.add(itemMatcher.group(1));
                }
                return result;
            }
        } catch (Exception e) {
            log.debug("JSON数组提取失败: {}", field);
        }
        return null;
    }

    // ========== 降级处理方法 ==========

    private AiDiagnosisDTO buildFallbackDiagnosis(Long courseId) {
        return AiDiagnosisDTO.builder()
                .summary("AI诊断服务暂时不可用，显示基础数据")
                .keyFindings("系统正在努力生成智能诊断，请稍后刷新页面")
                .improvementDirection("建议关注班级整体学习状态和学生个体差异")
                .urgency("NORMAL")
                .diagnosedAt(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .build();
    }

    private List<AiWarningStudentAnalysisDTO> buildFallbackWarningAnalysis(Long courseId) {
        List<WarningStudentDTO> warnings = dashboardService.getWarnings(courseId, null);
        return warnings.stream()
                .map(this::buildFallbackStudentAnalysis)
                .collect(Collectors.toList());
    }

    private AiWarningStudentAnalysisDTO buildFallbackStudentAnalysis(WarningStudentDTO warning) {
        return AiWarningStudentAnalysisDTO.builder()
                .studentId(warning.getStudentId())
                .studentName(warning.getName())
                .studentNo(warning.getStudentNo())
                .warningReason(warning.getWarningMsg())
                .aiProblemAnalysis("AI分析服务暂时不可用")
                .interventionPlans(Arrays.asList("建议与学生进行一对一谈话", "关注学生学习状态", "必要时联系家长"))
                .estimatedRecovery("待定")
                .build();
    }

    private AiKnowledgePredictionDTO buildEmptyKnowledgePrediction() {
        return AiKnowledgePredictionDTO.builder()
                .difficultPoints(Collections.emptyList())
                .aiTeachingSuggestion("暂无知识点数据")
                .suggestedExtraHours(0)
                .predictedMasteryRate(0)
                .build();
    }

    private AiKnowledgePredictionDTO buildFallbackKnowledgePrediction(Long courseId) {
        return AiKnowledgePredictionDTO.builder()
                .difficultPoints(Collections.emptyList())
                .aiTeachingSuggestion("AI预测服务暂时不可用，建议关注学生薄弱知识点")
                .suggestedExtraHours(2)
                .predictedMasteryRate(70)
                .build();
    }
}
