package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI智能诊断报告DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDiagnosisDTO {

    /**
     * 诊断摘要
     */
    private String summary;

    /**
     * 核心问题发现
     */
    private String keyFindings;

    /**
     * 教学改进方向
     */
    private String improvementDirection;

    /**
     * 紧急程度：URGENT/IMPORTANT/NORMAL
     */
    private String urgency;

    /**
     * 诊断时间
     */
    private String diagnosedAt;
}
