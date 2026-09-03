package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 考试结果统计
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultDTO {

    private BigDecimal averageScore;
    private BigDecimal maxScore;
    private BigDecimal minScore;
    private BigDecimal passRate;
    private Integer totalStudents;
    private Integer submittedCount;
    private List<ChartItem> scoreDistribution;
    private List<QuestionStat> questionStats;
    private List<StudentScoreItem> studentScores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionStat {
        private Integer questionNo;
        private BigDecimal correctRate;
        private String questionType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentScoreItem {
        private Long studentId;
        private String studentNo;
        private String name;
        private BigDecimal totalScore;
        private String submitStatus;
        private String submitTime;
    }
}
