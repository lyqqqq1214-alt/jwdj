package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI知识点掌握预测DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiKnowledgePredictionDTO {

    /**
     * 预测的难点知识点列表
     */
    private List<KnowledgePredictionItem> difficultPoints;

    /**
     * AI教学建议
     */
    private String aiTeachingSuggestion;

    /**
     * 建议增加的教学时长（小时）
     */
    private Integer suggestedExtraHours;

    /**
     * 预测掌握率
     */
    private Integer predictedMasteryRate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KnowledgePredictionItem {
        /**
         * 知识点名称
         */
        private String name;

        /**
         * 当前掌握度
         */
        private Integer currentMastery;

        /**
         * 预测难度等级：EASY/MEDIUM/HARD/VERY_HARD
         */
        private String difficultyLevel;

        /**
         * AI分析原因
         */
        private String aiAnalysis;
    }
}
