package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 交卷结果（学生交卷后即时返回）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitExamResultDTO {

    /** 客观题得分（交卷时自动批改） */
    private BigDecimal objectiveScore;

    /** 当前总分（=客观题得分，主观题待批阅后由教师回填） */
    private BigDecimal totalScore;

    /** 客观题数量 */
    private Integer objectiveCount;

    /** 主观题数量（待批阅） */
    private Integer subjectiveCount;
}
