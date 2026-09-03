package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 分数分布 DTO（柱状图用）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDistributionDTO {

    /** 分数段标签 */
    private String label;

    /** 该分数段课程数 */
    private Long count;

    /** 占比 */
    private Double percentage;
}
