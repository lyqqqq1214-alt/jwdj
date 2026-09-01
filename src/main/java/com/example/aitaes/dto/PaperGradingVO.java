package com.example.aitaes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 按学生分组的整卷批阅视图
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaperGradingVO {

    private Long paperId;
    private String paperName;
    private BigDecimal totalScore;
    private List<StudentItem> students;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentItem {
        private Long recordId;
        private Long studentId;
        private String studentNo;
        private String studentName;
        private LocalDateTime submitTime;
        /** 客观题得分 */
        private BigDecimal objectiveScore;
        /** 当前总分 */
        private BigDecimal totalScore;
        /** 该生未批主观题数 */
        private Integer pendingCount;
        private List<QuestionItem> questions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionItem {
        private Long answerId;
        private Long questionId;
        private Integer questionNo;
        private String questionType;
        private String stem;
        private List<StudentExamVO.Option> options;
        private String studentAnswer;
        private String correctAnswer;
        private BigDecimal maxScore;
        private BigDecimal score;
        private Integer graded;
        private String comment;
    }
}
