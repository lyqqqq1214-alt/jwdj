package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI趋势预测DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTrendPredictionDTO {

    /**
     * 历史趋势数据
     */
    private List<TrendPoint> historicalData;

    /**
     * 预测趋势数据
     */
    private List<TrendPoint> predictionData;

    /**
     * 趋势方向：UP/DOWN/STABLE
     */
    private String trendDirection;

    /**
     * 预测准确率(0-100)
     */
    private Integer predictionAccuracy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        /**
         * 时间点（日期或周次）
         */
        private String timePoint;

        /**
         * 数值（平均分、出勤率等）
         */
        private Double value;

        /**
         * 数据类型：SCORE/ATTENDANCE/HOMEWORK
         */
        private String dataType;
    }
}
