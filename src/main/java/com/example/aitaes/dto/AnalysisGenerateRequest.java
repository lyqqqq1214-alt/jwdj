package com.example.aitaes.dto;

import lombok.Data;

import java.util.Map;

/**
 * AI 生成题目解析请求
 */
@Data
public class AnalysisGenerateRequest {
    /** 题型：SINGLE/MULTI/FILL/SHORT/COMPREHENSIVE */
    private String questionType;
    /** 难度：EASY/MEDIUM/HARD */
    private String difficulty;
    /** 知识点（逗号分隔） */
    private String knowledgePoints;
    /** 题干 */
    private String stem;
    /** 选项（选择题；非选择题为空 Map） */
    private Map<String, String> options;
    /** 答案 */
    private String answer;
}
