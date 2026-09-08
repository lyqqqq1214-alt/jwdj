package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI洞察播报DTO（用于驾驶舱顶部播报和指标点评）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInsightDTO {
    
    /**
     * 播报内容（自然语言，AI生成）
     */
    private String broadcast;
    
    /**
     * 指标点评列表
     */
    private List<MetricComment> metricComments;
    
    /**
     * 紧急程度：URGENT/IMPORTANT/NORMAL
     */
    private String urgency;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricComment {
        /**
         * 指标名称
         */
        private String metricName;
        
        /**
         * 点评内容
         */
        private String comment;
        
        /**
         * 趋势：UP/DOWN/STABLE
         */
        private String trend;
    }
}
