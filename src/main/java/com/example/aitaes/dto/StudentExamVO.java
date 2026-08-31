package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 学生端考试卷面视图（试卷信息 + 题目列表，剥离答案/解析，防止泄题）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamVO {

    private Long paperId;
    private String paperName;
    private Long courseId;
    private BigDecimal totalScore;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;

    private List<QuestionItem> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionItem {
        private Long questionId;
        private Integer questionNo;
        private String questionType;
        private BigDecimal score;
        private String stem;
        private List<Option> options;
        private String knowledgePoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        private String label;
        private String text;
    }
}
