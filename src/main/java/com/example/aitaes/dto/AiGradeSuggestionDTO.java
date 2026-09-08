package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

/** AI 对主观题给出的预评分建议；不会直接写入最终成绩。 */
@Data
@AllArgsConstructor
public class AiGradeSuggestionDTO {
    private BigDecimal suggestedScore;
    private String comment;
}
