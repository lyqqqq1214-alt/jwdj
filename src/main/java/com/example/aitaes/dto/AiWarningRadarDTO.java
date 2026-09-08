package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI预警雷达数据DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiWarningRadarDTO {

    /**
     * 预警维度数据
     */
    private List<WarningDimension> dimensions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarningDimension {
        /**
         * 维度名称：成绩/出勤/作业/课堂表现
         */
        private String dimension;

        /**
         * 风险值(0-100)
         */
        private Integer riskValue;

        /**
         * 预警学生数
         */
        private Integer warningCount;
    }
}
