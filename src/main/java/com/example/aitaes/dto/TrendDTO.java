package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 学期趋势 DTO（折线图用）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDTO {

    /** 学期列表（x轴） */
    private List<String> semesters;

    /** 综合平均分趋势 */
    private List<BigDecimal> overallScores;

    /** 各维度趋势（四条折线） */
    private List<CategoryTrend> categoryTrends;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryTrend {
        private String category;
        private List<BigDecimal> scores;
    }
}
